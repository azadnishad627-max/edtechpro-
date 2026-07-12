"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('courses');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am your AI Mentor. How can I help you with your studies today?' }
  ]);
  const router = useRouter();

  const [dbBatches, setDbBatches] = useState([]);
  const [dbTests, setDbTests] = useState([]);
  const [dbMaterials, setDbMaterials] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Helper to extract Youtube ID for embedding
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return null;
  };

  useEffect(() => {
    const data = localStorage.getItem('studentInfo');
    if (data) {
      setStudent(JSON.parse(data));
    } else {
      router.push('/student-setup');
    }

    async function fetchData() {
      const { data: bData } = await supabase.from('batches').select('*');
      if (bData) setDbBatches(bData);
      
      const { data: tData } = await supabase.from('tests').select('*, batches(title)');
      if (tData) setDbTests(tData);

      const { data: mData } = await supabase.from('content_materials').select('*');
      if (mData) setDbMaterials(mData);
    }
    fetchData();
  }, [router]);

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    
    const userMsg = chatMessage;
    // Add user message
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatMessage('');
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'ai', text: data.reply || "Error connecting to AI." }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Error connecting to AI." }]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('studentInfo');
    router.push('/student-login');
  };

  if (!student) return <div className="container py-4 text-center">Loading...</div>;

  return (
    <div className="container py-4 mobile-pb">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="animate-fade-in" style={{ margin: 0 }}>Welcome, {student.name}!</h1>
        <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Logout</button>
      </div>
      
      <div className="flex gap-4 mb-4 mobile-hide" style={{ gap: '1rem' }}>
        <button className={activeTab === 'courses' ? 'btn-primary' : 'btn-outline'} onClick={() => { setActiveTab('courses'); setSelectedBatch(null); }}>My Courses</button>
        <button className={activeTab === 'tests' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('tests')}>Online Tests</button>
        <button className={activeTab === 'ai' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('ai')}>✨ AI Mentor</button>
      </div>

      <div className="grid-cols-3">
        {/* Main Content Area */}
        <div style={{ gridColumn: '1 / -1' }}>
          
          {activeTab === 'courses' && !selectedBatch && (
            <div className="animate-fade-in">
              <h2 className="mb-4 text-muted">Available Batches</h2>
              <div className="grid-cols-2">
                {dbBatches.map(batch => (
                  <div key={batch.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                    {/* Thumbnail Image */}
                    {batch.image_url ? (
                      <div style={{ width: '100%', height: '180px', backgroundImage: `url(${batch.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                    ) : (
                      <div style={{ width: '100%', height: '180px', background: 'var(--gradient-brand)', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '3rem' }}>📚</span>
                      </div>
                    )}
                    
                    {/* Course Content */}
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 className="mb-2">{batch.title}</h3>
                      <p className="text-muted" style={{ flex: 1 }}>{batch.description}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        {batch.is_free ? <span className="text-accent" style={{ fontWeight: 'bold' }}>Free</span> : <span className="text-muted">₹{batch.price}</span>}
                        <button className="btn-primary" onClick={() => setSelectedBatch(batch)}>Start Learning</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'courses' && selectedBatch && (
            <div className="animate-fade-in">
              <button onClick={() => setSelectedBatch(null)} className="btn-outline mb-4" style={{ padding: '0.5rem 1rem' }}>← Back to Courses</button>
              <h2 className="mb-4 text-accent">{selectedBatch.title} - Study Materials</h2>
              {dbMaterials.filter(m => m.batch_id === selectedBatch.id).length === 0 ? (
                <p className="text-muted">No materials or videos uploaded for this batch yet.</p>
              ) : (
                dbMaterials.filter(m => m.batch_id === selectedBatch.id).map(material => {
                  const isPdf = material.file_url?.toLowerCase().includes('.pdf');
                  const embedUrl = isPdf ? null : getYouTubeEmbedUrl(material.file_url);

                  return (
                    <div key={material.id} className="glass-card mb-4">
                      <h3 className="mb-2">{material.title}</h3>
                      
                      {isPdf ? (
                        <div style={{ marginTop: '0.5rem' }}>
                          <span className="text-muted" style={{ display: 'block', marginBottom: '1rem', fontSize: '0.9rem' }}>🔒 Secure PDF Note</span>
                          <button onClick={() => window.open(`/secure-notes/${material.id}`, '_blank')} className="btn-primary" style={{ background: 'var(--gradient-brand)' }}>
                            View Secure Notes
                          </button>
                        </div>
                      ) : embedUrl ? (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '8px' }}>
                          <iframe src={embedUrl} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></iframe>
                        </div>
                      ) : (
                        <a href={material.file_url} target="_blank" rel="noreferrer" className="btn-outline" style={{ display: 'inline-block', marginTop: '0.5rem' }}>🔗 Open Material Link</a>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'tests' && (
            <div className="animate-fade-in">
              <h2 className="mb-4 text-muted">Available Tests</h2>
              {dbTests.length === 0 ? <p className="text-muted">No tests available right now.</p> : dbTests.map(test => (
                <div key={test.id} className="glass-card mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className="mb-2">{test.title}</h3>
                    <p className="text-muted">Batch: {test.batches?.title} | Duration: {test.duration_mins} Mins | {test.total_questions} Questions</p>
                  </div>
                  <button onClick={() => router.push(`/test/${test.id}`)} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Start Test</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="animate-fade-in">
              <h2 className="mb-4 text-accent">Chat with AI Mentor</h2>
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '400px' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {chatHistory.map((msg, i) => (
                    <div key={i} style={{ 
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' ? 'var(--primary-color)' : 'var(--bg-dark)',
                      padding: '1rem',
                      borderRadius: '8px',
                      maxWidth: '80%'
                    }}>
                      {msg.text}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask a question..." 
                    style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} 
                  />
                  <button type="submit" className="btn-primary">Send</button>
                </form>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="animate-fade-in animate-delay-3">
          <div className="glass-card">
            <h3 className="mb-4">Profile</h3>
            <div style={{ width: '80px', height: '80px', background: 'var(--gradient-brand)', borderRadius: '50%', margin: '0 auto 1rem', overflow: 'hidden' }}>
              <img src="https://ui-avatars.com/api/?name=Student&background=random" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <p className="text-center mb-2" style={{ fontWeight: 'bold' }}>{student.name}</p>
            <p className="text-center text-muted mb-2">Class: {student.className}</p>
            <p className="text-center text-muted mb-4">DOB: {student.dob}</p>
            <button className="btn-outline" style={{ width: '100%' }} onClick={() => router.push('/student-setup')}>Edit Profile</button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav">
        <div className={`bottom-nav-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => { setActiveTab('courses'); setSelectedBatch(null); }}>
          <span className="bottom-nav-icon">📚</span>
          <span>Courses</span>
        </div>
        <div className={`bottom-nav-item ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => setActiveTab('tests')}>
          <span className="bottom-nav-icon">📝</span>
          <span>Tests</span>
        </div>
        <div className={`bottom-nav-item ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          <span className="bottom-nav-icon">✨</span>
          <span>AI Mentor</span>
        </div>
      </div>
    </div>
  );
}
