import sys
import re

def process_student_dashboard():
    with open('src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix Auto Scroll
    scroll_pattern = r"const lastMessageIdRef = useRef\(null\);.*?\}, \[adminChatHistory, showAdminChatModal\]\);"
    scroll_replacement = """
    const chatLengthRef = useRef(0);
    useEffect(() => {
      if (!showAdminChatModal) chatLengthRef.current = 0;
    }, [showAdminChatModal]);

    useEffect(() => {
      if (showAdminChatModal && adminChatEndRef.current) {
        const currentMsgs = adminChatHistory.filter(m => !m.deleted_for_student);
        if (currentMsgs.length > chatLengthRef.current || chatLengthRef.current === 0) {
          adminChatEndRef.current.scrollIntoView({ behavior: chatLengthRef.current === 0 ? 'auto' : 'smooth', block: 'end' });
          chatLengthRef.current = currentMsgs.length;
        }
      }
    }, [adminChatHistory, showAdminChatModal]);
    """.strip()
    content = re.sub(scroll_pattern, scroll_replacement, content, flags=re.DOTALL)

    # Fix Online Status Logic (Header)
    header_pattern = r"<div style=\{\{ display: 'flex', alignItems: 'center', gap: '0\.4rem', marginTop: '0\.1rem' \}\}>\s*<div style=\{\{ width: '8px', height: '8px', borderRadius: '50%', background: adminStatus\.is_online \? '#4CAF50' : '#a1a1aa' \}\}></div>\s*<p style=\{\{ margin: 0, fontSize: '0\.8rem', color: adminStatus\.is_online \? '#4CAF50' : '#a1a1aa', fontWeight: '500' \}\}>\s*\{adminStatus\.is_online \? 'Online' : `Last seen: \$\{adminStatus\.last_seen \? new Date\(adminStatus\.last_seen\)\.toLocaleString\(\) : 'N/A'\}`\}\s*</p>\s*</div>"
    
    header_replacement = """
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                  {(() => {
                    const isActuallyOnline = adminStatus.last_seen && (new Date() - new Date(adminStatus.last_seen)) < 120000;
                    return (
                      <>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActuallyOnline ? '#4CAF50' : '#a1a1aa' }}></div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: isActuallyOnline ? '#4CAF50' : '#a1a1aa', fontWeight: '500' }}>
                          {isActuallyOnline ? 'Online' : `Last seen: ${adminStatus.last_seen ? new Date(adminStatus.last_seen).toLocaleString([], {hour: '2-digit', minute:'2-digit', month:'short', day:'numeric'}) : 'N/A'}`}
                        </p>
                      </>
                    );
                  })()}
                </div>
    """.strip()
    if 'isActuallyOnline = adminStatus.last_seen' not in content:
        content = re.sub(header_pattern, header_replacement, content, flags=re.DOTALL)
    
    # Fix Ticks -> Seen
    ticks_pattern = r"<span style=\{\{ color: msg\.is_read \? '#60a5fa' : 'rgba\(255,255,255,0\.6\)', fontWeight: 'bold' \}\}>\s*✓✓\s*</span>"
    ticks_replacement = """
                        <span style={{ color: msg.is_read ? '#60a5fa' : 'rgba(255,255,255,0.6)', fontStyle: msg.is_read ? 'normal' : 'italic', fontSize: '0.65rem' }}>
                          {msg.is_read ? 'Seen' : 'Delivered'}
                        </span>
    """.strip()
    content = re.sub(ticks_pattern, ticks_replacement, content, flags=re.DOTALL)

    with open('src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(content)


def process_admin_dashboard():
    with open('src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix Auto Scroll
    scroll_pattern = r"const lastMessageIdRef = useRef\(null\);.*?\}, \[adminChats, activeChatStudentId\]\);"
    scroll_replacement = """
    const chatLengthRef = useRef(0);
    useEffect(() => {
      if (!activeChatStudentId) chatLengthRef.current = 0;
    }, [activeChatStudentId]);

    useEffect(() => {
      if (activeChatStudentId && adminChatEndRef.current) {
        const currentMsgs = adminChats.filter(m => m.student_id === activeChatStudentId && !m.deleted_for_admin);
        if (currentMsgs.length > chatLengthRef.current || chatLengthRef.current === 0) {
          adminChatEndRef.current.scrollIntoView({ behavior: chatLengthRef.current === 0 ? 'auto' : 'smooth', block: 'end' });
          chatLengthRef.current = currentMsgs.length;
        }
      }
    }, [adminChats, activeChatStudentId]);
    """.strip()
    content = re.sub(scroll_pattern, scroll_replacement, content, flags=re.DOTALL)

    # Fix Online Status Logic (Header)
    header_pattern = r"<div style=\{\{ display: 'flex', alignItems: 'center', gap: '0\.4rem', marginTop: '0\.1rem' \}\}>\s*<div style=\{\{ width: '8px', height: '8px', borderRadius: '50%', background: '#4CAF50' \}\}></div>\s*<p style=\{\{ margin: 0, fontSize: '0\.8rem', color: '#4CAF50', fontWeight: '500' \}\}>Online</p>\s*</div>"
    header_replacement = """
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                  {(() => {
                    const isActuallyOnline = activeChatProfile?.last_seen && (new Date() - new Date(activeChatProfile.last_seen)) < 120000;
                    return (
                      <>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isActuallyOnline ? '#4CAF50' : '#a1a1aa' }}></div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: isActuallyOnline ? '#4CAF50' : '#a1a1aa', fontWeight: '500' }}>
                          {isActuallyOnline ? 'Online' : `Last seen: ${activeChatProfile?.last_seen ? new Date(activeChatProfile.last_seen).toLocaleString([], {hour: '2-digit', minute:'2-digit', month:'short', day:'numeric'}) : 'N/A'}`}
                        </p>
                      </>
                    );
                  })()}
                </div>
    """.strip()
    if 'isActuallyOnline = activeChatProfile?.last_seen' not in content:
        content = re.sub(header_pattern, header_replacement, content, flags=re.DOTALL)
    
    # Fix Ticks -> Seen
    ticks_pattern = r"<span style=\{\{ color: msg\.is_read \? '#60a5fa' : 'rgba\(255,255,255,0\.6\)', fontWeight: 'bold' \}\}>\s*✓✓\s*</span>"
    ticks_replacement = """
                    <span style={{ color: msg.is_read ? '#60a5fa' : 'rgba(255,255,255,0.6)', fontStyle: msg.is_read ? 'normal' : 'italic', fontSize: '0.65rem' }}>
                      {msg.is_read ? 'Seen' : 'Delivered'}
                    </span>
    """.strip()
    content = re.sub(ticks_pattern, ticks_replacement, content, flags=re.DOTALL)

    with open('src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(content)

process_student_dashboard()
process_admin_dashboard()
print("Done")
