import sys
import re

with open(r'src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update fetchAdminChats to include new profile fields
content = content.replace(
    ".select('*, profiles(name, photo_url, username)')",
    ".select('*, profiles(name, photo_url, username, last_seen, is_online)')"
)

# 2. Add admin heartbeat
heartbeat_logic = """
  // Admin Heartbeat
  useEffect(() => {
    const updateOnlineStatus = async () => {
      await supabase.from('admin_status').upsert({ id: 1, is_online: true, last_seen: new Date().toISOString() });
    };
    updateOnlineStatus();
    const interval = setInterval(updateOnlineStatus, 60000);
    
    const setOffline = () => {
      supabase.from('admin_status').upsert({ id: 1, is_online: false, last_seen: new Date().toISOString() });
    };
    window.addEventListener('beforeunload', setOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', setOffline);
      setOffline();
    };
  }, []);
"""
if "Admin Heartbeat" not in content:
    content = content.replace("useEffect(() => {\n    if (!router) return;", heartbeat_logic + "\n  useEffect(() => {\n    if (!router) return;")

# 3. Add message delete handler
delete_handler = """
  const handleDeleteMessage = async (msg) => {
    const isMine = msg.sender === 'admin';
    const options = isMine ? "1. Delete for Me\\n2. Delete for Everyone\\nCancel" : "1. Delete for Me\\nCancel";
    const choice = window.prompt(`Type 1 or 2 to delete:\\n${options}`);
    if (choice === '1') {
      await supabase.from('admin_chats').update({ deleted_for_admin: true }).eq('id', msg.id);
      setAdminChats(prev => prev.map(m => m.id === msg.id ? { ...m, deleted_for_admin: true } : m));
    } else if (choice === '2' && isMine) {
      await supabase.from('admin_chats').update({ is_deleted_for_everyone: true }).eq('id', msg.id);
      setAdminChats(prev => prev.map(m => m.id === msg.id ? { ...m, is_deleted_for_everyone: true } : m));
    }
  };
"""
if "handleDeleteMessage" not in content:
    content = content.replace("const handleAdminFileUpload", delete_handler + "\n  const handleAdminFileUpload")

# 4. Fix Auto Scroll
scroll_old = """
    useEffect(() => {
      if (activeChatStudentId && adminChatEndRef.current) {
        adminChatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, [adminChats, activeChatStudentId]);
"""
scroll_new = """
    const lastMessageIdRef = useRef(null);
    useEffect(() => {
      lastMessageIdRef.current = null;
    }, [activeChatStudentId]);

    useEffect(() => {
      if (activeChatStudentId && adminChatEndRef.current) {
        const currentMsgs = adminChats.filter(m => m.student_id === activeChatStudentId && !m.deleted_for_admin);
        if (currentMsgs.length > 0) {
          const lastMsg = currentMsgs[currentMsgs.length - 1];
          if (lastMsg.id !== lastMessageIdRef.current) {
            adminChatEndRef.current.scrollIntoView({ behavior: lastMessageIdRef.current ? 'smooth' : 'auto', block: 'nearest' });
            lastMessageIdRef.current = lastMsg.id;
          }
        }
      }
    }, [adminChats, activeChatStudentId]);
"""
content = content.replace(scroll_old, scroll_new)

# 5. Render Online Status & Last Seen
# We need to find the chat header and inject the status
# Header currently is: <h3 style={{ margin: 0 }}>{activeStudentName}</h3>
header_search = "<h3 style={{ margin: 0 }}>{activeStudentName}</h3>"
header_replace = """
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: 0 }}>{activeStudentName}</h3>
                  {(() => {
                    const activeStudentData = adminChats.find(m => m.student_id === activeChatStudentId)?.profiles;
                    if (activeStudentData) {
                      const isOnline = activeStudentData.is_online;
                      const lastSeen = activeStudentData.last_seen ? new Date(activeStudentData.last_seen).toLocaleString() : 'N/A';
                      return (
                        <span style={{ fontSize: '0.8rem', color: isOnline ? '#10b981' : '#a1a1aa' }}>
                          {isOnline ? '🟢 Online' : `🕒 Last seen: ${lastSeen}`}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
"""
content = content.replace(header_search, header_replace)

# 6. Render Messages (Deleted, Ticks, Options)
# Replace the map block for messages
map_search = """
                {adminChats.filter(m => m.student_id === activeChatStudentId).map((msg, idx) => {
                  const isAdmin = msg.sender === 'admin';
                  return (
                    <div key={idx} style={{ alignSelf: isAdmin ? 'flex-end' : 'flex-start', maxWidth: '75%', background: isAdmin ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', color: '#fff' }}>
                      {msg.message.startsWith('[ATTACHMENT') ? (
"""
# Note: we need to filter out deleted_for_admin BEFORE mapping, or inside mapping.
# It's better to replace the whole map block. I'll use regex.
import re
map_pattern = r"\{adminChats\.filter\(m => m\.student_id === activeChatStudentId\)\.map\(\(msg, idx\) => \{.*?const isAdmin = msg\.sender === 'admin';.*?return \("
map_replacement = """{adminChats.filter(m => m.student_id === activeChatStudentId && !m.deleted_for_admin).map((msg, idx) => {
                  const isAdmin = msg.sender === 'admin';
                  const isDeleted = msg.is_deleted_for_everyone;
                  return (
                    <div key={idx} style={{ alignSelf: isAdmin ? 'flex-end' : 'flex-start', maxWidth: '75%', background: isAdmin ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '12px', color: '#fff', position: 'relative', minWidth: '100px' }}>
                      <div onClick={() => handleDeleteMessage(msg)} style={{ position: 'absolute', top: '-5px', right: isAdmin ? 'auto' : '-5px', left: isAdmin ? '-5px' : 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>🗑️</div>
                      {isDeleted ? (
                        <div style={{ fontStyle: 'italic', color: '#cbd5e1' }}>🚫 This message was deleted</div>
                      ) : msg.message.startsWith('[ATTACHMENT') ? ("""

content = re.sub(map_pattern, map_replacement, content, flags=re.DOTALL)

# Add ticks to the end of the message bubble
ticks_code = """
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        {isAdmin && (
                          <span style={{ color: msg.is_read ? '#60a5fa' : 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>
                            ✓✓
                          </span>
                        )}
                      </div>
                    </div>
"""
# Find where the message div closes. We have `</a>` or `)}` for attachments, and `<div>{msg.message}</div>` for text.
# The original code has: <div>{msg.message}</div>)}
content = content.replace("<div>{msg.message}</div>\n                      )}", "<div>{msg.message}</div>\n                      )}\n" + ticks_code)
# Wait, the closing `</div>` of the message bubble was already there.
# I replaced `<div>{msg.message}</div>\n                      )}` which means I need to make sure I don't leave an extra `</div>`.
# Let's fix this properly.

with open(r'src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin dashboard.")
