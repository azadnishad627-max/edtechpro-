import sys
import re

with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State for Admin Status
admin_status_state = """
  const [adminStatus, setAdminStatus] = useState({ is_online: false, last_seen: null });
"""
if "const [adminStatus" not in content:
    content = content.replace("const [adminChatHistory, setAdminChatHistory] = useState([]);", "const [adminChatHistory, setAdminChatHistory] = useState([]);\n" + admin_status_state)

# 2. Add Student Heartbeat
heartbeat_logic = """
  useEffect(() => {
    if (!student) return;
    const updateOnlineStatus = async () => {
      await supabase.from('profiles').update({ is_online: true, last_seen: new Date().toISOString() }).eq('id', student.id);
    };
    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 60000);
    
    const setOffline = () => {
      supabase.from('profiles').update({ is_online: false, last_seen: new Date().toISOString() }).eq('id', student.id);
    };
    window.addEventListener('beforeunload', setOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, [student]);
"""
if "updateOnlineStatus = async ()" not in content:
    content = content.replace("useEffect(() => {\n    if (!student) return;", heartbeat_logic + "\n  useEffect(() => {\n    if (!student) return;")

# 3. Update fetchAdminChats to fetch admin_status and mark unread as read
fetch_search = """
    const fetchAdminChats = async () => {
      const sData = localStorage.getItem('studentInfo');
      if (!sData) return;
      const student = JSON.parse(sData);
      
      const { data, error } = await supabase
        .from('admin_chats')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: true });
        
      if (data) setAdminChatHistory(data);
    };
"""
fetch_replace = """
    const fetchAdminChats = async () => {
      const sData = localStorage.getItem('studentInfo');
      if (!sData) return;
      const student = JSON.parse(sData);
      
      const { data } = await supabase
        .from('admin_chats')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: true });
        
      if (data) {
        setAdminChatHistory(data);
        const unread = data.filter(m => m.sender === 'admin' && !m.is_read).map(m => m.id);
        if (unread.length > 0) {
          supabase.from('admin_chats').update({ is_read: true }).in('id', unread).then(() => {
             setAdminChatHistory(prev => prev.map(m => unread.includes(m.id) ? { ...m, is_read: true } : m));
          });
        }
      }
      
      const { data: statusData } = await supabase.from('admin_status').select('*').eq('id', 1).single();
      if (statusData) setAdminStatus(statusData);
    };
"""
if "statusData" not in content:
    content = content.replace(fetch_search.strip(), fetch_replace.strip())

# 4. Add message delete handler
delete_handler = """
  const handleDeleteMessage = async (msg) => {
    const isMine = msg.sender === 'student';
    const options = isMine ? "1. Delete for Me\\n2. Delete for Everyone\\nCancel" : "1. Delete for Me\\nCancel";
    const choice = window.prompt(`Type 1 or 2 to delete:\\n${options}`);
    if (choice === '1') {
      await supabase.from('admin_chats').update({ deleted_for_student: true }).eq('id', msg.id);
      setAdminChatHistory(prev => prev.map(m => m.id === msg.id ? { ...m, deleted_for_student: true } : m));
    } else if (choice === '2' && isMine) {
      await supabase.from('admin_chats').update({ is_deleted_for_everyone: true }).eq('id', msg.id);
      setAdminChatHistory(prev => prev.map(m => m.id === msg.id ? { ...m, is_deleted_for_everyone: true } : m));
    }
  };
"""
if "handleDeleteMessage" not in content:
    content = content.replace("const handleStudentFileUpload", delete_handler + "\n  const handleStudentFileUpload")

# 5. Fix Auto Scroll
scroll_old = """
    useEffect(() => {
      if (showAdminChatModal && adminChatEndRef.current) {
        adminChatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, [adminChatHistory]);
"""
scroll_new = """
    const lastMessageIdRef = useRef(null);
    useEffect(() => {
      if (!showAdminChatModal) lastMessageIdRef.current = null;
    }, [showAdminChatModal]);

    useEffect(() => {
      if (showAdminChatModal && adminChatEndRef.current) {
        const currentMsgs = adminChatHistory.filter(m => !m.deleted_for_student);
        if (currentMsgs.length > 0) {
          const lastMsg = currentMsgs[currentMsgs.length - 1];
          if (lastMsg.id !== lastMessageIdRef.current) {
            adminChatEndRef.current.scrollIntoView({ behavior: lastMessageIdRef.current ? 'smooth' : 'auto', block: 'end' });
            lastMessageIdRef.current = lastMsg.id;
          }
        }
      }
    }, [adminChatHistory, showAdminChatModal]);
"""
if "lastMessageIdRef" not in content:
    content = content.replace(scroll_old.strip(), scroll_new.strip())

