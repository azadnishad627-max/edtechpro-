"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Game2048 from '../../components/Game2048';


export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('courses');

  const switchTab = (tab) => {
    window.history.pushState({ tab }, '', '#' + tab);
    setActiveTab(tab);
  };

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        const hashTab = window.location.hash.replace('#', '');
        if (hashTab) {
          setActiveTab(hashTab);
        } else {
          setActiveTab('courses');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab) {
      switchTab(hashTab);
    } else {
      window.history.replaceState({ tab: 'courses' }, '', '#' + 'courses'.replace(/['"]/g, ''));
    }
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);



  // New Features State
  const [announcements, setAnnouncements] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const [liveClasses, setLiveClasses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState([]);
  const [activeLiveClassUrl, setActiveLiveClassUrl] = useState(null);
  const [activeTestUrl, setActiveTestUrl] = useState(null);

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
        switchTab('overview');
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

  const router = useRouter();

  
  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);



  const [dbBatches, setDbBatches] = useState([]);
  const [dbTests, setDbTests] = useState([]);
  const [dbMaterials, setDbMaterials] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  
  // Profile & Analytics State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [myTestAttempts, setMyTestAttempts] = useState([]);

  // Profile Edit & Batch State
  const [studentBatchId, setStudentBatchId] = useState(null);
  const [studentBatchTitle, setStudentBatchTitle] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editClass, setEditClass] = useState('Class 8th');
  const [editBatchId, setEditBatchId] = useState('');
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
      setEditClass(parsed.className || parsed.class_name || 'Class 8th');
      if (parsed.batch_id) {
        setStudentBatchId(parsed.batch_id);
        setStudentBatchTitle(parsed.batch_title);
        setEditBatchId(parsed.batch_id);
      }
      // Fetch latest profile from DB to ensure photo & enrollment is up to date
      fetchLatestProfile(parsed.id);
    } else {
      router.push('/student-setup');
    }



    async function fetchData() {
      fetchBatches();
      fetchMaterials();
      fetchTests();
      fetchMyAttempts();
      fetchAdminChats();
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
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'student');
      const { data: attempts } = await supabase.from('test_attempts').select('student_id, test_id, score, created_at').order('created_at', { ascending: true });
      const { data: activeTests } = await supabase.from('tests').select('id, title, batch_id, batches(title)');
      const { data: enrollmentsData } = await supabase.from('enrollments').select('student_id, batch_id, batches(title)');
      
      if (!profiles || !attempts || !activeTests) {
        setLeaderboard([]);
        return;
      }

      // Map each student to their enrolled batch
      const studentBatchMap = {};
      (enrollmentsData || []).forEach(e => {
        studentBatchMap[e.student_id] = {
          batch_id: e.batch_id,
          batch_title: e.batches?.title
        };
      });

      // Filter students that belong to the current student's batch
      const batchStudentIds = new Set();
      profiles.forEach(p => {
        const pEnroll = studentBatchMap[p.id];
        const pBatchId = pEnroll?.batch_id;
        const pBatchTitle = pEnroll?.batch_title;
        if (isItemForStudentBatch(pBatchId, pBatchTitle, p.class_name)) {
          batchStudentIds.add(p.id);
        }
      });

      // Filter tests that belong to the current student's batch
      const validBatchTestIds = new Set(
        activeTests
          .filter(t => !t.title.startsWith('[ARCHIVED]') && isItemForStudentBatch(t.batch_id, t.batches?.title, t.title))
          .map(t => t.id)
      );

      const firstAttempts = {};
      attempts.forEach(a => {
        // Count ONLY attempts by batch students on batch tests
        if (validBatchTestIds.has(a.test_id) && batchStudentIds.has(a.student_id)) {
          const key = `${a.student_id}_${a.test_id}`;
          if (!firstAttempts[key]) firstAttempts[key] = a;
        }
      });

      const studentScores = {};
      const studentLatestSubmit = {};
      
      Object.values(firstAttempts).forEach(a => {
        const sid = a.student_id;
        studentScores[sid] = (studentScores[sid] || 0) + a.score;
        const attemptTime = new Date(a.created_at).getTime();
        if (!studentLatestSubmit[sid] || attemptTime > studentLatestSubmit[sid]) {
          studentLatestSubmit[sid] = attemptTime;
        }
      });

      // Filter profiles for this batch's leaderboard
      const updatedProfiles = profiles
        .filter(p => batchStudentIds.has(p.id) && studentScores[p.id] !== undefined)
        .map(p => ({
          ...p,
          total_test_score: studentScores[p.id] || 0,
          latest_submit_time: studentLatestSubmit[p.id] || 0
        }));

      updatedProfiles.sort((a, b) => {
        if (b.total_test_score !== a.total_test_score) {
          return b.total_test_score - a.total_test_score;
        }
        return a.latest_submit_time - b.latest_submit_time; 
      });
      
      setLeaderboard(updatedProfiles.slice(0, 10));
    } catch (err) {
      console.error("Leaderboard error:", err);
      setLeaderboard([]);
    }
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
      if (tData) {
        setDbTests(tData);
      }
    };

    const fetchMyAttempts = async () => {
      const sData = localStorage.getItem('studentInfo');
      if (!sData) return;
      const student = JSON.parse(sData);
      const { data: aData } = await supabase.from('test_attempts').select('*, tests(title, total_questions)').eq('student_id', student.id).order('created_at', { ascending: false });
      if (aData) setMyTestAttempts(aData);
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
    if (studentBatchId) {
      fetchLeaderboard();
    }
  }, [studentBatchId, studentBatchTitle]);

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

    const chatLengthRef = useRef(0);
    useEffect(() => {
      if (!showAdminChatModal) chatLengthRef.current = 0;
    }, [showAdminChatModal]);

    useEffect(() => {
      if (showAdminChatModal && adminChatEndRef.current) {
        const container = adminChatEndRef.current.parentElement;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
        
        const currentMsgs = adminChatHistory.filter(m => !m.deleted_for_student);
        if (currentMsgs.length > chatLengthRef.current || chatLengthRef.current === 0) {
          if (chatLengthRef.current === 0 || isAtBottom) {
            adminChatEndRef.current.scrollIntoView({ behavior: chatLengthRef.current === 0 ? 'auto' : 'smooth', block: 'end' });
          }
          chatLengthRef.current = currentMsgs.length;
        }
      }
    }, [adminChatHistory, showAdminChatModal]);

  useEffect(() => {
    if (showAdminChatModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAdminChatModal]);

  async function fetchLatestProfile(id) {
    // Fetch enrollment for this student
    try {
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select('batch_id, batches(title)')
        .eq('student_id', id)
        .maybeSingle();
      if (enrollData) {
        setStudentBatchId(enrollData.batch_id);
        setStudentBatchTitle(enrollData.batches?.title || null);
        setEditBatchId(enrollData.batch_id);
      }
    } catch (e) {
      console.error("Error fetching enrollment:", e);
    }

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

  // Helper to strictly match items to student batch
  const isItemForStudentBatch = (itemBatchId, itemBatchTitle, itemTitle = '') => {
    if (!studentBatchId && !studentBatchTitle) return true; // not enrolled, show all

    // 1. Direct ID match
    if (itemBatchId && studentBatchId && itemBatchId === studentBatchId) return true;
    
    // 2. Title keyword matching
    const sTitle = (studentBatchTitle || '').toUpperCase();
    const bTitle = (itemBatchTitle || '').toUpperCase();
    const iTitle = (itemTitle || '').toUpperCase();

    if (sTitle.includes('TGT') || sTitle.includes('PGT')) {
      if (bTitle.includes('TGT') || bTitle.includes('PGT') || iTitle.includes('TGT') || iTitle.includes('PGT')) {
        return true;
      }
      return false;
    }

    if (sTitle.includes('NMMS')) {
      if (bTitle.includes('NMMS') || iTitle.includes('NMMS')) {
        return true;
      }
      return false;
    }

    if (itemBatchTitle && studentBatchTitle && itemBatchTitle.toLowerCase().trim() === studentBatchTitle.toLowerCase().trim()) {
      return true;
    }

    return false;
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
      // Save / Update batch enrollment
      let updatedBatchTitle = studentBatchTitle;
      if (editBatchId) {
        try {
          await supabase.from('enrollments').delete().eq('student_id', student.id);
          await supabase.from('enrollments').insert([{ student_id: student.id, batch_id: editBatchId }]);
          const foundBatch = dbBatches.find(b => b.id === editBatchId);
          if (foundBatch) {
            updatedBatchTitle = foundBatch.title;
          }
          setStudentBatchId(editBatchId);
          setStudentBatchTitle(updatedBatchTitle);
        } catch (e) {
          console.error("Error updating enrollment:", e);
        }
      }

      const updated = { 
        ...student, 
        name: editName, 
        dob: editDob, 
        className: editClass, 
        class_name: editClass,
        photo_url: finalPhotoUrl,
        batch_id: editBatchId || studentBatchId,
        batch_title: updatedBatchTitle
      };
      setStudent(updated);
      localStorage.setItem('studentInfo', JSON.stringify(updated));
      alert("Profile updated successfully! Content & Tests have been updated for your selected batch.");
      setNewPhotoFile(null);
      setIsEditingProfile(false);
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
            <h1 className="animate-tab-enter" style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', lineHeight: '1.2', fontWeight: '700' }}>{student.name} 👋</h1>
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
        <button className={activeTab === 'courses' ? 'btn-primary' : 'btn-outline'} onClick={() => { switchTab('courses'); setSelectedBatch(null); }}>My Courses</button>
        <button className={activeTab === 'leaderboard' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('leaderboard')}>🏆 Leaderboard</button>
        <button className={activeTab === 'tests' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('tests')} style={{ position: 'relative' }}>
          Online Tests
          {(() => {
            const takenTestIds = new Set(myTestAttempts.map(a => a.test_id));
            const activeTestIds = dbTests.filter(t => t.is_active && !t.title.startsWith('[ARCHIVED]') && (!t.batch_id || t.batch_id === student?.batch_id)).map(t => t.id);
            const missedCount = activeTestIds.filter(id => !takenTestIds.has(id)).length;
            return missedCount > 0 ? (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ff4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
                🔔 {missedCount}
              </span>
            ) : null;
          })()}
        </button>

        <button className={activeTab === 'profile' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('profile')}>👤 Profile</button>
        <button className={activeTab === 'more' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('more')}>🎮 More</button>
      </div>

      <div className="animate-tab-enter">
        {activeTab === 'courses' && !selectedBatch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Header with enrolled batch indicator */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'rgba(33, 150, 243, 0.08)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
              <div>
                <h3 style={{ margin: 0, color: '#64b5f6' }}>
                  🎯 My Enrolled Course: <b>{studentBatchTitle || 'All Batches'}</b>
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Standard: <b>{student.className || student.class_name || 'Class 8th'}</b> • Sirf aapke batch ka study material aur live classes dikh rahe hain.
                </p>
              </div>
              <button onClick={() => { switchTab('profile'); setIsEditingProfile(true); }} className="btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', border: '1px solid #64b5f6', color: '#64b5f6' }}>
                ✏️ Change Course / Batch
              </button>
            </div>

            {/* Live Classes for Enrolled Batch */}
            {(() => {
              const myLiveClasses = liveClasses.filter(lc => isItemForStudentBatch(lc.batch_id, lc.batches?.title, lc.title));
              return myLiveClasses.length > 0 ? (
                <div style={{ marginBottom: '1rem' }}>
                  <h2 className="mb-4 text-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ff4444', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                    🔴 Live / Upcoming Classes ({studentBatchTitle || 'Enrolled Batch'})
                  </h2>
                  <div className="grid-cols-2">
                    {myLiveClasses.map(lc => (
                      <div key={lc.id} className="glass-card" style={{ borderLeft: '4px solid #ff4444', background: 'rgba(255, 68, 68, 0.05)' }}>
                        <h3 className="mb-2">{lc.title}</h3>
                        <p className="text-muted mb-4">Batch: {lc.batches?.title || studentBatchTitle}</p>
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
              ) : null;
            })()}

            {/* Enrolled Batch Course Materials Card */}
            <div>
              <h2 className="mb-4 text-muted">Study Materials & Notes</h2>
              {(() => {
                const myBatches = dbBatches.filter(b => isItemForStudentBatch(b.id, b.title));
                const batchesToShow = myBatches.length > 0 ? myBatches : dbBatches;

                return (
                  <div className="grid-cols-3">
                    {batchesToShow.map(batch => (
                      <div key={batch.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: batch.id === studentBatchId ? '2px solid #2196f3' : '1px solid var(--glass-border)' }}>
                        {batch.image_url ? (
                          <div style={{ width: '100%', height: '180px', backgroundImage: `url(${batch.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                        ) : (
                          <div style={{ width: '100%', height: '180px', background: 'var(--gradient-brand)', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '3rem' }}>📚</span>
                          </div>
                        )}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>{batch.title}</h3>
                            <span style={{ fontSize: '0.75rem', background: '#2196f3', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                              Enrolled
                            </span>
                          </div>
                          <p className="text-muted" style={{ flex: 1 }}>{batch.description}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                            {batch.is_free ? <span className="text-accent" style={{ fontWeight: 'bold' }}>Free</span> : <span className="text-muted">₹{batch.price}</span>}
                            <button className="btn-primary" onClick={() => setSelectedBatch(batch)} style={{ background: '#2196f3', fontWeight: 'bold' }}>
                              📖 Open Study Notes & Videos
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ margin: 0 }} className="text-muted">Available Tests</h2>
                  {studentBatchTitle ? (
                    <p style={{ margin: '0.25rem 0 0 0', color: '#64b5f6', fontSize: '0.9rem' }}>
                      📚 Showing Tests for: <b>{studentBatchTitle}</b> ({student.className || student.class_name || 'All Classes'})
                    </p>
                  ) : (
                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Showing all tests. Profile me jakar apna batch select karein.
                    </p>
                  )}
                </div>
                <button onClick={() => { switchTab('profile'); setIsEditingProfile(true); }} className="btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: '1px solid #64b5f6', color: '#64b5f6' }}>
                  ✏️ Change Batch
                </button>
              </div>

              {(() => {
                // Strictly filter tests matching ONLY student's enrolled batch
                const activeTests = dbTests.filter(t => {
                  if (t.title.startsWith('[ARCHIVED]')) return false;
                  return isItemForStudentBatch(t.batch_id, t.batches?.title, t.title);
                });

                return activeTests.length === 0 ? (
                  <div className="glass-card text-center py-5" style={{ padding: '3rem 1rem' }}>
                    <p style={{ fontSize: '1.2rem', color: '#ffb74d', margin: '0 0 0.5rem 0' }}>
                      📋 Abhi aapke <b>"{studentBatchTitle || 'Selected'}"</b> batch ke liye koi active test nahi hai.
                    </p>
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                      Naye test schedule hote hi yahan show honge. Agar aapne galti se galat batch select kar liya hai toh Profile me jakar change karein.
                    </p>
                    <button onClick={() => { switchTab('profile'); setIsEditingProfile(true); }} className="btn-primary mt-4" style={{ background: '#2196f3' }}>
                      ✏️ Batch Change Karein
                    </button>
                  </div>
                ) : activeTests.map(test => {
                const now = new Date();
                const start = test.start_time ? new Date(test.start_time) : null;
                const end = test.end_time ? new Date(test.end_time) : null;
                const isTooEarly = start && now < start;
                const isTooLate = end && now >= end;
                
                return (
                <div key={test.id} className="glass-card mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', opacity: isTooLate ? 0.5 : 1 }}>
                  <div>
                    {test.title.startsWith('[REASONING]') ? (
                      <h3 className="mb-2">
                        {test.title.replace('[REASONING] ', '')}
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255, 23, 68, 0.2)', color: '#ff1744', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem', verticalAlign: 'middle' }}>
                          🧠 Reasoning Test
                        </span>
                      </h3>
                    ) : (
                      <h3 className="mb-2">{test.title}</h3>
                    )}
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Batch: {test.batches?.title} | Duration: {test.duration_mins} Mins | {test.total_questions} Questions</p>
                    {(start || end) && (
                      <p className="text-muted" style={{ fontSize: '0.85rem', color: isTooEarly ? '#ffd700' : isTooLate ? '#ff4444' : '#44ff44' }}>
                        {isTooEarly ? `Starts at: ${start.toLocaleString()}` : isTooLate ? `Ended at: ${end.toLocaleString()}` : `Ends at: ${end ? end.toLocaleString() : 'No limit'}`}
                      </p>
                    )}
                  </div>
                  <button onClick={() => {
                    if(test.test_url) {
                      setActiveTestUrl(test.test_url);
                    } else {
                      router.push(`/test/${test.id}?practice=true`);
                    }
                  }} className="btn-primary" style={{ padding: '0.5rem 1rem', background: isTooEarly || isTooLate ? '#555' : '', cursor: isTooEarly || isTooLate ? 'not-allowed' : 'pointer' }} disabled={isTooEarly || isTooLate}>
                    {isTooEarly ? 'Upcoming' : isTooLate ? 'Ended' : 'Start Test'}
                  </button>
                </div>
              );
              })
            })()}

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



        {activeTab === 'leaderboard' && (
          <div className="animate-tab-enter">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', marginTop: '0.5rem', textAlign: 'center' }}>
              <h2 className="text-accent" style={{ fontSize: '1.8rem', margin: '0 0 0.3rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '2.2rem' }}>🏆</span> {studentBatchTitle || 'Batch'} Leaderboard
              </h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Showing Top Rankers in <b>{studentBatchTitle || 'your batch'}</b> ({student.className || student.class_name || 'Class 8th'})
              </p>
            </div>

            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--glass-border)', borderRadius: '16px' }}>
              {leaderboard.length === 0 ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                  <p style={{ fontSize: '1.2rem', color: '#ffb74d', margin: '0 0 0.5rem 0' }}>
                    🏆 Abhi aapke <b>"{studentBatchTitle || 'Selected'}"</b> batch me koi test attempt nahi hua hai.
                  </p>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.9rem' }}>
                    Pehla test dekar Leaderboard me #1 Rank haasil karein!
                  </p>
                  <button onClick={() => switchTab('tests')} className="btn-primary mt-4" style={{ background: '#2196f3' }}>
                    📝 Start Test Now
                  </button>
                </div>
              ) : leaderboard.map((lbStudent, idx) => {
                let badgeLabel = null;
                let badgeIcon = null;
                let cardStyle = { background: 'transparent', borderLeft: '4px solid transparent' };
                let rankColor = 'var(--text-muted)';
                let avatarBorder = 'transparent';

                if (idx === 0) {
                  badgeLabel = 'GOLD'; badgeIcon = '🥇';
                  cardStyle.background = 'linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%)';
                  cardStyle.borderLeft = '4px solid #FFD700';
                  rankColor = '#FFD700'; avatarBorder = '#FFD700';
                } else if (idx === 1) {
                  badgeLabel = 'SILVER'; badgeIcon = '🥈';
                  cardStyle.background = 'linear-gradient(90deg, rgba(192, 192, 192, 0.1) 0%, transparent 100%)';
                  cardStyle.borderLeft = '4px solid #C0C0C0';
                  rankColor = '#C0C0C0'; avatarBorder = '#C0C0C0';
                } else if (idx === 2) {
                  badgeLabel = 'BRONZE'; badgeIcon = '🥉';
                  cardStyle.background = 'linear-gradient(90deg, rgba(205, 127, 50, 0.1) 0%, transparent 100%)';
                  cardStyle.borderLeft = '4px solid #CD7F32';
                  rankColor = '#CD7F32'; avatarBorder = '#CD7F32';
                }

                const isTop3 = idx < 3;
                const isMe = student.id === lbStudent.id;

                return (
                  <div key={lbStudent.id} className={idx <= 2 ? "video-bg-card" : ""} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '1.2rem', 
                    borderBottom: idx === leaderboard.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.3s',
                    position: 'relative',
                    ...cardStyle
                  }}>
                    {idx <= 2 && (
                      <>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', zIndex: 0, borderRadius: '15px', overflow: 'hidden' }}>
                          <video 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            src={idx === 0 ? "/gold.mp4" : idx === 1 ? "/silver.mp4" : "/bronz.mp4"}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                          />
                        </div>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1, background: 'rgba(0,0,0,0.6)', borderRadius: '15px', pointerEvents: 'none' }}></div>
                      </>
                    )}
                    
                    {/* Content Wrapper to keep items above video and perfectly aligned */}
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                      
                      {/* Left: Rank & Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flex: 1, minWidth: 0 }}>
                      
                      <div style={{ width: '30px', textAlign: 'center', fontWeight: 'bold', fontSize: isTop3 ? '1.4rem' : '1.1rem', color: rankColor, flexShrink: 0 }}>
                        #{idx + 1}
                      </div>
                      
                      <div style={{ position: 'relative', flexShrink: 0, paddingBottom: isTop3 ? '8px' : '0' }}>
                        <div style={{ 
                          width: isTop3 ? '55px' : '45px', height: isTop3 ? '55px' : '45px', 
                          borderRadius: '50%', overflow: 'hidden', border: `2px solid ${avatarBorder}`, 
                          boxShadow: isTop3 ? `0 0 10px ${avatarBorder}66` : 'none', background: 'var(--bg-dark)'
                        }}>
                          <img src={lbStudent.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(lbStudent.name)}&background=random`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        {isTop3 && (
                          <div style={{ 
                            position: 'absolute', bottom: '0', left: '50%', transform: 'translateX(-50%)', 
                            background: avatarBorder, color: 'black', fontSize: '0.6rem', fontWeight: '900', 
                            padding: '2px 6px', borderRadius: '12px', whiteSpace: 'nowrap',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.5)', letterSpacing: '0.5px'
                          }}>
                            {badgeLabel}
                          </div>
                        )}
                      </div>

                      {/* Name & Batch */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, minWidth: 0, paddingLeft: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <h3 className={idx === 0 ? "golden-text" : ""} style={{ 
                            margin: 0, color: isMe ? 'var(--primary-color)' : 'white', 
                            fontSize: isTop3 ? '1.1rem' : '1rem',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {lbStudent.name} {isMe && '(You)'}
                          </h3>
                        </div>
                        <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: idx === 0 ? '0 0 5px #000' : 'none' }}>
                          Batch: <span style={{ color: 'var(--text-light)' }}>{lbStudent.class_name || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Score & Streak */}
                    <div style={{ textAlign: 'right', flexShrink: 0, paddingLeft: '0.5rem' }}>
                      <h3 style={{ margin: '0 0 0.2rem 0', color: '#4CAF50', fontSize: isTop3 ? '1.3rem' : '1.1rem', fontWeight: '800' }}>
                        {lbStudent.total_test_score || 0} <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>Marks</span>
                      </h3>
                      <p style={{ margin: 0, color: '#ff4444', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.2rem' }}>
                        🔥 {lbStudent.streak_days || 0} Days
                      </p>
                    </div>
                    
                    </div> {/* End of Content Wrapper */}
                  </div>
                )
              })}
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
              
              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginBottom: '1rem' }}>
                <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="btn-primary" style={{ flex: 1, padding: '0.6rem' }}>
                  {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
                </button>
                <button onClick={handleLogout} className="btn-outline" style={{ flex: 1, border: '1px solid #ff4444', color: '#ff4444', padding: '0.6rem' }}>
                  Sign Out
                </button>
              </div>
            </div>

            {isEditingProfile ? (
              <div className="glass-card animate-fade-in">
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
                      <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>Class / Standard</label>
                      <select value={editClass} onChange={(e) => setEditClass(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required>
                        <option value="Class 8th">Class 8th</option>
                        <option value="Class 9th">Class 9th</option>
                        <option value="Class 10th">Class 10th</option>
                        <option value="Class 11th">Class 11th</option>
                        <option value="Class 12th">Class 12th</option>
                        <option value="Other / Competitive">Other / Competitive Exam</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-muted" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      Enrolled Batch / Course
                    </label>
                    <select 
                      value={editBatchId || ''} 
                      onChange={(e) => setEditBatchId(e.target.value)} 
                      style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #2196F3', background: 'var(--bg-dark)', color: 'white' }}
                      required
                    >
                      <option value="">-- Select Your Batch --</option>
                      {dbBatches.map(b => (
                        <option key={b.id} value={b.id}>{b.title}</option>
                      ))}
                    </select>
                    <small style={{ color: '#81c784', marginTop: '0.25rem', display: 'block', fontSize: '0.8rem' }}>
                      ✓ Batch change karne par aapko us batch ke sabhi tests aur study notes milenge.
                    </small>
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
            ) : (
              <div className="glass-card animate-fade-in" style={{ padding: '0' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--glass-border)', background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(139,92,246,0.1))' }}>
                  <h3 style={{ margin: 0 }}>Academic Performance</h3>
                  <p className="text-muted" style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>Overview of your tests and results.</p>
                </div>
                
                <div style={{ padding: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                  <div style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#10b981', fontSize: '2rem' }}>
                      {new Set(myTestAttempts.map(a => a.test_id)).size}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tests Taken</p>
                  </div>
                  <div style={{ flex: 1, background: 'rgba(255, 68, 68, 0.1)', border: '1px solid rgba(255, 68, 68, 0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#ff4444', fontSize: '2rem' }}>
                      {dbTests.filter(t => t.is_active && !t.title.startsWith('[ARCHIVED]') && (!t.batch_id || t.batch_id === student?.batch_id)).map(t => t.id).filter(id => !new Set(myTestAttempts.map(a => a.test_id)).has(id)).length}
                    </h4>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tests Missed</p>
                  </div>
                </div>

                <div style={{ padding: '1.5rem' }}>
                  <h4 className="mb-3">Test History</h4>
                  {myTestAttempts.length === 0 ? (
                    <p className="text-muted">You haven't taken any tests yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '0.8rem', color: 'var(--text-secondary-dark)' }}>Test Name</th>
                            <th style={{ padding: '0.8rem', color: 'var(--text-secondary-dark)' }}>Score</th>
                            <th style={{ padding: '0.8rem', color: 'var(--text-secondary-dark)' }}>Grade</th>
                            <th style={{ padding: '0.8rem', color: 'var(--text-secondary-dark)' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            // Deduplicate attempts by picking the highest score for a test
                            const bestAttempts = {};
                            myTestAttempts.forEach(att => {
                              if (!bestAttempts[att.test_id] || bestAttempts[att.test_id].score < att.score) {
                                bestAttempts[att.test_id] = att;
                              }
                            });
                            
                            return Object.values(bestAttempts).map(att => {
                              const percentage = (att.score / att.tests?.total_questions) * 100;
                              let grade = '';
                              let gradeColor = '';
                              if (percentage >= 90) { grade = 'A+'; gradeColor = '#10b981'; } // Green
                              else if (percentage >= 80) { grade = 'A'; gradeColor = '#10b981'; } // Green
                              else if (percentage >= 70) { grade = 'B+'; gradeColor = '#f59e0b'; } // Yellow
                              else if (percentage >= 60) { grade = 'B'; gradeColor = '#f59e0b'; } // Yellow
                              else if (percentage >= 50) { grade = 'C'; gradeColor = '#f97316'; } // Orange
                              else { grade = 'Fail'; gradeColor = '#ff4444'; } // Red

                              return (
                                <tr key={att.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <td style={{ padding: '0.8rem' }}>{att.tests?.title || 'Unknown Test'}</td>
                                  <td style={{ padding: '0.8rem', fontWeight: 'bold' }}>{att.score} / {att.tests?.total_questions}</td>
                                  <td style={{ padding: '0.8rem' }}>
                                    <span style={{ color: gradeColor, fontWeight: 'bold', background: `${gradeColor}22`, padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                                      {grade}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.8rem' }}>
                                    <button 
                                      onClick={() => router.push(`/test/${att.test_id}?practice=true`)}
                                      className="btn-outline" 
                                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                    >
                                      Re-attempt / Practice
                                    </button>
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* --- PRACTICE & REVISION (Archived Tests) --- */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                  <h4 className="mb-3">Practice & Revision</h4>
                  <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>These are older tests. You can attempt them anytime for practice. Scores won't affect the live leaderboard.</p>
                  
                  {(() => {
                    const archivedTests = dbTests.filter(t => t.title.startsWith('[ARCHIVED]') && (!t.batch_id || t.batch_id === student?.batch_id));
                    if (archivedTests.length === 0) {
                      return <p className="text-muted">No archived tests available for practice.</p>;
                    }
                    return (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {archivedTests.map(test => {
                          const hasAttempted = myTestAttempts.some(a => a.test_id === test.id);
                          return (
                            <div key={test.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                              <h4 style={{ margin: '0 0 0.5rem 0' }}>{test.title.replace('[ARCHIVED] ', '')}</h4>
                              <p className="text-muted" style={{ margin: '0 0 1rem 0', fontSize: '0.85rem' }}>
                                {test.total_questions} Questions • {test.duration_mins} Mins
                              </p>
                              <button 
                                onClick={() => router.push(`/test/${test.id}`)}
                                className={hasAttempted ? 'btn-outline' : 'btn-primary'}
                                style={{ width: '100%', padding: '0.6rem' }}
                              >
                                {hasAttempted ? 'Re-attempt Test' : 'Attempt for Revision'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
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
              <h2 className="mb-4 text-accent">3D Anatomy Lab 🫀</h2>
              <div 
                onClick={() => router.push('/student-dashboard/anatomy')}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              >
                <div style={{ fontSize: '2rem' }}>🔬</div>
                <div>
                  <h3 style={{ margin: '0 0 0.3rem 0', color: 'white' }}>Explore 3D Organs</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Interactive anatomy models (Heart, Brain, etc.)</p>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--primary-color)' }}>➔</div>
              </div>
            </div>

            <div className="glass-card mt-6">
              <h2 className="mb-4 text-accent">Science Lab 🔭</h2>
              <div 
                onClick={() => router.push('/student-dashboard/science-lab')}
                style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
                onMouseOut={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'}
              >
                <div style={{ fontSize: '2rem' }}>🔬</div>
                <div>
                  <h3 style={{ margin: '0 0 0.3rem 0', color: 'white' }}>Explore 3D Science Models</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Interactive physics, biology, and custom models</p>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--primary-color)' }}>➔</div>
              </div>
            </div>

            <div className="glass-card mt-6">
              <h2 className="mb-4 text-primary">Brain Break 🎮</h2>
              <Game2048 />
            </div>
          </div>
        )}

        {activeTab === 'syllabus' && (
          <div className="glass-card">
            <h2 className="mb-4 text-accent text-center">NMMS Syllabus (2026-2027)</h2>
            <div style={{ color: 'var(--text-light)', lineHeight: '1.8' }}>
              <p><strong>Paper 1: MAT (Mental Ability Test)</strong> - 90 MCQs</p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
                <li>Analogy &amp; Classification</li>
                <li>Numerical &amp; Alphabet Series</li>
                <li>Pattern Perception &amp; Hidden Figures</li>
                <li>Blood Relations &amp; Coding-Decoding</li>
                <li>Venn Diagrams</li>
              </ul>

              <p><strong>Paper 2: SAT (Scholastic Aptitude Test)</strong> - 90 MCQs (Class 7 &amp; 8 NCERT)</p>
              <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', listStyleType: 'disc' }}>
                <li><strong>Maths (20 Marks):</strong> Algebra, Geometry, Mensuration, Data Handling, Fractions, Roots, Exponents.</li>
                <li><strong>Science (35 Marks):</strong> Motion, Force, Light, Sound, Electricity, Metals/Non-metals, Acids/Bases, Pollution, Cells, Microorganisms, Reproduction, Environment.</li>
                <li><strong>Social Science (35 Marks):</strong> History (Mughal, British, Freedom), Geography (Earth, Climate, Agriculture), Civics (Constitution, Parliament, Fundamental Rights).</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav">
        <div className={`bottom-nav-item ${activeTab === 'courses' ? 'active' : ''}`} onClick={() => { switchTab('courses'); setSelectedBatch(null); }}>
          <span className="bottom-nav-icon">📚</span>
          <span>Courses</span>
        </div>
        <div className={`bottom-nav-item ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => switchTab('leaderboard')}>
          <span className="bottom-nav-icon">🏆</span>
          <span>Leaderboard</span>
        </div>
        <div className={`bottom-nav-item ${activeTab === 'tests' ? 'active' : ''}`} onClick={() => switchTab('tests')}>
          <span className="bottom-nav-icon">📝</span>
          <span>Tests</span>
        </div>

        <div className={`bottom-nav-item ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => switchTab('profile')}>
          <span className="bottom-nav-icon">👤</span>
          <span>Profile</span>
        </div>
        <div className={`bottom-nav-item ${activeTab === 'more' ? 'active' : ''}`} onClick={() => switchTab('more')}>
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
                        <span style={{ color: msg.is_read ? '#60a5fa' : 'rgba(255,255,255,0.6)', fontStyle: msg.is_read ? 'normal' : 'italic', fontSize: '0.65rem' }}>
                          {msg.is_read ? 'Seen' : 'Delivered'}
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
      {activeTestUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'var(--bg-dark)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)' }}>
            <h3 style={{ margin: 0, color: 'white' }}>Online Test</h3>
            <button onClick={() => { setActiveTestUrl(null); }} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem' }}>Close Test</button>
          </div>
          <iframe src={activeTestUrl} style={{ flex: 1, width: '100%', border: 'none', background: 'white' }} />
        </div>
      )}

    </>
  );
}

