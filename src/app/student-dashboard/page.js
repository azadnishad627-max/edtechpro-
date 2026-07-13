"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Game2048 from '../../components/Game2048';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('courses');
  const [chatMessage, setChatMessage] = useState('');
  const [chatImageFile, setChatImageFile] = useState(null);
  const [chatImagePreview, setChatImagePreview] = useState(null);
  const chatFileInputRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am your AI Mentor. Upload a photo of a question or ask me anything!' }
  ]);
  const router = useRouter();

  const [dbBatches, setDbBatches] = useState([]);
  const [dbTests, setDbTests] = useState([]);
  const [dbMaterials, setDbMaterials] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);

  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editClass, setEditClass] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const photoInputRef = useRef(null);

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
      const parsed = JSON.parse(data);
      setStudent(parsed);
      setEditName(parsed.name || '');
      setEditDob(parsed.dob || '');
      setEditClass(parsed.className || parsed.class_name || '');
      // Fetch latest profile from DB to ensure photo is up to date
      fetchLatestProfile(parsed.id);
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

  async function fetchLatestProfile(id) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) {
      const updatedStudent = {
        ...JSON.parse(localStorage.getItem('studentInfo')),
        name: data.name,
        dob: data.dob,
        className: data.class_name,
        photo_url: data.photo_url
      };
      setStudent(updatedStudent);
      setEditName(data.name || '');
      setEditDob(data.dob || '');
      setEditClass(data.class_name || '');
      localStorage.setItem('studentInfo', JSON.stringify(updatedStudent));
    }
  }

  const handleChatImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setChatImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() && !chatImagePreview) return;
    
    const userMsg = chatMessage;
    const userImg = chatImagePreview;
    const mime = chatImageFile?.type;
    
    // Add user message
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg, image: userImg }]);
    setChatMessage('');
    setChatImageFile(null);
    setChatImagePreview(null);
    if (chatFileInputRef.current) chatFileInputRef.current.value = '';
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg,
          imageBase64: userImg,
          mimeType: mime
        })
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);

    let finalPhotoUrl = student.photo_url;

    if (newPhotoFile) {
      const fileExt = newPhotoFile.name.split('.').pop();
      const fileName = `profile_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(fileName, newPhotoFile);

      if (uploadError) {
        alert("Error uploading photo: " + uploadError.message);
        setIsSavingProfile(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage.from('notes').getPublicUrl(fileName);
      finalPhotoUrl = publicUrlData.publicUrl;
    }

    const { error } = await supabase.from('profiles').update({
      name: editName,
      dob: editDob,
      class_name: editClass,
      photo_url: finalPhotoUrl
    }).eq('id', student.id);

    if (error) {
      alert("Error saving profile: " + error.message);
    } else {
      const updated = { ...student, name: editName, dob: editDob, className: editClass, photo_url: finalPhotoUrl };
      setStudent(updated);
      localStorage.setItem('studentInfo', JSON.stringify(updated));
      alert("Profile updated successfully!");
      setNewPhotoFile(null);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
    setIsSavingProfile(false);
  };

  if (!student) return <div className="container py-4 text-center">Loading...</div>;

  return (
    <div className="container py-4 mobile-pb">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', flexShrink: 0 }}>
          {student.photo_url ? (
            <img src={student.photo_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <img src={`https://ui-avatars.com/api/?name=${student.name}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <div>
          <p className="text-muted" style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem' }}>Welcome back,</p>
          <h1 className="animate-fade-in" style={{ margin: 0, fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', lineHeight: '1.2' }}>{student.name} 👋</h1>
        </div>
      </div>
      
      <div className="flex gap-4 mb-4 mobile-hide" style={{ gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}>
        <button className={activeTab === 'courses' ? 'btn-primary' : 'btn-outline'} onClick={() => { setActiveTab('courses'); setSelectedBatch(null); }}>My Courses</button>
        <button className={activeTab === 'tests' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('tests')}>Online Tests</button>
        <button className={activeTab === 'ai' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('ai')}>✨ AI Mentor</button>
        <button className={activeTab === 'profile' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('profile')}>👤 Profile</button>
        <button className={activeTab === 'more' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('more')}>🎮 More</button>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'courses' && !selectedBatch && (
          <div>
            <h2 className="mb-4 text-muted">Available Batches</h2>
            <div className="grid-cols-3">
              {dbBatches.map(batch => (
                <div key={batch.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
                  {batch.image_url ? (
                    <div style={{ width: '100%', height: '180px', backgroundImage: `url(${batch.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                  ) : (
                    <div style={{ width: '100%', height: '180px', background: 'var(--gradient-brand)', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '3rem' }}>📚</span>
                    </div>
                  )}
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
          <div>
            <button onClick={() => setSelectedBatch(null)} className="btn-outline mb-4" style={{ padding: '0.5rem 1rem' }}>← Back to Courses</button>
            <h2 className="mb-4 text-accent">{selectedBatch.title} - Study Materials</h2>
            {dbMaterials.filter(m => m.batch_id === selectedBatch.id).length === 0 ? (
              <p className="text-muted">No materials or videos uploaded for this batch yet.</p>
            ) : (
              <div className="grid-cols-2">
                {dbMaterials.filter(m => m.batch_id === selectedBatch.id).map(material => {
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
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tests' && (
          <div>
            <h2 className="mb-4 text-muted">Available Tests</h2>
            {dbTests.length === 0 ? <p className="text-muted">No tests available right now.</p> : dbTests.map(test => (
              <div key={test.id} className="glass-card mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <div>
            <h2 className="mb-4 text-accent">Chat with AI Mentor</h2>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', minHeight: '350px' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{ 
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' ? 'var(--primary-color)' : 'var(--bg-card-dark)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                    padding: '1rem',
                    borderRadius: '8px',
                    maxWidth: '85%',
                    wordBreak: 'break-word'
                  }}>
                    {msg.image && <img src={msg.image} alt="Upload" style={{ maxWidth: '100%', borderRadius: '4px', marginBottom: '0.5rem' }} />}
                    <div style={{ color: msg.role === 'user' ? 'white' : 'var(--text-light)', lineHeight: '1.6' }} className="markdown-body">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
              
              {chatImagePreview && (
                <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-dark)', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                  <img src={chatImagePreview} alt="Preview" style={{ height: '40px', borderRadius: '4px' }} />
                  <button type="button" onClick={() => { setChatImageFile(null); setChatImagePreview(null); if (chatFileInputRef.current) chatFileInputRef.current.value = ''; }} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '0.9rem' }}>✖ Remove Photo</button>
                </div>
              )}

              <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', padding: '0 1rem 1rem 1rem' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  ref={chatFileInputRef} 
                  onChange={handleChatImageChange} 
                  style={{ display: 'none' }} 
                  id="chat-file-upload"
                />
                <label htmlFor="chat-file-upload" style={{ cursor: 'pointer', padding: '1rem', borderRadius: '8px', background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem' }}>
                  📷
                </label>
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask or scan a question..." 
                  style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} 
                />
                <button type="submit" className="btn-primary">Send</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="grid-cols-2" style={{ alignItems: 'flex-start' }}>
            <div className="glass-card text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '120px', height: '120px', background: 'var(--gradient-brand)', borderRadius: '50%', margin: '0 auto 1.5rem', overflow: 'hidden', border: '4px solid var(--glass-border)' }}>
                {student.photo_url ? (
                  <img src={student.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={`https://ui-avatars.com/api/?name=${student.name}&background=random&size=128`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
              </div>
              <h2 className="mb-2">{student.name}</h2>
              <p className="text-muted mb-2">@{student.username}</p>
              <p className="text-accent font-bold mb-4">Student</p>
              
              <hr style={{ width: '100%', border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
              
              <button onClick={handleLogout} className="btn-outline" style={{ width: '100%', border: '1px solid #ff4444', color: '#ff4444' }}>
                Sign Out
              </button>
            </div>

            <div className="glass-card">
              <h3 className="mb-4">Edit Profile</h3>
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Full Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Date of Birth</label>
                    <input type="date" value={editDob} onChange={(e) => setEditDob(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                  </div>
                  <div style={{ flex: 1, minWidth: '150px' }}>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Class / Standard</label>
                    <input type="text" value={editClass} onChange={(e) => setEditClass(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                  </div>
                </div>

                <div>
                  <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Change Profile Photo</label>
                  <input type="file" accept="image/*" ref={photoInputRef} onChange={(e) => setNewPhotoFile(e.target.files[0])} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                </div>

                <button type="submit" disabled={isSavingProfile} className="btn-primary mt-4" style={{ width: '100%', background: 'var(--gradient-brand)' }}>
                  {isSavingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'more' && (
          <div>
            <h2 className="mb-4 text-accent text-center">Brain Break</h2>
            <Game2048 />
          </div>
        )}
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
        <div className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
          <span className="bottom-nav-icon">👤</span>
          <span>Profile</span>
        </div>
        <div className={`bottom-nav-item ${activeTab === 'more' ? 'active' : ''}`} onClick={() => setActiveTab('more')}>
          <span className="bottom-nav-icon">🎮</span>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
