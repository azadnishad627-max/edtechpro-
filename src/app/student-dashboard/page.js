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

  // New Features State
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [liveClasses, setLiveClasses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [activeLiveClassUrl, setActiveLiveClassUrl] = useState(null);

  // Admin Chat State
  const [adminChatHistory, setAdminChatHistory] = useState([]);

  const [adminStatus, setAdminStatus] = useState({ is_online: false, last_seen: null });

  const [adminChatMessage, setAdminChatMessage] = useState('');
  const [isStudentUploading, setIsStudentUploading] = useState(false);
  const [showAdminChatModal, setShowAdminChatModal] = useState(false);
  const adminChatEndRef = useRef(null);

  const showAdminChatModalRef = useRef(false);

  const trapPushedRef = useRef(false);

  useEffect(() => {
    // Unregister service workers to clear cache for clients that are stuck on old versions
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }

    const pushTrap = () => {
      if (!trapPushedRef.current) {
        window.history.pushState({ trap: true }, '');
        trapPushedRef.current = true;
      }
    };

    document.addEventListener('click', pushTrap);
    document.addEventListener('touchstart', pushTrap, { passive: true });

    const handlePopState = (e) => {
      trapPushedRef.current = false;

      let preventExit = false;
      
      if (showAdminChatModalRef.current) {
        setShowAdminChatModal(false);
        preventExit = true;
      } else if (activeTabRef.current !== 'overview') {
        setActiveTab('overview');
        preventExit = true;
      }

      if (preventExit) {
        window.history.pushState({ trap: true }, '');
        trapPushedRef.current = true;
      } else {
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', pushTrap);
      document.removeEventListener('touchstart', pushTrap);
    };
  }, []);

  useEffect(() => { showAdminChatModalRef.current = showAdminChatModal; }, [showAdminChatModal]);


  const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleJoinLiveClass = (e, url) => {
    const ytId = extractYouTubeId(url);
    if (ytId) {
      e.preventDefault();
      setActiveLiveClassUrl(`https://www.youtube.com/embed/${ytId}?autoplay=1`);
    }
  };

  const photoInputRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: 'Hello! I am your AI Mentor. Upload a photo of a question or ask me anything!' }
  ]);
  const router = useRouter();

  
  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (chatHistory.length > 1) {
      localStorage.setItem('aiChatHistory', JSON.stringify(chatHistory));
    }
  }, [chatHistory]);

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

    const savedChat = localStorage.getItem('aiChatHistory');
    if (savedChat) {
      try {
        setChatHistory(JSON.parse(savedChat));
      } catch(e) {
        console.error("Failed to load chat history", e);
      }
    }

    async function fetchData() {
      fetchBatches();
      fetchMaterials();
      fetchTests();
      fetchAnnouncements();
      fetchLiveClasses();
      fetchLeaderboard();
      fetchBookmarks();
    }
    fetchData();
  }, [router]);

  const fetchBookmarks = async () => {
    const sData = localStorage.getItem('studentInfo');
    if (sData) {
      const student = JSON.parse(sData);
      const { data } = await supabase
        .from('bookmarks')
        .select(`
          id,
          question_id,
          questions (
            question_text,
            option_a,
            option_b,
            option_c,
            option_d,
            correct_answer
          )
        `)
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
      if (data) setBookmarkedQuestions(data);
    }
  };

  const fetchLiveClasses = async () => {
    // Only fetch upcoming or recently started classes
    const { data } = await supabase.from('live_classes').select('*, batches(title)').order('scheduled_time', { ascending: true });
    if (data) setLiveClasses(data);
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('role', 'student').order('points', { ascending: false }).limit(10);
    if (data) setLeaderboard(data);
  };

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  };

  const fetchBatches = async () => {
    const { data: bData } = await supabase.from('batches').select('*');
    if (bData) setDbBatches(bData);
  };

  const fetchMaterials = async () => {
    const { data: mData } = await supabase.from('content_materials').select('*');
    if (mData) setDbMaterials(mData);
  };

  const fetchTests = async () => {
    const { data: tData } = await supabase.from('tests').select('*, batches(title)');
    if (tData) setDbTests(tData);
  };

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

  
  
  const handleDeleteMessage = async (msg) => {
    const isMine = msg.sender === 'student';
    const options = isMine ? "1. Delete for Me\n2. Delete for Everyone\nCancel" : "1. Delete for Me\nCancel";
    const choice = window.prompt(`Type 1 or 2 to delete:\n${options}`);
    if (choice === '1') {
      await supabase.from('admin_chats').update({ deleted_for_student: true }).eq('id', msg.id);
      setAdminChatHistory(prev => prev.map(m => m.id === msg.id ? { ...m, deleted_for_student: true } : m));
    } else if (choice === '2' && isMine) {
      await supabase.from('admin_chats').update({ is_deleted_for_everyone: true }).eq('id', msg.id);
      setAdminChatHistory(prev => prev.map(m => m.id === msg.id ? { ...m, is_deleted_for_everyone: true } : m));
    }
  };

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
    if (error) console.error("Error sending admin chat:", error);
  };

  
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

  useEffect(() => {
    if (!student) return;
    fetchAdminChats();
    const interval = setInterval(fetchAdminChats, 3000);
    return () => clearInterval(interval);
  }, [student]);

  useEffect(() => {
    if (showAdminChatModal && adminChatEndRef.current) {
      adminChatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [adminChatHistory]);

  useEffect(() => {
    if (showAdminChatModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAdminChatModal]);

  async function fetchLatestProfile(id) {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) {
      let updatedPoints = data.points || 0;
      let updatedStreak = data.streak_days || 0;
      let lastLogin = data.last_login_date ? new Date(data.last_login_date) : null;
      let today = new Date();
      today.setHours(0, 0, 0, 0);

      let shouldUpdateDb = false;

      if (!lastLogin) {
        // First login ever
        updatedPoints += 10;
        updatedStreak = 1;
        shouldUpdateDb = true;
      } else {
        let lastLoginMidnight = new Date(lastLogin);
        lastLoginMidnight.setHours(0,0,0,0);
        const diffTime = Math.abs(today - lastLoginMidnight);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // Consecutive day login
          updatedPoints += 10;
          updatedStreak += 1;
          shouldUpdateDb = true;
        } else if (diffDays > 1) {
          // Streak broken
          updatedPoints += 10;
          updatedStreak = 1;
          shouldUpdateDb = true;
        }
      }

      if (shouldUpdateDb) {
        // Update DB
        await supabase.from('profiles').update({ 
          points: updatedPoints, 
          streak_days: updatedStreak, 
          last_login_date: new Date().toISOString() 
        }).eq('id', id);
        
        // Optimistically update data object
        data.points = updatedPoints;
        data.streak_days = updatedStreak;
      }

      const updatedStudent = {
        ...JSON.parse(localStorage.getItem('studentInfo')),
        name: data.name,
        dob: data.dob,
        className: data.class_name,
        photo_url: data.photo_url,
        points: data.points,
        streak: data.streak_days
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

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    setIsSubmittingFeedback(true);
    
    const { error } = await supabase.from('feedback').insert([{
      student_id: student.id,
      student_name: student.name,
      message: feedbackMessage
    }]);

    if (error) {
      alert("Error submitting feedback: " + error.message);
    } else {
      alert("Feedback submitted successfully! Thank you.");
      setFeedbackMessage('');
    }
    setIsSubmittingFeedback(false);
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

  const handleRefresh = async () => {
    if (student?.id) {
      window.location.reload();
    }
  };

  if (!student) return <div className="container pt-navbar text-center">Loading...</div>;

  return (
    <>
            <div className="container pt-navbar mobile-pb">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '55px', height: '55px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--primary-color)', flexShrink: 0, boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            {student.photo_url ? (
              <img src={student.photo_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src={`https://ui-avatars.com/api/?name=${student.name}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
          <div>
            <p className="text-muted" style={{ margin: '0 0 0.2rem 0', fontSize: '0.85rem' }}>Welcome back,</p>
            <h1 className="animate-fade-in" style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', lineHeight: '1.2', fontWeight: '700' }}>{student.name} 👋</h1>
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.3rem' }}>
              <span style={{ fontSize: '0.85rem', background: 'rgba(255, 215, 0, 0.1)', color: '#ffd700', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(255, 215, 0, 0.3)' }}>🏆 {student.points || 0} Pts</span>
              <span style={{ fontSize: '0.85rem', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444', padding: '0.2rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(255, 68, 68, 0.3)' }}>🔥 {student.streak || 0} Day Streak</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowAnnouncements(true)}
          style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
        >
          🔔
          {announcements.length > 0 && <span style={{ position: 'absolute', top: '0px', right: '0px', width: '12px', height: '12px', background: '#ff4444', borderRadius: '50%', border: '2px solid var(--bg-dark)' }}></span>}
        </button>
      </div>
      
      <div className="flex gap-4 mb-4 mobile-hide" style={{ gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}>
        <button className={activeTab === 'courses' ? 'btn-primary' : 'btn-outline'} onClick={() => { setActiveTab('courses'); setSelectedBatch(null); }}>My Courses</button>
        <button className={activeTab === 'leaderboard' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('leaderboard')}>🏆 Leaderboard</button>
        <button className={activeTab === 'tests' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('tests')}>Online Tests</button>
        <button className={activeTab === 'ai' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('ai')}>✨ AI Mentor</button>
        <button className={activeTab === 'profile' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('profile')}>👤 Profile</button>
        <button className={activeTab === 'more' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('more')}>🎮 More</button>
      </div>

      <div className="animate-fade-in">
        {activeTab === 'courses' && !selectedBatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {liveClasses.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h2 className="mb-4 text-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ff4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>🔴 Live / Upcoming Classes</h2>
                <div className="grid-cols-2">
                  {liveClasses.map(lc => (
                    <div key={lc.id} className="glass-card" style={{ borderLeft: '4px solid #ff4444', background: 'rgba(255, 68, 68, 0.05)' }}>
                      <h3 className="mb-2">{lc.title}</h3>
                      <p className="text-muted mb-4">Batch: {lc.batches?.title}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'white', fontWeight: 'bold' }}>{new Date(lc.scheduled_time).toLocaleString()}</span>
                        <a 
                          href={lc.join_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn-primary" 
                          onClick={(e) => handleJoinLiveClass(e, lc.join_url)}
                          style={{ background: '#ff4444', padding: '0.5rem 1rem' }}
                        >
                          Join Now
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            <h2 className="mb-4 text-accent mt-5" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>⭐ Saved Questions (For Revision)</h2>
            {bookmarkedQuestions.length === 0 ? <p className="text-muted">You haven't bookmarked any questions yet. Start a test and click the ⭐ icon on difficult questions to save them here!</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookmarkedQuestions.map(bm => (
                  <div key={bm.id} className="glass-card" style={{ borderLeft: '4px solid #ffd700', background: 'rgba(255, 215, 0, 0.05)' }}>
                    <h3 className="mb-3" style={{ fontSize: '1.1rem', lineHeight: '1.5' }}>{bm.questions?.question_text}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p style={{ margin: 0, color: bm.questions?.correct_answer === bm.questions?.option_a ? '#4CAF50' : 'var(--text-muted)' }}><strong style={{ color: 'var(--accent)' }}>A.</strong> {bm.questions?.option_a}</p>
                      <p style={{ margin: 0, color: bm.questions?.correct_answer === bm.questions?.option_b ? '#4CAF50' : 'var(--text-muted)' }}><strong style={{ color: 'var(--accent)' }}>B.</strong> {bm.questions?.option_b}</p>
                      <p style={{ margin: 0, color: bm.questions?.correct_answer === bm.questions?.option_c ? '#4CAF50' : 'var(--text-muted)' }}><strong style={{ color: 'var(--accent)' }}>C.</strong> {bm.questions?.option_c}</p>
                      <p style={{ margin: 0, color: bm.questions?.correct_answer === bm.questions?.option_d ? '#4CAF50' : 'var(--text-muted)' }}><strong style={{ color: 'var(--accent)' }}>D.</strong> {bm.questions?.option_d}</p>
                    </div>
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '4px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                      <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Correct Answer:</span> {bm.questions?.correct_answer}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)' }}>
            <h2 className="mb-4 text-accent" style={{ flexShrink: 0, fontSize: '1.5rem' }}>AI Mentor</h2>
            <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, borderRadius: '16px' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {chatHistory.map((msg, i) => (
                  <div key={i} style={{ 
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: msg.role === 'user' ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                    padding: '1rem',
                    borderRadius: msg.role === 'user' ? '20px 20px 0 20px' : '20px 20px 20px 0',
                    maxWidth: '85%',
                    wordBreak: 'break-word',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                  }}>
                    {msg.image && <img src={msg.image} alt="Upload" style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '0.5rem' }} />}
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

              <div style={{ padding: '1rem', background: 'transparent' }}>
                <form onSubmit={handleChatSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', borderRadius: '50px', padding: '0.3rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    ref={chatFileInputRef} 
                    onChange={handleChatImageChange} 
                    style={{ display: 'none' }} 
                    id="chat-file-upload"
                  />
                  <label htmlFor="chat-file-upload" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-light)', fontSize: '1.3rem', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', marginLeft: '0.2rem', transition: 'all 0.3s' }}>
                    📸
                  </label>
                  <input 
                    type="text" 
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask a question..." 
                    style={{ flex: 1, minWidth: 0, padding: '0.8rem 0.5rem', border: 'none', background: 'transparent', color: 'white', outline: 'none', fontSize: '0.95rem' }} 
                  />
                  <button type="submit" style={{ background: 'var(--gradient-brand)', color: 'white', border: 'none', width: '42px', height: '42px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.2rem', boxShadow: '0 4px 10px rgba(6, 182, 212, 0.3)', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform='scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="animate-fade-in">
            <h2 className="mb-4 text-accent text-center" style={{ fontSize: '2rem' }}>🏆 Global Leaderboard</h2>
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              {leaderboard.length === 0 ? <p className="text-muted text-center" style={{ padding: '2rem' }}>No data available yet.</p> : leaderboard.map((lbStudent, idx) => (
                <div key={lbStudent.id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '1.5rem', 
                  borderBottom: idx === leaderboard.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  background: idx === 0 ? 'rgba(255, 215, 0, 0.1)' : idx === 1 ? 'rgba(192, 192, 192, 0.1)' : idx === 2 ? 'rgba(205, 127, 50, 0.1)' : 'transparent',
                  transition: 'background 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', fontWeight: 'bold', fontSize: '1.5rem', color: idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'var(--text-muted)' }}>
                      #{idx + 1}
                    </div>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', border: `2px solid ${idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : 'transparent'}` }}>
                      <img src={lbStudent.photo_url || `https://ui-avatars.com/api/?name=${lbStudent.name}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 0.2rem 0', color: student.id === lbStudent.id ? 'var(--primary-color)' : 'white' }}>
                        {lbStudent.name} {student.id === lbStudent.id && '(You)'}
                      </h3>
                      <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>@{lbStudent.username || 'student'}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <h3 style={{ margin: '0 0 0.2rem 0', color: '#ffd700' }}>{lbStudent.points || 0} Pts</h3>
                    <p style={{ margin: 0, color: '#ff4444', fontSize: '0.85rem', fontWeight: 'bold' }}>🔥 {lbStudent.streak_days || 0} Days</p>
                  </div>
                </div>
              ))}
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
            </div>
            <div className="glass-card">
              <h2 className="mb-4 text-accent">Report Issue / Feedback</h2>
              <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <textarea 
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what you like or report a glitch you found..."
                  style={{ width: '100%', minHeight: '120px', padding: '1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', resize: 'vertical' }}
                  required
                />
                <button type="submit" disabled={isSubmittingFeedback} className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                  {isSubmittingFeedback ? 'Submitting...' : 'Send Feedback'}
                </button>
              </form>
            </div>

            <div className="glass-card">
              <h2 className="mb-4 text-primary">Brain Break 🎮</h2>
              <Game2048 />
            </div>
          </div>
        )}

        {activeTab === 'syllabus' && (
          <div className="glass-card">
            <h2 className="mb-4 text-accent text-center">NMMS Syllabus (2026-2027)</h2>
            <div className="markdown-body" style={{ color: 'var(--text-light)', lineHeight: '1.8' }}>
              <ReactMarkdown remarkPlugins={[remarkMath, remarkGfm]} rehypePlugins={[rehypeKatex]}>
                {`**Paper 1: MAT (Mental Ability Test)** - 90 MCQs
- Analogy & Classification
- Numerical & Alphabet Series
- Pattern Perception & Hidden Figures
- Blood Relations & Coding-Decoding
- Venn Diagrams

**Paper 2: SAT (Scholastic Aptitude Test)** - 90 MCQs (Class 7 & 8 NCERT)
- **Maths (20 Marks):** Algebra, Geometry, Mensuration, Data Handling, Fractions, Roots, Exponents.
- **Science (35 Marks):** Motion, Force, Light, Sound, Electricity, Metals/Non-metals, Acids/Bases, Pollution, Cells, Microorganisms, Reproduction, Environment.
- **Social Science (35 Marks):** History (Mughal, British, Freedom), Geography (Earth, Climate, Agriculture), Civics (Constitution, Parliament, Fundamental Rights).`}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav">
        <div className={`bottom-nav-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => { setActiveTab('courses'); setSelectedBatch(null); }}>
          <span className="bottom-nav-icon">📚</span>
          <span>Courses</span>
        </div>
        <div className={`bottom-nav-item ${activeTab === 'syllabus' ? 'active' : ''}`} onClick={() => setActiveTab('syllabus')}>
          <span className="bottom-nav-icon">📄</span>
          <span>Syllabus</span>
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
    
{showAdminChatModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'var(--bg-dark)', zIndex: 10000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Chat Header */}
            <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))', flexShrink: 0 }}>
              <button 
                onClick={() => setShowAdminChatModal(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '1.2rem', marginRight: '0.8rem', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ←
              </button>
              <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
                👨‍💼
              </div>
              <div style={{ marginLeft: '0.8rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: '700' }}>RK Education Support</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.1rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: adminStatus.is_online ? '#4CAF50' : '#a1a1aa' }}></div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: adminStatus.is_online ? '#4CAF50' : '#a1a1aa', fontWeight: '500' }}>
                    {adminStatus.is_online ? 'Online' : `Last seen: ${adminStatus.last_seen ? new Date(adminStatus.last_seen).toLocaleString() : 'N/A'}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', WebkitOverflowScrolling: 'touch' }}>
              {adminChatHistory.length === 0 ? (
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
                )})
              )}
              <div ref={adminChatEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-dark)', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <form onSubmit={handleAdminChatSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', padding: '0.25rem', border: '1px solid var(--glass-border)' }}>
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
                <button type="submit" disabled={isStudentUploading || (!adminChatMessage.trim())} style={{ background: (isStudentUploading || !adminChatMessage.trim()) ? 'rgba(255,255,255,0.1)' : 'var(--gradient-brand)', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: (isStudentUploading || !adminChatMessage.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.2rem', flexShrink: 0, transition: 'all 0.2s' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
              </form>
            </div>
          </div>
        )}


      {/* Notifications Modal */}
      {showAnnouncements && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: 'white' }}>🔔 Notifications</h2>
              <button onClick={() => setShowAnnouncements(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {announcements.length === 0 ? (
                <p className="text-muted text-center" style={{ margin: '2rem 0' }}>No new announcements.</p>
              ) : (
                announcements.map(ann => (
                  <div key={ann.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: 'white' }}>{ann.title}</h3>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-light)', fontSize: '0.9rem', lineHeight: '1.5' }}>{ann.content}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ann.created_at).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Embedded Live Class Modal */}
      {activeLiveClassUrl && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.9)', zIndex: 10000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{ width: '100%', maxWidth: '900px', background: 'var(--bg-dark)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--glass-border)' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>🔴 Live Class</h3>
              <button 
                onClick={() => setActiveLiveClassUrl(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div style={{ width: '100%', paddingTop: '56.25%', position: 'relative' }}>
              <iframe 
                src={activeLiveClassUrl} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