# 6. Render Online Status in Chat Header
header_old = """
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' }}></div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#4CAF50', fontWeight: '500' }}>Online</p>
                </div>
"""
header_new = """
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: adminStatus.is_online ? '#4CAF50' : '#a1a1aa' }}></div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: adminStatus.is_online ? '#4CAF50' : '#a1a1aa', fontWeight: '500' }}>
                    {adminStatus.is_online ? 'Online' : `Last seen: ${adminStatus.last_seen ? new Date(adminStatus.last_seen).toLocaleString() : 'N/A'}`}
                  </p>
                </div>
"""
content = content.replace(header_old.strip(), header_new.strip())

# 7. Render Messages (Deleted, Ticks, Options)
map_pattern = r"\{adminChatHistory\.length === 0 \? \(.*?\) : \(\s*adminChatHistory\.map\(\(msg, i\) => \(\s*<div key=\{msg\.id \|\| i\} style=\{\{\s*alignSelf: msg\.sender === 'student' \? 'flex-end' : 'flex-start',.*?border: msg\.sender === 'student' \? 'none' : '1px solid var\(--glass-border\)',.*?padding: '0\.7rem 1rem',.*?borderRadius: msg\.sender === 'student' \? '18px 18px 0 18px' : '18px 18px 18px 0',.*?maxWidth: '80%',.*?wordBreak: 'break-word',.*?boxShadow: '0 2px 8px rgba\(0,0,0,0\.15\)'\s*\}\}>\s*<div style=\{\{ color: msg\.sender === 'student' \? 'white' : 'var\(--text-light\)', lineHeight: '1\.5', fontSize: '0\.95rem' \}\}>\s*\{renderChatMessage\(msg\.message\)\}\s*</div>\s*<div style=\{\{ fontSize: '0\.65rem', color: msg\.sender === 'student' \? 'rgba\(255,255,255,0\.6\)' : 'var\(--text-muted\)', marginTop: '0\.3rem', textAlign: msg\.sender === 'student' \? 'right' : 'left' \}\}>\s*\{new Date\(msg\.created_at\)\.toLocaleTimeString\(\[\], \{ hour: '2-digit', minute: '2-digit' \}\)\}\s*</div>\s*</div>\s*\)\s*\)\}"

map_replacement = """{adminChatHistory.length === 0 ? (
                <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.5, minHeight: '200px' }}>
                  <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</span>
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Send a message to start chatting<br/>with the Admin.</p>
                </div>
              ) : (
                adminChatHistory.filter(m => !m.deleted_for_student).map((msg, i) => {
                  const isMine = msg.sender === 'student';
                  const isDeleted = msg.is_deleted_for_everyone;
                  return (
                  <div key={msg.id || i} style={{ 
                    alignSelf: isMine ? 'flex-end' : 'flex-start',
                    background: isMine ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)',
                    border: isMine ? 'none' : '1px solid var(--glass-border)',
                    padding: '0.7rem 1rem',
                    borderRadius: isMine ? '18px 18px 0 18px' : '18px 18px 18px 0',
                    maxWidth: '80%',
                    wordBreak: 'break-word',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    position: 'relative',
                    minWidth: '100px'
                  }}>
                    <div onClick={() => handleDeleteMessage(msg)} style={{ position: 'absolute', top: '-5px', right: isMine ? 'auto' : '-5px', left: isMine ? '-5px' : 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>🗑️</div>
                    <div style={{ color: isMine ? 'white' : 'var(--text-light)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                      {isDeleted ? (
                        <div style={{ fontStyle: 'italic', color: '#cbd5e1' }}>🚫 This message was deleted</div>
                      ) : renderChatMessage(msg.message)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '0.7rem', color: isMine ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                      <span>{msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      {isMine && (
                        <span style={{ color: msg.is_read ? '#60a5fa' : 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
                          ✓✓
                        </span>
                      )}
                    </div>
                  </div>
                  );
                })
              )}"""

content = re.sub(map_pattern, map_replacement, content, flags=re.DOTALL)

with open(r'src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated student dashboard.")
