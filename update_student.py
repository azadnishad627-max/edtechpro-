import sys
import re

with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variable
if "const [isStudentUploading, setIsStudentUploading]" not in content:
    content = content.replace(
        "const [adminChatMessage, setAdminChatMessage] = useState('');",
        "const [adminChatMessage, setAdminChatMessage] = useState('');\n  const [isStudentUploading, setIsStudentUploading] = useState(false);"
    )

# 2. Add functions
functions_to_add = """
  const handleStudentFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('File too large. Max 5MB'); return; }
    setIsStudentUploading(true);
    
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
        student_id: student.id,
        sender: 'student',
        message: attachmentMsg
      }]);
      
      if (dbError) throw dbError;
    } catch (error) {
      console.error("Upload error:", error);
      alert('Failed to send file.');
    } finally {
      setIsStudentUploading(false);
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
"""

if "handleStudentFileUpload" not in content:
    content = content.replace(
        "const handleAdminChatSubmit = async (e) => {",
        functions_to_add + "\n  const handleAdminChatSubmit = async (e) => {"
    )

# 3. Modify chat message rendering
msg_old = """                    <div style={{ color: msg.sender === 'student' ? 'white' : 'var(--text-light)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                      {msg.message}
                    </div>"""
msg_new = """                    <div style={{ color: msg.sender === 'student' ? 'white' : 'var(--text-light)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                      {renderChatMessage(msg.message)}
                    </div>"""
content = content.replace(msg_old, msg_new)

# 4. Modify chat input to add file attach
input_old = """              <form onSubmit={handleAdminChatSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', padding: '0.25rem', border: '1px solid var(--glass-border)' }}>
                <input 
                  type="text" 
                  value={adminChatMessage}
                  onChange={e => setAdminChatMessage(e.target.value)}
                  placeholder="Type a message..."
                  style={{ flex: 1, minWidth: 0, padding: '0.7rem 1rem', border: 'none', background: 'transparent', color: 'white', outline: 'none', fontSize: '0.95rem' }} 
                />
                <button type="submit" style={{ background: 'var(--gradient-brand)', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.2rem', flexShrink: 0 }}>"""

input_new = """              <form onSubmit={handleAdminChatSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', padding: '0.25rem', border: '1px solid var(--glass-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0.5rem', color: 'var(--text-muted)' }}>
                  <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleStudentFileUpload} disabled={isStudentUploading} />
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"></path>
                  </svg>
                </label>
                <input 
                  type="text" 
                  value={adminChatMessage}
                  onChange={e => setAdminChatMessage(e.target.value)}
                  placeholder={isStudentUploading ? "Uploading..." : "Type a message..."}
                  disabled={isStudentUploading}
                  style={{ flex: 1, minWidth: 0, padding: '0.7rem 0.5rem', border: 'none', background: 'transparent', color: 'white', outline: 'none', fontSize: '0.95rem' }} 
                />
                <button type="submit" disabled={isStudentUploading || (!adminChatMessage.trim())} style={{ background: (isStudentUploading || !adminChatMessage.trim()) ? 'rgba(255,255,255,0.1)' : 'var(--gradient-brand)', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: (isStudentUploading || !adminChatMessage.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.2rem', flexShrink: 0, transition: 'all 0.2s' }}>"""
content = content.replace(input_old, input_new)

with open(r'src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated student-dashboard")
