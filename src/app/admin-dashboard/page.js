"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Papa from 'papaparse';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

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
          setActiveTab('overview');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab) {
      switchTab(hashTab);
    } else {
      window.history.replaceState({ tab: 'overview' }, '', '#' + 'overview'.replace(/['"]/g, ''));
    }
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const [batches, setBatches] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [dbStudents, setDbStudents] = useState([]);
  const [dbTestAttempts, setDbTestAttempts] = useState([]);
  
  // Batch Manager State
  const [batchTitle, setBatchTitle] = useState('');
  const [batchDesc, setBatchDesc] = useState('');
  const [batchPrice, setBatchPrice] = useState('');
  const [batchImageFile, setBatchImageFile] = useState(null);
  const hiddenFileInput = useRef(null);
  const [editingBatchId, setEditingBatchId] = useState(null);
  
  // Content Manager State
  const [contentBatch, setContentBatch] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [uploadType, setUploadType] = useState('video'); // 'video' or 'pdf'
  const [pdfFile, setPdfFile] = useState(null);
  const [dbMaterials, setDbMaterials] = useState([]);
  const [dbTests, setDbTests] = useState([]);

  // Test Manager State
  const [testBatch, setTestBatch] = useState('');
  const [testTitle, setTestTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [testStartTime, setTestStartTime] = useState('');
  const [testEndTime, setTestEndTime] = useState('');
  const [testTopic, setTestTopic] = useState('');
  const [testPdf, setTestPdf] = useState(null);
  const [rawText, setRawText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState('');
  const [testUrl, setTestUrl] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [showLegacyOptions, setShowLegacyOptions] = useState(false);
  const [isReasoning, setIsReasoning] = useState(false);
  const [testLanguage, setTestLanguage] = useState('English');
  
  // Edit Questions Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Announcements & Feedback State
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [dbAnnouncements, setDbAnnouncements] = useState([]);
  const [dbFeedback, setDbFeedback] = useState([]);

  // Live Classes State
  const [liveBatch, setLiveBatch] = useState('');
  const [liveTitle, setLiveTitle] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [liveTime, setLiveTime] = useState('');
  const [dbLiveClasses, setDbLiveClasses] = useState([]);

  // Telegram Quiz State
  const [tgBotToken, setTgBotToken] = useState('8054498159:AAHdHB1Z1P479qA5C2C2loMedY7hixGcKJY');
  const [tgChatId, setTgChatId] = useState('-100'); // changed placeholder to start with -100
  const [tgQuestionCount, setTgQuestionCount] = useState('10');
  const [tgLanguage, setTgLanguage] = useState('Hindi');
  const [tgPdfFile, setTgPdfFile] = useState(null);
  const [tgPdfFileName, setTgPdfFileName] = useState('');
  const [isTgGenerating, setIsTgGenerating] = useState(false);
  const [tgGenerateProgress, setTgGenerateProgress] = useState('');
  const tgHiddenFileInput = useRef(null);

  // Admin Chat State
  const [adminChats, setAdminChats] = useState([]);
  const [activeChatStudentId, setActiveChatStudentId] = useState(null);
  const [adminReplyMessage, setAdminReplyMessage] = useState('');
  const [isAdminUploading, setIsAdminUploading] = useState(false);
  const adminChatEndRef = useRef(null);

  const activeChatStudentIdRef = useRef(null);

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
      
      if (activeChatStudentIdRef.current) {
        setActiveChatStudentId(null);
        document.body.style.overflow = '';
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

  useEffect(() => { activeChatStudentIdRef.current = activeChatStudentId; }, [activeChatStudentId]);


  
  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, []);

    const chatLengthRef = useRef(0);
    useEffect(() => {
      if (!activeChatStudentId) chatLengthRef.current = 0;
    }, [activeChatStudentId]);

    useEffect(() => {
      if (activeChatStudentId && adminChatEndRef.current) {
        const container = adminChatEndRef.current.parentElement;
        const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 150;
        
        const currentMsgs = adminChats.filter(m => m.student_id === activeChatStudentId && !m.deleted_for_admin);
        if (currentMsgs.length > chatLengthRef.current || chatLengthRef.current === 0) {
          if (chatLengthRef.current === 0 || isAtBottom) {
            adminChatEndRef.current.scrollIntoView({ behavior: chatLengthRef.current === 0 ? 'auto' : 'smooth', block: 'end' });
          }
          chatLengthRef.current = currentMsgs.length;
        }
      }
    }, [adminChats, activeChatStudentId]);

  useEffect(() => {
    // Admin Route Protection
    if (!localStorage.getItem('adminInfo')) {
      router.push('/admin-login');
      return;
    }

    async function fetchBatches() {
      const { data, error } = await supabase.from('batches').select('*');
      if (data) setBatches(data);

      const { data: mData } = await supabase.from('content_materials').select('*, batches(title)');
      if (mData) setDbMaterials(mData);

      const { data: tData } = await supabase.from('tests').select('*, batches(title)');
      if (tData) setDbTests(tData);

      const { data: testAttemptsData } = await supabase
        .from('test_attempts')
        .select('*, profiles(name, class_name), tests(title)')
        .order('created_at', { ascending: false });
      
      if (testAttemptsData) {
        const sortedData = [...testAttemptsData].reverse();
        const counts = {};
        sortedData.forEach(attempt => {
            const key = attempt.student_id + '_' + attempt.test_id;
            counts[key] = (counts[key] || 0) + 1;
            attempt.attempt_number = counts[key];
        });
        setDbTestAttempts(sortedData.reverse());
      }

      const { data: studentsData, count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact' }).eq('role', 'student');
      setTotalStudents(studentCount || 0);
      if (studentsData) setDbStudents(studentsData);

      const { data: enrollmentsData } = await supabase.from('enrollments').select('batch_id, batches(price)');
      if (enrollmentsData) {
        let rev = 0;
        enrollmentsData.forEach(e => {
          if (e.batches && e.batches.price) rev += Number(e.batches.price);
        });
        setTotalRevenue(rev);
      }

      const { data: aData } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (aData) setDbAnnouncements(aData);

      const { data: fData } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
      if (fData) setDbFeedback(fData);

      const { data: lData } = await supabase.from('live_classes').select('*, batches(title)').order('scheduled_time', { ascending: true });
      if (lData) setDbLiveClasses(lData);
    }
    fetchBatches();

    const fetchAdminChats = async () => {
      const { data } = await supabase
        .from('admin_chats')
        .select('*, profiles(name, photo_url, username, last_seen, is_online)')
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
    fetchAdminChats();
    const chatInterval = setInterval(fetchAdminChats, 3000);

    return () => clearInterval(chatInterval);
  }, [router]);

  // When admin selects a student, mark messages from them as read
  useEffect(() => {
    if (activeChatStudentId) {
      const unreadFromStudent = adminChats.filter(m => m.student_id === activeChatStudentId && m.sender === 'student' && !m.is_read).map(m => m.id);
      if (unreadFromStudent.length > 0) {
        supabase.from('admin_chats').update({ is_read: true }).in('id', unreadFromStudent).then(() => {
          setAdminChats(prev => prev.map(m => unreadFromStudent.includes(m.id) ? { ...m, is_read: true } : m));
        });
      }
    }
  }, [activeChatStudentId, adminChats]);

  
  
  const handleDeleteMessage = async (msg) => {
    const isMine = msg.sender === 'admin';
    const options = isMine ? "1. Delete for Me\n2. Delete for Everyone\nCancel" : "1. Delete for Me\nCancel";
    const choice = window.prompt(`Type 1 or 2 to delete:\n${options}`);
    if (choice === '1') {
      await supabase.from('admin_chats').update({ deleted_for_admin: true }).eq('id', msg.id);
      setAdminChats(prev => prev.map(m => m.id === msg.id ? { ...m, deleted_for_admin: true } : m));
    } else if (choice === '2' && isMine) {
      await supabase.from('admin_chats').update({ is_deleted_for_everyone: true }).eq('id', msg.id);
      setAdminChats(prev => prev.map(m => m.id === msg.id ? { ...m, is_deleted_for_everyone: true } : m));
    }
  };

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

  const handleAdminChatReply = async (e) => {
    e.preventDefault();
    if (!adminReplyMessage.trim() || !activeChatStudentId) return;
    
    const msg = adminReplyMessage;
    setAdminReplyMessage('');
    
    setAdminChats(prev => [...prev, { student_id: activeChatStudentId, sender: 'admin', message: msg, created_at: new Date().toISOString() }]);

    const { error } = await supabase.from('admin_chats').insert([{
      student_id: activeChatStudentId,
      sender: 'admin',
      message: msg
    }]);
    if (error) console.error("Error sending admin reply:", error);
  };

  const handleCreateLiveClass = async (e) => {
    e.preventDefault();
    if (!liveBatch || !liveTitle || !liveUrl || !liveTime) return;
    
    const { data, error } = await supabase.from('live_classes').insert([
      { batch_id: liveBatch, title: liveTitle, join_url: liveUrl, scheduled_time: new Date(liveTime).toISOString() }
    ]).select('*, batches(title)');

    if (error) {
      alert("Error scheduling live class: " + error.message);
    } else {
      alert("Live class scheduled successfully!");
      setDbLiveClasses([...dbLiveClasses, data[0]]);
      setLiveTitle(''); setLiveUrl(''); setLiveTime('');
    }
  };

  const handleDeleteLiveClass = async (id) => {
    if (!window.confirm("Delete this live class?")) return;
    const { error } = await supabase.from('live_classes').delete().eq('id', id);
    if (!error) {
      setDbLiveClasses(dbLiveClasses.filter(c => c.id !== id));
      alert("Live class deleted.");
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementTitle || !announcementContent) return;
    const { data, error } = await supabase.from('announcements').insert([{ title: announcementTitle, content: announcementContent }]).select();
    if (error) {
      alert("Error posting announcement: " + error.message);
    } else {
      alert("Announcement posted successfully!");
      setDbAnnouncements([data[0], ...dbAnnouncements]);
      setAnnouncementTitle('');
      setAnnouncementContent('');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) {
      setDbAnnouncements(dbAnnouncements.filter(a => a.id !== id));
      alert("Announcement deleted.");
    } else {
      alert("Error deleting announcement: " + error.message);
    }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!batchTitle) return;

    let finalImageUrl = null;
    if (batchImageFile) {
      const fileExt = batchImageFile.name.split('.').pop();
      const fileName = `thumb_${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(fileName, batchImageFile);

      if (uploadError) {
        alert("Error uploading thumbnail: " + uploadError.message);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from('notes').getPublicUrl(fileName);
      finalImageUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase.from('batches').insert([
      { 
        title: batchTitle, 
        description: batchDesc, 
        price: batchPrice ? parseFloat(batchPrice) : 0, 
        is_free: !batchPrice || parseFloat(batchPrice) === 0,
        image_url: finalImageUrl 
      }
    ]).select();
    if (error) {
      alert("Error creating course: " + error.message);
    } else {
      alert("Course created successfully!");
      setBatches([...batches, data[0]]);
      setBatchTitle(''); setBatchDesc(''); setBatchPrice(''); setBatchImageFile(null);
      document.getElementById('batch-thumb-upload').value = '';
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!window.confirm("Are you sure? This will delete the course! Note: You cannot delete a course if it has materials, tests, or enrollments associated with it yet. (Delete those first).")) return;
    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (error) {
      alert("Error deleting course: " + error.message);
    } else {
      setBatches(batches.filter(b => b.id !== id));
      alert("Course deleted successfully!");
    }
  };

  const handleEditThumbnailClick = (id) => {
    setEditingBatchId(id);
    hiddenFileInput.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !editingBatchId) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `thumb_${Math.random()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('notes')
      .upload(fileName, file);

    if (uploadError) {
      alert("Error uploading thumbnail: " + uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('notes').getPublicUrl(fileName);
    const finalImageUrl = publicUrlData.publicUrl;

    const { error } = await supabase.from('batches').update({ image_url: finalImageUrl }).eq('id', editingBatchId);
    if (error) {
      alert("Error saving thumbnail to database: " + error.message);
    } else {
      setBatches(batches.map(b => b.id === editingBatchId ? { ...b, image_url: finalImageUrl } : b));
      alert("Thumbnail updated successfully!");
    }
    
    // reset input
    e.target.value = '';
    setEditingBatchId(null);
  };

  const handleUploadContent = async (e) => {
    e.preventDefault();
    if (!contentBatch || !contentTitle) return;
    
    let finalFileUrl = contentUrl;

    if (uploadType === 'pdf') {
      if (!pdfFile) {
        alert("Please select a PDF file.");
        return;
      }
      
      const fileExt = pdfFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notes')
        .upload(filePath, pdfFile);

      if (uploadError) {
        alert("Error uploading PDF to storage. (Make sure you created the 'notes' bucket in Supabase!). Error: " + uploadError.message);
        return;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('notes').getPublicUrl(filePath);
      finalFileUrl = publicUrlData.publicUrl;
    }

    if (!finalFileUrl) return;

    const { error } = await supabase.from('content_materials').insert([
      { batch_id: contentBatch, title: contentTitle, file_url: finalFileUrl }
    ]);
    
    if (error) {
      alert("Error uploading content: " + error.message);
    } else {
      alert("Material added to Course successfully!");
      setContentTitle('');
      setContentUrl('');
      setPdfFile(null);
      // Refresh materials list
      const { data: mData } = await supabase.from('content_materials').select('*, batches(title)');
      if (mData) setDbMaterials(mData);
    }
  };

  const handleDeleteContent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    const { error } = await supabase.from('content_materials').delete().eq('id', id);
    if (error) {
      alert("Error deleting content: " + error.message);
    } else {
      setDbMaterials(prev => prev.filter(m => m.id !== id));
      alert("Material deleted successfully!");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student's account? This will remove them from the system permanently.")) return;
    
    // Manually delete dependent records first to avoid foreign key constraints
    await supabase.from('test_attempts').delete().eq('student_id', studentId);
    await supabase.from('enrollments').delete().eq('student_id', studentId);
    
    const { error } = await supabase.from('profiles').delete().eq('id', studentId);
    if (error) {
      alert("Error deleting student: " + error.message);
    } else {
      alert("Student deleted successfully and permanently.");
      setDbStudents(prev => prev.filter(s => s.id !== studentId));
      setTotalStudents(prev => prev - 1);
    }
  };

  const handleApproveStudent = async (studentId, currentUsername) => {
    const newUsername = currentUsername.replace('[PENDING] ', '');
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', studentId);
    if (error) {
      alert("Error approving student: " + error.message);
    } else {
      setDbStudents(prev => prev.map(s => s.id === studentId ? { ...s, username: newUsername } : s));
      alert("Student approved successfully! They can now log in.");
    }
  };

  const handleDeleteTest = async (id, currentTitle) => {
    if (!window.confirm("Are you sure you want to archive this test? It will be moved to Test History.")) return;
    
    const { error: tError } = await supabase.from('tests').update({ title: `[ARCHIVED] ${currentTitle}` }).eq('id', id);
    if (tError) {
      alert("Error archiving test: " + tError.message);
    } else {
      setDbTests(prev => prev.map(t => t.id === id ? { ...t, title: `[ARCHIVED] ${currentTitle}` } : t));
      alert("Test moved to Test History successfully!");
    }
  };

  const handleRestoreTest = async (id, currentTitle) => {
    const newTitle = currentTitle.replace('[ARCHIVED] ', '');
    const { error: tError } = await supabase.from('tests').update({ title: newTitle }).eq('id', id);
    if (tError) {
      alert("Error restoring test: " + tError.message);
    } else {
      setDbTests(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
      alert("Test restored and is active again!");
    }
  };

  const autoArchivePreviousTests = async (batchId) => {
    // Fetch all active tests for this batch
    const { data: activeTests } = await supabase.from('tests').select('id, title').eq('batch_id', batchId).not('title', 'ilike', '[ARCHIVED]%');
    if (activeTests && activeTests.length > 0) {
      for (const t of activeTests) {
        const newTitle = `[ARCHIVED] ${t.title}`;
        await supabase.from('tests').update({ title: newTitle }).eq('id', t.id);
      }
      // Refresh local state to reflect archives
      setDbTests(prev => prev.map(t => {
        const active = activeTests.find(a => a.id === t.id);
        if (active) return { ...t, title: `[ARCHIVED] ${t.title}` };
        return t;
      }));
    }
  };

  const handlePublishTest = async (e) => {
    e.preventDefault();
    alert("Manual publish is not fully wired. Use AI Generation below!");
  };

  const handlePublishLinkTest = async () => {
    if (!testBatch || !testTitle || !testUrl || !duration || !totalQuestions) {
      alert("Please fill all fields for Link Test!");
      return;
    }
    try {
      await autoArchivePreviousTests(testBatch);
      const { data, error } = await supabase.from('tests').insert([
        { batch_id: testBatch, title: isReasoning ? '[REASONING] ' + testTitle : testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions), test_url: testUrl, start_time: testStartTime ? new Date(testStartTime).toISOString() : null, end_time: testEndTime ? new Date(testEndTime).toISOString() : null }
      ]);
      if (error) throw error;
      alert("Test Link Published Successfully!");
      setTestTitle(''); setTestUrl(''); setDuration(''); setTotalQuestions(''); setIsReasoning(false);
      const { data: tData } = await supabase.from('tests').select('*, batches(title)');
      if (tData) setDbTests(tData);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handlePublishCsvTest = async () => {
    if (!testBatch || !testTitle || !csvFile || !duration || !totalQuestions) {
      alert("Please fill all fields and select a CSV file!");
      return;
    }
    
    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        try {
          const rows = results.data;
          if(rows.length === 0) throw new Error("CSV is empty");
          
          // 1. Auto Archive
          await autoArchivePreviousTests(testBatch);
          // 2. Insert Test
          const { data: testData, error: testError } = await supabase.from('tests').insert([
            { batch_id: testBatch, title: isReasoning ? '[REASONING] ' + testTitle : testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions), start_time: testStartTime ? new Date(testStartTime).toISOString() : null, end_time: testEndTime ? new Date(testEndTime).toISOString() : null }
          ]).select();
          if (testError) throw testError;
          const testId = testData[0].id;

          // 2. Insert Questions
          const questionsToInsert = rows.map(r => {
            const optA = r.option_a || r.A || '';
            const optB = r.option_b || r.B || '';
            const optC = r.option_c || r.C || '';
            const optD = r.option_d || r.D || '';
            let correct = (r.correct_answer || r.Answer || '').trim();
            
            if (correct.toUpperCase() === 'A') correct = optA;
            else if (correct.toUpperCase() === 'B') correct = optB;
            else if (correct.toUpperCase() === 'C') correct = optC;
            else if (correct.toUpperCase() === 'D') correct = optD;

            return {
              test_id: testId,
              question_text: r.question_text || r.Question || r.Q || '',
              option_a: optA,
              option_b: optB,
              option_c: optC,
              option_d: optD,
              correct_answer: correct
            };
          });
          
          const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
          if (qError) throw qError;
          
          alert(`Success! Generated and saved ${questionsToInsert.length} questions from CSV to the database.`);
          setTestTitle(''); setCsvFile(null); setDuration(''); setTotalQuestions(''); setIsReasoning(false);
          if(document.getElementById('csv-upload')) {
            document.getElementById('csv-upload').value = '';
          }
          const { data: tData } = await supabase.from('tests').select('*, batches(title)');
          if (tData) setDbTests(tData);
        } catch (err) {
          alert("Error processing CSV: " + err.message);
        }
      },
      error: function(err) {
        alert("Error parsing CSV: " + err.message);
      }
    });
  };

  const handleGenerateAI = async () => {
    if (!testBatch || !testTitle || !testTopic || !duration || !totalQuestions) {
      alert("Please fill all test fields (including Topic) before generating!");
      return;
    }
    setIsGenerating(true);
    setGenerateProgress(`Initializing generation...`);
    try {
      const total = parseInt(totalQuestions, 10);
      const batchSize = 1; // 1 Question per batch completely guarantees NO VERCEL TIMEOUT
      let allGeneratedQuestions = [];

      for (let i = 0; i < total; i += batchSize) {
        const count = Math.min(batchSize, total - i);
        setGenerateProgress(`Generating question ${i + 1} of ${total}...`);
        
        const res = await fetch('/api/generate-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ topic: testTopic, questionCount: count, language: testLanguage })
        });
        
        if (!res.ok) {
           const errText = await res.text();
           throw new Error(`Server returned ${res.status}: ${errText.substring(0, 50)}...`);
        }

        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        if (!data.questions || data.questions.length === 0) throw new Error(`No questions generated for batch ${i}-${i+count}.`);
        
        allGeneratedQuestions = allGeneratedQuestions.concat(data.questions);
      }
      
      setGenerateProgress(`Saving ${allGeneratedQuestions.length} questions to database...`);
      
      const generatedQuestions = allGeneratedQuestions;
      if (!generatedQuestions || generatedQuestions.length === 0) throw new Error("No questions generated overall.");

      // 1. Auto Archive
      await autoArchivePreviousTests(testBatch);
      // 2. Insert Test
      const { data: testData, error: testError } = await supabase.from('tests').insert([
        { batch_id: testBatch, title: isReasoning ? '[REASONING] ' + testTitle : testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions), start_time: testStartTime ? new Date(testStartTime).toISOString() : null, end_time: testEndTime ? new Date(testEndTime).toISOString() : null }
      ]).select();

      if (testError) throw testError;
      const testId = testData[0].id;

      // 2. Insert Questions
      const questionsToInsert = generatedQuestions.map(q => ({
        test_id: testId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer
      }));

      const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
      if (qError) throw qError;

      alert(`Success! Generated and saved ${questionsToInsert.length} questions to the database.`);
      setTestTitle(''); setTestTopic(''); setDuration(''); setTotalQuestions(''); setIsReasoning(false);
      
      const { data: tData } = await supabase.from('tests').select('*, batches(title)');
      if (tData) setDbTests(tData);
    } catch (err) {
      alert("Error generating test: " + err.message);
    }
    setIsGenerating(false);
    setGenerateProgress('');
  };

  const handleGeneratePDF = async () => {
    if (!testBatch || !testTitle || !testPdf || !duration || !totalQuestions) {
      alert("Please fill all test fields and select a PDF before generating!");
      return;
    }
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append('pdf', testPdf);
      formData.append('questionCount', totalQuestions);

      const res = await fetch('/api/generate-pdf-test', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      if (!data.questions || data.questions.length === 0) throw new Error("No questions generated.");

      // 1. Auto Archive
      await autoArchivePreviousTests(testBatch);
      // 2. Insert Test
      const { data: testData, error: testError } = await supabase.from('tests').insert([
        { batch_id: testBatch, title: isReasoning ? '[REASONING] ' + testTitle : testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions), start_time: testStartTime ? new Date(testStartTime).toISOString() : null, end_time: testEndTime ? new Date(testEndTime).toISOString() : null }
      ]).select();

      if (testError) throw testError;
      const testId = testData[0].id;

      // 2. Insert Questions
      const questionsToInsert = data.questions.map(q => ({
        test_id: testId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer
      }));

      const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
      if (qError) throw qError;

      alert(`Success! Generated and saved ${questionsToInsert.length} questions from PDF to the database.`);
      setTestTitle(''); setTestPdf(null); setDuration(''); setTotalQuestions(''); setIsReasoning(false);
      // reset file input
      document.getElementById('pdf-upload').value = '';
      
      const { data: tData } = await supabase.from('tests').select('*, batches(title)');
      if (tData) setDbTests(tData);
    } catch (err) {
      alert("Error generating test from PDF: " + err.message);
    }
    setIsGenerating(false);
  };

  const handleGenerateText = async () => {
    if (!testBatch || !testTitle || !rawText || !duration || !totalQuestions) {
      alert("Please fill all test fields and paste the raw text before generating!");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-text-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, questionCount: totalQuestions })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      if (!data.questions || data.questions.length === 0) throw new Error("No questions generated.");

      // 1. Auto Archive
      await autoArchivePreviousTests(testBatch);
      // 2. Insert Test
      const { data: testData, error: testError } = await supabase.from('tests').insert([
        { batch_id: testBatch, title: isReasoning ? '[REASONING] ' + testTitle : testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions), start_time: testStartTime ? new Date(testStartTime).toISOString() : null, end_time: testEndTime ? new Date(testEndTime).toISOString() : null }
      ]).select();

      if (testError) throw testError;
      const testId = testData[0].id;

      // 2. Insert Questions
      const questionsToInsert = data.questions.map(q => ({
        test_id: testId,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_answer: q.correct_answer
      }));

      const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
      if (qError) throw qError;

      alert(`Success! Generated and saved ${questionsToInsert.length} questions from text to the database.`);
      setTestTitle(''); setRawText(''); setDuration(''); setTotalQuestions(''); setIsReasoning(false);
      
      const { data: tData } = await supabase.from('tests').select('*, batches(title)');
      if (tData) setDbTests(tData);
    } catch (err) {
      alert("Error generating test from text: " + err.message);
    }
    setIsGenerating(false);
  };

  const handleTgPdfUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTgPdfFile(file);
      setTgPdfFileName(file.name);
    }
  };

  const handleGenerateTgQuiz = async () => {
    if (!tgBotToken || !tgChatId || !tgPdfFile || !tgQuestionCount) {
      alert("Please fill all fields and upload a PDF!");
      return;
    }
    
    setIsTgGenerating(true);
    setTgGenerateProgress("Step 1/3: Extracting Text from PDF...");
    
    try {
      const formData = new FormData();
      formData.append('pdf', tgPdfFile);
      const pdfRes = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
      const pdfData = await pdfRes.json();
      if (pdfData.error) throw new Error("PDF Error: " + pdfData.error);
      const extractedText = pdfData.text;
      
      const total = parseInt(tgQuestionCount, 10);
      let successCount = 0;
      
      for (let i = 0; i < total; i++) {
         setTgGenerateProgress(`Step 2/3: Generating AI Question ${i + 1} of ${total}...`);
         
         const aiRes = await fetch('/api/generate-text-test', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ rawText: extractedText, questionCount: 1, language: tgLanguage })
         });
         const aiData = await aiRes.json();
         if (aiData.error) throw new Error("AI Error: " + aiData.error);
         if (!aiData.questions || aiData.questions.length === 0) continue;
         
         const q = aiData.questions[0];
         
         setTgGenerateProgress(`Step 3/3: Posting Question ${i + 1} to Telegram...`);
         
         const tgRes = await fetch('/api/post-telegram-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               botToken: tgBotToken.trim(),
               chatId: tgChatId.trim(),
               question: q
            })
         });
         const tgData = await tgRes.json();
         if (tgData.error) throw new Error("Telegram Error: " + tgData.error);
         
         successCount++;
         await new Promise(r => setTimeout(r, 1000));
      }
      
      alert(`Success! Successfully posted ${successCount} questions to Telegram.`);
      setTgPdfFile(null);
      setTgPdfFileName('');
      if (tgHiddenFileInput.current) tgHiddenFileInput.current.value = '';
    } catch (err) {
      alert("Error generating Telegram Quiz: " + err.message);
    }
    
    setIsTgGenerating(false);
    setTgGenerateProgress('');
  };


  const openEditModal = async (testId) => {
    setSelectedTestId(testId);
    setTestQuestions([]);
    setIsEditModalOpen(true);
    try {
      const { data, error } = await supabase.from('questions').select('*').eq('test_id', testId).order('id', { ascending: true });
      if (error) throw error;
      setTestQuestions(data || []);
    } catch (err) {
      alert("Error fetching questions: " + err.message);
    }
  };

  const handleUploadQuestionImage = async (questionId, file) => {
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${questionId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('question_images').upload(filePath, file);
      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          throw new Error("The 'question_images' bucket does not exist. Please create it in your Supabase Storage dashboard and make it public.");
        }
        throw uploadError;
      }
      
      const { data: publicUrlData } = supabase.storage.from('question_images').getPublicUrl(filePath);
      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase.from('questions').update({ image_url: publicUrl }).eq('id', questionId);
      if (updateError) {
        if (updateError.message.includes('column "image_url" of relation "questions" does not exist')) {
          throw new Error("The 'image_url' column does not exist. Please run the SQL command provided to add it.");
        }
        throw updateError;
      }
      
      // Update local state
      setTestQuestions(prev => prev.map(q => q.id === questionId ? { ...q, image_url: publicUrl } : q));
      alert("Image uploaded and attached successfully!");
    } catch (err) {
      alert("Error uploading image: " + err.message);
    }
    setIsUploadingImage(false);
  };

  return (
    <div className="container pt-navbar mobile-pb">
      <div className="flex justify-between align-center mb-4 animate-tab-enter" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
        <button 
          className="btn-outline" 
          style={{ padding: '0.5rem 1rem' }}
          onClick={() => {
            localStorage.removeItem('adminInfo');
            router.push('/admin-login');
          }}
        >
          Logout
        </button>
      </div>

      <div className="flex mb-4" style={{ gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', whiteSpace: 'nowrap' }}>
        <button className={activeTab === 'overview' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('overview')} style={{ padding: '0.5rem 1rem' }}>Overview</button>
        <button className={activeTab === 'pending' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('pending')} style={{ padding: '0.5rem 1rem', position: 'relative' }}>
          Pending Approvals
          {dbStudents.filter(s => s.username?.startsWith('[PENDING] ')).length > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ff4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold' }}>
              {dbStudents.filter(s => s.username?.startsWith('[PENDING] ')).length}
            </span>
          )}
        </button>
        <button className={activeTab === 'students' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('students')} style={{ padding: '0.5rem 1rem' }}>Students List</button>
        <button className={activeTab === 'results' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('results')} style={{ padding: '0.5rem 1rem' }}>Test Results</button>
        <button className={activeTab === 'content' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('content')} style={{ padding: '0.5rem 1rem' }}>Content Manager</button>
        <button className={activeTab === 'test' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('test')} style={{ padding: '0.5rem 1rem' }}>Test Manager</button>
        <button className={activeTab === 'test_history' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('test_history')} style={{ padding: '0.5rem 1rem' }}>Test History</button>
        <button className={activeTab === 'ai_test' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('ai_test')} style={{ padding: '0.5rem 1rem' }}>🤖 AI Test</button>
        <button className={activeTab === 'tg_test' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('tg_test')} style={{ padding: '0.5rem 1rem' }}>📲 Telegram Test</button>
        <button className={activeTab === 'live' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('live')} style={{ padding: '0.5rem 1rem' }}>Live Classes</button>
        <button className={activeTab === 'announcements' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('announcements')} style={{ padding: '0.5rem 1rem' }}>Announcements</button>
        <button className={activeTab === 'feedback' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('feedback')} style={{ padding: '0.5rem 1rem' }}>Student Feedback</button>
        <button className={activeTab === 'admin_chats' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('admin_chats')} style={{ padding: '0.5rem 1rem' }}>💬 Student Chats</button>
      </div>

      {activeTab === 'overview' && (
        <div className="animate-tab-enter grid-cols-2" style={{ alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="glass-card text-center" style={{ flex: 1, minWidth: '150px' }}>
                <h3 className="text-accent" style={{ fontSize: '2rem' }}>₹{totalRevenue}</h3>
                <p className="text-muted">Total Revenue</p>
              </div>
              <div className="glass-card text-center" style={{ flex: 1, minWidth: '150px', cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid var(--accent)' }} onClick={() => switchTab('students')}>
                <h3 className="text-accent" style={{ fontSize: '2rem' }}>{totalStudents}</h3>
                <p className="text-muted">Total Students (Click to View)</p>
              </div>
            </div>

            <div className="glass-card">
              <h3 className="mb-4">Create New Course (Batch)</h3>
              <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" placeholder="Course Title (e.g. Class 10 Science)" value={batchTitle} onChange={(e) => setBatchTitle(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                <textarea placeholder="Course Description" value={batchDesc} onChange={(e) => setBatchDesc(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white', minHeight: '100px' }}></textarea>
                <input type="number" placeholder="Price in ₹ (Leave 0 for Free)" value={batchPrice} onChange={(e) => setBatchPrice(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-muted" style={{ fontSize: '0.9rem' }}>Thumbnail Image</label>
                  <input id="batch-thumb-upload" type="file" accept="image/*" onChange={(e) => setBatchImageFile(e.target.files[0])} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                </div>
                <button type="submit" className="btn-primary mt-2">Create Course</button>
              </form>
            </div>
          </div>

          <div className="glass-card">
            <h3 className="mb-4">Manage Courses ({batches.length})</h3>
            <input type="file" accept="image/*" ref={hiddenFileInput} onChange={handleFileChange} style={{ display: 'none' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
              {batches.length === 0 ? <p className="text-muted">No courses found.</p> : batches.map(b => (
                <div key={b.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {b.image_url ? (
                      <img src={b.image_url} alt="thumbnail" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--gradient-brand)', opacity: 0.8 }}></div>
                    )}
                    <div>
                      <h4 style={{ margin: '0 0 0.25rem 0' }}>{b.title}</h4>
                      <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>
                        {b.is_free ? 'Free' : `₹${b.price}`}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEditThumbnailClick(b.id)} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>Upload Image</button>
                    <button onClick={() => handleDeleteBatch(b.id)} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="animate-tab-enter grid-cols-2" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card">
            <h3 className="mb-4">Add Course Material</h3>
            <form onSubmit={handleUploadContent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select value={contentBatch} onChange={(e) => setContentBatch(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required>
                <option value="">Select Batch...</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <input type="text" placeholder="Material Title (e.g. Chapter 1 Notes)" value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="uploadType" value="video" checked={uploadType === 'video'} onChange={() => setUploadType('video')} /> YouTube Video
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="uploadType" value="pdf" checked={uploadType === 'pdf'} onChange={() => setUploadType('pdf')} /> Secure PDF Note
                </label>
              </div>

              {uploadType === 'video' ? (
                <input type="url" placeholder="YouTube Video URL (e.g. https://youtu.be/...)" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
              ) : (
                <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files[0])} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
              )}

              <button type="submit" className="btn-primary mt-2">Publish Material to Course</button>
            </form>
          </div>

          <div className="glass-card">
            <h3 className="mb-4">Manage Uploaded Materials</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {dbMaterials.length === 0 ? <p className="text-muted">No materials uploaded yet.</p> : dbMaterials.map(m => (
                <div key={m.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{m.title}</h4>
                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Batch: {m.batches?.title}</p>
                  </div>
                  <button onClick={() => handleDeleteContent(m.id)} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem' }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div className="animate-tab-enter">
          <div className="glass-card">
            <h3 className="mb-4">Student Test Results</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Student Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Test Title</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Total Attempts</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Attempt Details</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (dbTestAttempts.length === 0) return <tr><td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No results found.</td></tr>;
                    
                    const grouped = {};
                    dbTestAttempts.forEach(attempt => {
                      const key = attempt.student_id + '_' + attempt.test_id;
                      if (!grouped[key]) {
                        grouped[key] = {
                          student_id: attempt.student_id,
                          test_id: attempt.test_id,
                          studentName: attempt.profiles?.name || 'N/A',
                          className: attempt.profiles?.class_name || 'N/A',
                          testTitle: attempt.tests?.title || 'Deleted Test',
                          attempts: []
                        };
                      }
                      grouped[key].attempts.push(attempt);
                    });

                    return Object.values(grouped).map(group => {
                      const sortedAttempts = [...group.attempts].sort((a,b) => a.attempt_number - b.attempt_number);
                      
                      return (
                        <tr key={group.student_id + '_' + group.test_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' }}>
                          <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                            {group.studentName} <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>({group.className})</span>
                          </td>
                          <td style={{ padding: '1rem' }}>{group.testTitle}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                              {group.attempts.length} Attempts
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <details style={{ cursor: 'pointer', minWidth: '200px' }}>
                              <summary style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontWeight: 'bold', userSelect: 'none', color: 'var(--text-accent)' }}>
                                View Attempt Details
                              </summary>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                                {sortedAttempts.map(att => (
                                  <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Attempt {att.attempt_number}</span>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(att.created_at).toLocaleString()}</span>
                                    </div>
                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: att.score >= att.total_questions / 2 ? '#10b981' : '#ff4444' }}>
                                      {att.score} / {att.total_questions}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'ai_test' && (
        <div className="animate-tab-enter" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card mb-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="mb-4 text-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🤖 AI Test Generator
            </h3>
            <p className="text-muted mb-4">Select options below to instantly generate and schedule a test using Nvidia AI.</p>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="text-light" style={{ fontSize: '0.9rem' }}>Select Batch / Class</label>
                <select value={testBatch} onChange={(e) => setTestBatch(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required>
                  <option value="">Select Batch...</option>
                  {batches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>Test Name</label>
                  <input type="text" placeholder="e.g. Science Chapter 1 Mock" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
                </div>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>AI Generation Topic</label>
                  <input type="text" placeholder="e.g. Photosynthesis Class 10" value={testTopic} onChange={(e) => setTestTopic(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>Duration (Mins)</label>
                  <input type="number" placeholder="Duration" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
                </div>
                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>Total Questions</label>
                  <input type="number" placeholder="Count" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
                </div>
                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>Language</label>
                  <select value={testLanguage} onChange={(e) => setTestLanguage(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                    <option value="Hinglish">Hinglish</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>Start Time (Optional)</label>
                  <input type="datetime-local" value={testStartTime} onChange={(e) => setTestStartTime(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                </div>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>End Time (Optional)</label>
                  <input type="datetime-local" value={testEndTime} onChange={(e) => setTestEndTime(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
                </div>
              </div>

              <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="btn-primary" style={{ background: 'var(--gradient-brand)', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}>
                {isGenerating ? (generateProgress || '⏳ Generating AI Test...') : '✨ Generate & Schedule Test'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {activeTab === 'test' && (
        <div className="animate-tab-enter grid-cols-2" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card mb-4">
            <h3 className="mb-4">Create New Online Test</h3>
            <form onSubmit={handlePublishTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select value={testBatch} onChange={(e) => setTestBatch(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required>
                <option value="">Select Batch for Test...</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" placeholder="Test Name (e.g. MAT Mock Test 1)" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <input type="number" placeholder="Duration (Mins)" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ flex: 1, minWidth: '120px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                  <input type="number" placeholder="Total Questions" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} style={{ flex: 1, minWidth: '120px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                  <input type="datetime-local" placeholder="Start Time (Optional)" value={testStartTime} onChange={(e) => setTestStartTime(e.target.value)} title="Start Time (Optional)" style={{ flex: 1, minWidth: '150px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                  <input type="datetime-local" placeholder="End Time (Optional)" value={testEndTime} onChange={(e) => setTestEndTime(e.target.value)} title="End Time (Optional)" style={{ flex: 1, minWidth: '150px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255, 23, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 23, 68, 0.3)' }}>
                  <input type="checkbox" checked={isReasoning} onChange={(e) => setIsReasoning(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#ff1744' }} />
                  <span style={{ color: 'var(--text-light)', fontWeight: 'bold' }}>Is this a Reasoning/Maths Test? (Disables Camera Monitoring)</span>
                </label>
              </div>
              
              <h4 className="mt-2 text-accent" style={{ color: '#4CAF50' }}>Option 1: Embed a Test Link (Google Forms, etc.)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(76, 175, 80, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                <input type="url" placeholder="Paste Test Link (e.g. Google Forms URL)" value={testUrl} onChange={(e) => setTestUrl(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                <button type="button" onClick={handlePublishLinkTest} className="btn-primary" style={{ background: '#4CAF50', width: '100%' }}>
                  🔗 Publish Link Test
                </button>
                <small style={{ color: 'var(--text-muted)' }}>* Link will open inside the app in a secure view.</small>
              </div>

              <h4 className="mt-4 text-accent" style={{ color: '#2196F3' }}>Option 2: Bulk Upload (Excel / CSV)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(33, 150, 243, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>Upload a CSV file with columns: <b>Question, A, B, C, D, Answer</b></p>
                <input id="csv-upload" type="file" onChange={(e) => setCsvFile(e.target.files[0])} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                <button type="button" onClick={handlePublishCsvTest} className="btn-primary" style={{ background: '#2196F3', width: '100%' }}>
                  📊 Upload & Publish CSV Test
                </button>
              </div>

              <div style={{ marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowLegacyOptions(!showLegacyOptions)} className="btn-outline" style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>🤖 AI Test Generation (Requires API Key)</span>
                  <span>{showLegacyOptions ? '▲' : '▼'}</span>
                </button>
                
                {showLegacyOptions && (
                  <div style={{ marginTop: '1rem', padding: '1rem', border: '1px dashed var(--glass-border)', borderRadius: '8px' }}>
                    <h4 className="text-accent">Generate from Topic</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                      <input type="text" placeholder="Topic for AI (e.g. Science Class 10)" value={testTopic} onChange={(e) => setTestTopic(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                      <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="btn-primary" style={{ background: 'var(--gradient-brand)', width: '100%' }}>
                        {isGenerating ? 'Generating...' : '✨ Auto-Generate Test'}
                      </button>
                    </div>
      
                    <h4 className="text-accent">Generate from PDF</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                      <input id="pdf-upload" type="file" accept="application/pdf" onChange={(e) => setTestPdf(e.target.files[0])} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                      <button type="button" onClick={handleGeneratePDF} disabled={isGenerating} className="btn-primary" style={{ background: 'var(--gradient-brand)', width: '100%' }}>
                        {isGenerating ? 'Generating...' : '📄 Read PDF & Generate'}
                      </button>
                    </div>
      
                    <h4 className="text-accent">Paste Text</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <textarea 
                        placeholder="Paste your question paper and answer key here..." 
                        value={rawText} 
                        onChange={(e) => setRawText(e.target.value)} 
                        style={{ width: '100%', minHeight: '150px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white', fontFamily: 'inherit' }}
                      />
                      <button type="button" onClick={handleGenerateText} disabled={isGenerating} className="btn-primary" style={{ background: 'var(--gradient-brand)', alignSelf: 'flex-start' }}>
                        {isGenerating ? 'Generating...' : '📋 Generate from Text'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
              <button type="submit" className="btn-outline mt-2">Publish Blank Test (Add manually later)</button>
            </form>
          </div>

          <div className="glass-card">
            <h3 className="mb-4">Manage Published Tests</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
              {dbTests.filter(t => !t.title.startsWith('[ARCHIVED]')).length === 0 ? <p className="text-muted">No tests published yet.</p> : dbTests.filter(t => !t.title.startsWith('[ARCHIVED]')).map(t => (
                <div key={t.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{t.title}</h4>
                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Batch: {t.batches?.title} • {t.duration_mins}m • {t.total_questions}Q</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEditModal(t.id)} className="btn-outline" style={{ border: '1px solid #4CAF50', color: '#4CAF50', padding: '0.5rem 1rem' }}>Edit Questions</button>
                    <button onClick={() => handleDeleteTest(t.id, t.title)} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'tg_test' && (
        <div className="animate-tab-enter" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card mb-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="mb-4 text-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📲 Telegram Quiz Auto-Poster
            </h3>
            <p className="text-muted mb-4">Upload a PDF chapter or question paper. The AI will generate multiple-choice questions and post them as interactive Quiz Polls directly to your Telegram channel.</p>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>Telegram Bot Token</label>
                  <input type="text" placeholder="e.g. 8054498159:AAHdHB..." value={tgBotToken} onChange={(e) => setTgBotToken(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
                </div>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>Telegram Chat/Channel ID</label>
                  <input type="text" placeholder="e.g. 5986243633 or @mychannel" value={tgChatId} onChange={(e) => setTgChatId(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="text-light" style={{ fontSize: '0.9rem' }}>Upload PDF (Chapter / Question Paper)</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button type="button" onClick={() => tgHiddenFileInput.current.click()} className="btn-outline" style={{ flexShrink: 0 }}>Select PDF File</button>
                    <span style={{ color: 'var(--text-muted)' }}>{tgPdfFileName || 'No file selected'}</span>
                    <input type="file" accept="application/pdf" ref={tgHiddenFileInput} onChange={handleTgPdfUpload} style={{ display: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>Number of Questions to Post</label>
                  <input type="number" placeholder="e.g. 10" value={tgQuestionCount} onChange={(e) => setTgQuestionCount(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} required />
                </div>
                <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label className="text-light" style={{ fontSize: '0.9rem' }}>Quiz Language</label>
                  <select value={tgLanguage} onChange={(e) => setTgLanguage(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }}>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (Hinglish/Devanagari)</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>
                </div>
              </div>

              {tgGenerateProgress && (
                <div style={{ padding: '1rem', background: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196F3', borderRadius: '8px', color: '#2196F3', fontWeight: 'bold', textAlign: 'center' }}>
                  {tgGenerateProgress}
                </div>
              )}

              <button type="button" onClick={handleGenerateTgQuiz} disabled={isTgGenerating} className="btn-primary mt-2" style={{ background: 'var(--gradient-brand)', width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
                {isTgGenerating ? 'Processing...' : '🚀 Generate & Post to Telegram'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'test_history' && (
        <div className="animate-tab-enter">
          <div className="glass-card">
            <h3 className="mb-4">Test History (Deleted Tests)</h3>
            <p className="text-muted mb-4">Tests here are hidden from students and the leaderboard. You can restore them at any time.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '10px' }}>
              {dbTests.filter(t => t.title.startsWith('[ARCHIVED]')).length === 0 ? <p className="text-muted">No deleted tests found in history.</p> : dbTests.filter(t => t.title.startsWith('[ARCHIVED]')).map(t => (
                <div key={t.id} style={{ padding: '1rem', border: '1px dashed #ff4444', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 68, 68, 0.05)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-light)' }}>{t.title}</h4>
                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Batch: {t.batches?.title} • {t.duration_mins}m • {t.total_questions}Q</p>
                  </div>
                  <button onClick={() => handleRestoreTest(t.id, t.title)} className="btn-primary" style={{ background: '#4CAF50' }}>Re-Test (Restore)</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="animate-tab-enter">
          <div className="glass-card">
            <h3 className="mb-4">Pending Student Approvals</h3>
            <p className="text-muted mb-4">These students have registered but cannot log in until you approve them. You should receive a WhatsApp message from them.</p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Username</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>WhatsApp</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Class</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbStudents.filter(s => s.username?.startsWith('[PENDING] ')).length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No pending approvals.</td></tr>
                  ) : dbStudents.filter(s => s.username?.startsWith('[PENDING] ')).map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem' }}>{s.name}</td>
                      <td style={{ padding: '1rem', color: '#ff4444' }}>{s.username}</td>
                      <td style={{ padding: '1rem' }}>{s.whatsapp_number || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{s.class_name}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleApproveStudent(s.id, s.username)} className="btn-primary" style={{ background: '#4CAF50', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            Approve
                          </button>
                          <button onClick={() => handleDeleteStudent(s.id)} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                            Reject (Delete)
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="animate-tab-enter">
          <div className="glass-card">
            <h3 className="mb-4">Registered Students ({dbStudents.filter(s => !s.username?.startsWith('[PENDING] ')).length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Username</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>WhatsApp</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Class</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>DOB</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Joined Date</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbStudents.filter(s => !s.username?.startsWith('[PENDING] ')).length === 0 ? (
                    <tr><td colSpan="7" style={{ padding: '1rem', textAlign: 'center' }}>No students found.</td></tr>
                  ) : dbStudents.filter(s => !s.username?.startsWith('[PENDING] ')).map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{student.name || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{student.username || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{student.whatsapp_number || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{student.class_name || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{student.dob || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{new Date(student.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => { switchTab('admin_chats'); setActiveChatStudentId(student.id); document.body.style.overflow = 'hidden'; }}
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem' }}
                        >
                          💬 Chat
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="btn-outline" 
                          style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          title="Delete Student"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>

                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'live' && (
        <div className="animate-tab-enter grid-cols-2" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card">
            <h3 className="mb-4">Schedule Live Class</h3>
            <form onSubmit={handleCreateLiveClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select value={liveBatch} onChange={(e) => setLiveBatch(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required>
                <option value="">Select Batch...</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <input type="text" placeholder="Class Title (e.g. Science Chapter 1 Doubt Class)" value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
              <input type="url" placeholder="Meeting URL (Zoom / YouTube Live / GMeet)" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label className="text-muted" style={{ fontSize: '0.9rem' }}>Scheduled Date & Time</label>
                <input type="datetime-local" value={liveTime} onChange={(e) => setLiveTime(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
              </div>
              <button type="submit" className="btn-primary mt-2">Schedule Class</button>
            </form>
          </div>
          
          <div className="glass-card">
            <h3 className="mb-4">Scheduled Classes</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
              {dbLiveClasses.length === 0 ? <p className="text-muted">No live classes scheduled.</p> : dbLiveClasses.map(lc => (
                <div key={lc.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{lc.title}</h4>
                    <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0 0 0.25rem 0' }}>Batch: {lc.batches?.title}</p>
                    <p style={{ margin: 0, color: 'var(--primary-color)', fontSize: '0.85rem' }}>{new Date(lc.scheduled_time).toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleDeleteLiveClass(lc.id)} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem' }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div className="animate-tab-enter grid-cols-2" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card">
            <h3 className="mb-4">Post New Announcement</h3>
            <form onSubmit={handleCreateAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" placeholder="Title (e.g. Server Maintenance)" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
              <textarea placeholder="Announcement Content" value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white', minHeight: '150px' }} required></textarea>
              <button type="submit" className="btn-primary mt-2" style={{ alignSelf: 'flex-start' }}>Post to All Students</button>
            </form>
          </div>
          
          <div className="glass-card">
            <h3 className="mb-4">Recent Announcements</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '500px', overflowY: 'auto' }}>
              {dbAnnouncements.length === 0 ? <p className="text-muted">No announcements posted yet.</p> : dbAnnouncements.map(ann => (
                <div key={ann.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>{ann.title}</h4>
                    <p className="text-muted" style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0', whiteSpace: 'pre-wrap' }}>{ann.content}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(ann.created_at).toLocaleString()}</span>
                  </div>
                  <button onClick={() => handleDeleteAnnouncement(ann.id)} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="animate-tab-enter">
          <div className="glass-card">
            <h3 className="mb-4">Student Feedback & Reports</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {dbFeedback.length === 0 ? <p className="text-muted">No feedback received yet.</p> : dbFeedback.map(fb => (
                <div key={fb.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', borderTop: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, color: 'var(--text-light)' }}>{fb.student_name}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: 'white', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{fb.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'admin_chats' && (
        <div className="animate-tab-enter" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <h3 className="mb-4">Student Messages</h3>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Array.from(new Set(adminChats.map(m => m.student_id))).map(studentId => {
                const latestMsg = adminChats.filter(m => m.student_id === studentId).slice(-1)[0];
                const unreadCount = adminChats.filter(m => m.student_id === studentId && m.sender === 'student' && !m.is_read).length;
                if (!latestMsg) return null;
                const p = latestMsg.profiles;
                return (
                  <div 
                    key={studentId} 
                    onClick={() => { setActiveChatStudentId(studentId); document.body.style.overflow = 'hidden'; }}
                    style={{ 
                      padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer',
                      background: 'rgba(255,255,255,0.02)',
                      display: 'flex', gap: '1rem', alignItems: 'center'
                    }}
                  >
                    <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                      <img src={p?.photo_url || `https://ui-avatars.com/api/?name=${p?.name || 'Student'}&background=random`} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ margin: '0 0 0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'white' }}>
                        {p?.name || 'Student'} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{p?.username}</span>
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: unreadCount > 0 ? 'white' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {latestMsg.sender === 'admin' ? 'You: ' : ''}{latestMsg.message}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <div style={{ background: '#ff4444', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {unreadCount}
                      </div>
                    )}
                  </div>
                );
              })}
              {adminChats.length === 0 && <p className="text-muted text-center" style={{ marginTop: '2rem' }}>No messages yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Admin Chat Modal */}
      {activeChatStudentId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'var(--bg-dark)', zIndex: 10000, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Chat Header */}
          <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))', flexShrink: 0 }}>
            <button 
              onClick={() => { setActiveChatStudentId(null); document.body.style.overflow = ''; }}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '1.2rem', marginRight: '0.8rem', cursor: 'pointer', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ←
            </button>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
              <img 
                src={activeChatProfile?.photo_url || `https://ui-avatars.com/api/?name=${activeChatProfile?.name || 'Student'}&background=random`} 
                alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ marginLeft: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white', fontWeight: '700' }}>{activeChatProfile?.name || 'Student'}</h3>
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
            </div>
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', WebkitOverflowScrolling: 'touch' }}>
            {adminChats.filter(m => m.student_id === activeChatStudentId && !m.deleted_for_admin).map(msg => {
              const isAdmin = msg.sender === 'admin';
              const isDeleted = msg.is_deleted_for_everyone;
              return (
              <div key={msg.id} style={{ 
                alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                background: isAdmin ? 'var(--primary-color)' : 'rgba(255,255,255,0.08)',
                border: isAdmin ? 'none' : '1px solid var(--glass-border)',
                padding: '0.7rem 1rem', 
                borderRadius: isAdmin ? '18px 18px 0 18px' : '18px 18px 18px 0',
                maxWidth: '80%',
                wordBreak: 'break-word',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                position: 'relative',
                minWidth: '100px'
              }}>
                <div onClick={() => handleDeleteMessage(msg)} style={{ position: 'absolute', top: '-5px', right: isAdmin ? 'auto' : '-5px', left: isAdmin ? '-5px' : 'auto', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>🗑️</div>
                <div style={{ color: isAdmin ? 'white' : 'var(--text-light)', lineHeight: '1.5', fontSize: '0.95rem' }}>
                  {isDeleted ? (
                     <div style={{ fontStyle: 'italic', color: '#cbd5e1' }}>🚫 This message was deleted</div>
                  ) : renderChatMessage(msg.message)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', fontSize: '0.7rem', color: isAdmin ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)' }}>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isAdmin && (
                    <span style={{ color: msg.is_read ? '#60a5fa' : 'rgba(255,255,255,0.6)', fontStyle: msg.is_read ? 'normal' : 'italic', fontSize: '0.65rem' }}>
                      {msg.is_read ? 'Seen' : 'Delivered'}
                    </span>
                  )}
                </div>
              </div>
            )})}
            {adminChats.filter(m => m.student_id === activeChatStudentId).length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column' }}>
                <span style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</span>
                <p>Send a message to start the conversation.</p>
              </div>
            )}
            <div ref={adminChatEndRef} />
          </div>

          {/* Chat Input */}
          <div style={{ padding: '0.6rem 0.8rem', background: 'var(--bg-dark)', borderTop: '1px solid var(--glass-border)', flexShrink: 0 }}>
            <form onSubmit={handleAdminChatReply} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '50px', padding: '0.25rem', border: '1px solid var(--glass-border)' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0.5rem', color: 'var(--text-muted)' }}>
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
              <button type="submit" disabled={isAdminUploading || (!adminReplyMessage.trim())} style={{ background: (isAdminUploading || !adminReplyMessage.trim()) ? 'rgba(255,255,255,0.1)' : 'var(--gradient-brand)', color: 'white', border: 'none', width: '38px', height: '38px', borderRadius: '50%', cursor: (isAdminUploading || !adminReplyMessage.trim()) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '0.2rem', flexShrink: 0, transition: 'all 0.2s' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Questions Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>Edit Test Questions</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="btn-outline" style={{ border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {testQuestions.length === 0 ? (
                <p className="text-muted">Loading questions or no questions found...</p>
              ) : (
                testQuestions.map((q, idx) => (
                  <div key={q.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)' }}>
                    <p style={{ margin: '0 0 1rem 0', fontWeight: 'bold' }}>Q{idx + 1}. {q.question_text}</p>
                    
                    {q.image_url && (
                      <div style={{ marginBottom: '1rem' }}>
                        <img src={q.image_url} alt="Question Diagram" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', objectFit: 'contain', background: 'white' }} />
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>{q.image_url ? "Replace Image:" : "Attach Image:"}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => handleUploadQuestionImage(q.id, e.target.files[0])} 
                          disabled={isUploadingImage}
                          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', width: '100%' }} 
                        />
                      </label>
                      {isUploadingImage && <span className="text-accent" style={{ fontSize: '0.85rem' }}>Uploading...</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

