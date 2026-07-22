import sys
import re

# 1. ADMIN DASHBOARD
with open(r'src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add request permission on mount
permission_req = """
  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);
"""
if "Notification.requestPermission" not in content:
    content = content.replace(
        "useEffect(() => {",
        permission_req + "\n  useEffect(() => {",
        1
    )

# Add ref for activeChatStudentId
ref_add = """
  const activeChatStudentIdRef = useRef(null);
  useEffect(() => { activeChatStudentIdRef.current = activeChatStudentId; }, [activeChatStudentId]);
"""
if "activeChatStudentIdRef" not in content:
    content = content.replace(
        "const adminChatEndRef = useRef(null);",
        "const adminChatEndRef = useRef(null);\n" + ref_add
    )

# Update fetchAdminChats to trigger notification
fetch_old = """
    const fetchAdminChats = async () => {
      const { data } = await supabase
        .from('admin_chats')
        .select('*, profiles(name, photo_url, username)')
        .order('created_at', { ascending: true });
      if (data) setAdminChats(data);
    };
"""
fetch_new = """
    const fetchAdminChats = async () => {
      const { data } = await supabase
        .from('admin_chats')
        .select('*, profiles(name, photo_url, username)')
        .order('created_at', { ascending: true });
      if (data) {
        setAdminChats(prev => {
          if (prev.length > 0 && data.length > prev.length) {
            const newMessages = data.slice(prev.length);
            const newStudentMsgs = newMessages.filter(m => m.sender === 'student' && m.student_id !== activeChatStudentIdRef.current);
            if (newStudentMsgs.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const latestMsg = newStudentMsgs[newStudentMsgs.length - 1];
              const msgBody = latestMsg.message.startsWith('[ATTACHMENT') ? '📎 File attached' : latestMsg.message;
              new Notification('New message from ' + (latestMsg.profiles?.name || 'Student'), { body: msgBody });
              // Also try to play a sound if possible (may be blocked by browser without interaction)
              try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log('Audio blocked', e));
              } catch(e) {}
            }
          }
          return data;
        });
      }
    };
"""
content = content.replace(fetch_old, fetch_new)

with open(r'src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin dashboard notifications.")


# 2. STUDENT DASHBOARD
with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    content2 = f.read()

if "Notification.requestPermission" not in content2:
    content2 = content2.replace(
        "useEffect(() => {",
        permission_req + "\n  useEffect(() => {",
        1
    )

ref_add2 = """
  const showAdminChatModalRef = useRef(false);
  useEffect(() => { showAdminChatModalRef.current = showAdminChatModal; }, [showAdminChatModal]);
"""
if "showAdminChatModalRef" not in content2:
    content2 = content2.replace(
        "const adminChatEndRef = useRef(null);",
        "const adminChatEndRef = useRef(null);\n" + ref_add2
    )

fetch2_old = """
  const fetchAdminChats = async () => {
    const sData = localStorage.getItem('studentInfo');
    if (!sData) return;
    const student = JSON.parse(sData);
    
    const { data, error } = await supabase
      .from('admin_chats')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: true });
      
    if (data) {
      setAdminChatHistory(data);
    }
  };
"""
fetch2_new = """
  const fetchAdminChats = async () => {
    const sData = localStorage.getItem('studentInfo');
    if (!sData) return;
    const student = JSON.parse(sData);
    
    const { data, error } = await supabase
      .from('admin_chats')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: true });
      
    if (data) {
      setAdminChatHistory(prev => {
        if (prev.length > 0 && data.length > prev.length) {
          const newMessages = data.slice(prev.length);
          const newAdminMsgs = newMessages.filter(m => m.sender === 'admin');
          if (newAdminMsgs.length > 0 && !showAdminChatModalRef.current) {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              const latestMsg = newAdminMsgs[newAdminMsgs.length - 1];
              const msgBody = latestMsg.message.startsWith('[ATTACHMENT') ? '📎 File attached' : latestMsg.message;
              new Notification('New message from Admin', { body: msgBody });
              try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log('Audio blocked', e));
              } catch(e) {}
            }
          }
        }
        return data;
      });
    }
  };
"""
content2 = content2.replace(fetch2_old, fetch2_new)

# Modify useEffect for interval in student dashboard
# Previously it only ran if showAdminChatModal was true.
# Now we want it to run globally.
effect_old = """
  useEffect(() => {
    if (showAdminChatModal) {
      fetchAdminChats();
      const interval = setInterval(fetchAdminChats, 3000);
      return () => clearInterval(interval);
    }
  }, [showAdminChatModal, student]);
"""
effect_new = """
  useEffect(() => {
    if (!student) return;
    fetchAdminChats();
    const interval = setInterval(fetchAdminChats, 3000);
    return () => clearInterval(interval);
  }, [student]);
"""
content2 = content2.replace(effect_old, effect_new)

# And add a notification dot indicator to the Help button if unread messages
nav_item_old = """
            <button 
              onClick={() => setShowAdminChatModal(true)}
              style={{ ...sidebarItemStyle('help') }}
            >
              <span>❓</span>
              <span style={{ fontWeight: '500' }}>Help / Chat</span>
            </button>
"""
nav_item_new = """
            <button 
              onClick={() => setShowAdminChatModal(true)}
              style={{ ...sidebarItemStyle('help'), position: 'relative' }}
            >
              <span>❓</span>
              <span style={{ fontWeight: '500' }}>Help / Chat</span>
              {adminChatHistory.filter(m => m.sender === 'admin' && !m.is_read).length > 0 && (
                <div style={{ position: 'absolute', top: '10px', right: '15px', width: '10px', height: '10px', background: '#EF4444', borderRadius: '50%' }}></div>
              )}
            </button>
"""
content2 = content2.replace(nav_item_old, nav_item_new)

with open(r'src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content2)
print("Updated student dashboard notifications.")
