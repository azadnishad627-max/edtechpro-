import sys
import re

with open(r'src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variable
if "const [isAdminUploading, setIsAdminUploading]" not in content:
    content = content.replace(
        "const [adminReplyMessage, setAdminReplyMessage] = useState('');",
        "const [adminReplyMessage, setAdminReplyMessage] = useState('');\n  const [isAdminUploading, setIsAdminUploading] = useState(false);"
    )

# 2. Add functions
functions_to_add = """
  const handleAdminFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeChatStudentId) return;
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB'); return; }
    setIsAdminUploading(true);
    
    try {
      const ext = file.name.split('.').pop();
      const fileName = `chat_${Date.now()}.${ext}`;
      const type = file.type.startsWith('image/') ? 'image' : 'pdf';
      const { data, error } = await supabase.storage.from('notes').upload(`chat_files/${fileName}`, file);
      
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage.from('notes').getPublicUrl(`chat_files/${fileName}`);
      const publicUrl = publicUrlData.publicUrl;
      const attachmentMsg = `[ATTACHMENT:${type}:${publicUrl}] ${file.name}`;
      
      const { error: dbError } = await supabase.from('admin_chats').insert([{
        student_id: activeChatStudentId,
        sender: 'admin',
        message: attachmentMsg
      }]);
      
      if (dbError) throw dbError;
    } catch (error) {
      console.error("Upload error:", error);
      alert('Failed to send file.');
    } finally {
      setIsAdminUploading(false);
      e.target.value = '';
    }
  };

  const renderChatMessage = (msgText) => {
    if (msgText.startsWith('[ATTACHMENT:')) {
      const match = msgText.match(/\[ATTACHMENT:(image|pdf):(.*?)\](.*)/);
      if (match) {
        const type = match[1];
        const url = match[2];
        const name = match[3]?.trim();
        if (type === 'image') {
          return (
            <div style={{ marginTop: '0.2rem' }}>
              <img src={url} alt={name} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', cursor: 'pointer', objectFit: 'cover' }} onClick={() => window.open(url, '_blank')} />
            </div>
          );
        } else {
          return (
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '8px', textDecoration: 'none', color: 'inherit', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📄</span> 
              <span style={{ textDecoration: 'underline' }}>{name}</span>
            </a>
          );
        }
      }
    }
    return <span>{msgText}</span>;
  };

  const activeChatProfile = activeChatStudentId 
    ? (adminChats.find(m => m.student_id === activeChatStudentId)?.profiles || dbStudents.find(s => s.id === activeChatStudentId))
    : null;
"""

if "handleAdminFileUpload" not in content:
    content = content.replace(
        "const handleAdminChatReply = async (e) => {",
        functions_to_add + "\n  const handleAdminChatReply = async (e) => {"
    )

# 3. Add column in student table
old_th = """                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Joined Date</th>
                  </tr>"""
new_th = """                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Joined Date</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)', textAlign: 'right' }}>Action</th>
                  </tr>"""
content = content.replace(old_th, new_th)

# Fix colSpan in No students found
content = content.replace('<td colSpan="5"', '<td colSpan="6"')

old_td = """                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(student.created_at).toLocaleDateString()}</td>
                    </tr>"""
new_td = """                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{new Date(student.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => { setActiveTab('admin_chats'); setActiveChatStudentId(student.id); document.body.style.overflow = 'hidden'; }}
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          💬 Chat
                        </button>
                      </td>
                    </tr>"""
content = content.replace(old_td, new_td)

# 4. Modify chat modal header
header_old = """            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <img 
                src={adminChats.find(m => m.student_id === activeChatStudentId)?.profiles?.photo_url || `https://ui-avatars.com/api/?name=${adminChats.find(m => m.student_id === activeChatStudentId)?.profiles?.name || 'Student'}&background=random`} 
                alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ marginLeft: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: '700' }}>{adminChats.find(m => m.student_id === activeChatStudentId)?.profiles?.name || 'Student'}</h3>"""

header_new = """            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <img 
                src={activeChatProfile?.photo_url || `https://ui-avatars.com/api/?name=${activeChatProfile?.name || 'Student'}&background=random`} 
                alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ marginLeft: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: '700' }}>{activeChatProfile?.name || 'Student'}</h3>"""
content = content.replace(header_old, header_new)

# 5. Modify chat message rendering
msg_old = """                <div style={{ color: msg.sender === 'admin' ? 'white' : 'var(--text-light)', lineHeight: '1.5', fontSize: '0.95rem' }}>{msg.message}</div>"""
msg_new = """                <div style={{ color: msg.sender === 'admin' ? 'white' : 'var(--text-light)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                  {renderChatMessage(msg.message)}
                </div>"""
content = content.replace(msg_old, msg_new)

# 6. Modify chat input to add file attach
input_old = """              <input 
                type="text" 
                value={adminReplyMessage}
                onChange={e => setAdminReplyMessage(e.target.value)}
                placeholder="Type a reply..."
                style={{ flex: 1, minWidth: 0, padding: '0.7rem 1rem', border: 'none', background: 'transparent', color: 'white', outline: 'none', fontSize: '0.95rem' }} 
              />
              <button type="submit" style={{ background: 'var(--gradient-brand)', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.2rem', flexShrink: 0 }}>"""

input_new = """              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0.5rem', color: 'var(--text-muted)' }}>
                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleAdminFileUpload} disabled={isAdminUploading} />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                </svg>
              </label>
              <input 
                type="text" 
                value={adminReplyMessage}
                onChange={e => setAdminReplyMessage(e.target.value)}
                placeholder={isAdminUploading ? "Uploading..." : "Type a reply..."}
                disabled={isAdminUploading}
                style={{ flex: 1, minWidth: 0, padding: '0.7rem 0.5rem', border: 'none', background: 'transparent', color: 'white', outline: 'none', fontSize: '0.95rem' }} 
              />
              <button type="submit" disabled={isAdminUploading || (!adminReplyMessage.trim())} style={{ background: (isAdminUploading || !adminReplyMessage.trim()) ? 'rgba(255,255,255,0.1)' : 'var(--gradient-brand)', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: (isAdminUploading || !adminReplyMessage.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.2rem', flexShrink: 0, transition: 'all 0.2s' }}>"""
content = content.replace(input_old, input_new)

# Add key to new chat view to prompt starting conversation
empty_chat_old = """            <div ref={adminChatEndRef} />
          </div>"""
empty_chat_new = """            {adminChats.filter(m => m.student_id === activeChatStudentId).length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column' }}>
                <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</span>
                <p>Send a message to start the conversation.</p>
              </div>
            )}
            <div ref={adminChatEndRef} />
          </div>"""
if "{adminChats.filter(m => m.student_id === activeChatStudentId).length === 0 && (" not in content:
    content = content.replace(empty_chat_old, empty_chat_new)

with open(r'src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin-dashboard")
