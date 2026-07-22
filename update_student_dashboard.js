const fs = require('fs');
let content = fs.readFileSync('src/app/student-dashboard/page.js', 'utf8');

// 1. Add import
content = content.replace(
  `import Game2048 from '../../components/Game2048';`,
  `import Game2048 from '../../components/Game2048';\nimport PullToRefresh from '../../components/PullToRefresh';`
);

// 2. Add state
content = content.replace(
  `const extractYouTubeId`,
  `// Admin Chat State\n  const [adminChatHistory, setAdminChatHistory] = useState([]);\n  const [adminChatMessage, setAdminChatMessage] = useState('');\n  const [showAdminChatModal, setShowAdminChatModal] = useState(false);\n  const adminChatEndRef = useRef(null);\n\n  const extractYouTubeId`
);

// 3. Add functions
content = content.replace(
  `async function fetchLatestProfile(id) {`,
  `const fetchAdminChats = async () => {
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

  const handleAdminChatSubmit = async (e) => {
    e.preventDefault();
    if (!adminChatMessage.trim()) return;

    const sData = localStorage.getItem('studentInfo');
    if (!sData) return;
    const student = JSON.parse(sData);

    const msg = adminChatMessage;
    setAdminChatMessage('');
    
    setAdminChatHistory(prev => [...prev, { sender: 'student', message: msg, created_at: new Date().toISOString() }]);

    const { error } = await supabase.from('admin_chats').insert([{
      student_id: student.id,
      sender: 'student',
      message: msg
    }]);
    if (error) console.error('Error sending admin chat:', error);
  };

  useEffect(() => {
    if (showAdminChatModal) {
      fetchAdminChats();
      const interval = setInterval(fetchAdminChats, 3000);
      return () => clearInterval(interval);
    }
  }, [showAdminChatModal, student]);

  useEffect(() => {
    adminChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adminChatHistory, showAdminChatModal]);

  async function fetchLatestProfile(id) {`
);

// 4. Add handleRefresh
content = content.replace(
  `if (!student) return <div className="container pt-navbar text-center">Loading...</div>;`,
  `const handleRefresh = async () => {
    if (student?.id) {
      window.location.reload();
    }
  };

  if (!student) return <div className="container pt-navbar text-center">Loading...</div>;`
);

// 5. Wrap in PullToRefresh
content = content.replace(
  `return (\n    <div className="container pt-navbar mobile-pb">`,
  `return (\n    <PullToRefresh onRefresh={handleRefresh}>\n      <div className="container pt-navbar mobile-pb">`
);
content = content.replace(
  `    </div>\n  );\n}`,
  `      </div>\n    </PullToRefresh>\n  );\n}`
);

// 6. Inject the UI inside 'more' tab and the modal
content = content.replace(
  `{activeTab === 'more' && (`,
  `{showAdminChatModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-dark)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <button 
                onClick={() => setShowAdminChatModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-light)', fontSize: '1.5rem', marginRight: '1rem', cursor: 'pointer' }}
              >
                ←
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  👨‍💼
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Support Admin</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#4CAF50' }}>Online</p>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {adminChatHistory.length === 0 ? (
                  <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.5 }}>
                    <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</span>
                    <p>Send a message to start chatting with the Admin.</p>
                  </div>
                ) : (
                  adminChatHistory.map((msg, i) => (
                    <div key={i} style={{ 
                      alignSelf: msg.sender === 'student' ? 'flex-end' : 'flex-start',
                      background: msg.sender === 'student' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                      border: msg.sender === 'student' ? 'none' : '1px solid var(--glass-border)',
                      padding: '0.8rem 1rem',
                      borderRadius: msg.sender === 'student' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                      maxWidth: '85%',
                      wordBreak: 'break-word',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ color: msg.sender === 'student' ? 'white' : 'var(--text-light)', lineHeight: '1.5' }}>
                        {msg.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: msg.sender === 'student' ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '0.3rem', textAlign: msg.sender === 'student' ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))
                )}
                <div ref={adminChatEndRef} />
              </div>

              <div style={{ padding: '0.8rem', background: 'var(--bg-dark)', borderTop: '1px solid var(--glass-border)' }}>
                <form onSubmit={handleAdminChatSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', padding: '0.3rem', border: '1px solid var(--glass-border)' }}>
                  <input 
                    type="text" 
                    value={adminChatMessage}
                    onChange={e => setAdminChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    style={{ flex: 1, minWidth: 0, padding: '0.8rem 1rem', border: 'none', background: 'transparent', color: 'white', outline: 'none', fontSize: '0.95rem' }} 
                  />
                  <button type="submit" style={{ background: 'var(--gradient-brand)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.2rem' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'more' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-card">
              <h2 className="mb-4 text-primary">Support & Help</h2>
              <div 
                onClick={() => setShowAdminChatModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              >
                <div style={{ fontSize: '2rem' }}>💬</div>
                <div>
                  <h3 style={{ margin: '0 0 0.3rem 0', color: 'white' }}>Chat with Admin</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Direct WhatsApp-like support chat</p>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--primary-color)' }}>➔</div>
              </div>
            </div>`
);

fs.writeFileSync('src/app/student-dashboard/page.js', content);
