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

  // Telegram Quiz State & Batch-wise Mapping
  const [tgBotToken, setTgBotToken] = useState('8054498159:AAHdHB1Z1P479qA5C2C2loMedY7hixGcKJY');
  const [tgChatId, setTgChatId] = useState('@rkedu3229011');
  const [batchTelegramMap, setBatchTelegramMap] = useState({});
  const [tgSelectedBatch, setTgSelectedBatch] = useState('');
  const [tgQuestionCount, setTgQuestionCount] = useState('10');
  const [tgLanguage, setTgLanguage] = useState('Hindi');
  const [tgPdfFile, setTgPdfFile] = useState(null);
  const [tgPdfFileName, setTgPdfFileName] = useState('');
  const [tgCsvFile, setTgCsvFile] = useState(null);
  const [tgCsvFileName, setTgCsvFileName] = useState('');
  const [isTgGenerating, setIsTgGenerating] = useState(false);
  const [tgGenerateProgress, setTgGenerateProgress] = useState('');
  const tgHiddenFileInput = useRef(null);
  const tgHiddenCsvInput = useRef(null);

  // Paste Text MCQ State
  const [pasteText, setPasteText] = useState('');
  const [pasteTestTitle, setPasteTestTitle] = useState('');
  const [pasteBatch, setPasteBatch] = useState('');
  const [pasteDuration, setPasteDuration] = useState('30');
  const [pasteCoachingName, setPasteCoachingName] = useState('RK Education');
  const [pasteCoachingSub, setPasteCoachingSub] = useState('NMMS & Competitive Exam Center');
  const [pasteMaxMarks, setPasteMaxMarks] = useState('');
  const [isPasteProcessing, setIsPasteProcessing] = useState(false);
  const [pasteProgress, setPasteProgress] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloadProgress, setPdfDownloadProgress] = useState('');
  const [pdfModalInfo, setPdfModalInfo] = useState(null);
  const [chromeOpenLink, setChromeOpenLink] = useState('');
  const [isOpeningChrome, setIsOpeningChrome] = useState(false);

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

  // Load saved Telegram channel configurations from localStorage
  useEffect(() => {
    try {
      const savedMap = localStorage.getItem('batch_telegram_map');
      if (savedMap) {
        setBatchTelegramMap(JSON.parse(savedMap));
      }
      const savedToken = localStorage.getItem('tg_bot_token');
      if (savedToken) setTgBotToken(savedToken);
      const savedChatId = localStorage.getItem('tg_chat_id');
      if (savedChatId) setTgChatId(savedChatId);
    } catch (e) {
      console.error("Error loading Telegram settings:", e);
    }
  }, []);

  const cleanTgChannelInput = (val) => {
    if (!val) return '';
    let str = val.trim();
    str = str.replace(/[./\s]+$/, '');
    str = str.replace(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\//i, '@');
    if (!str.startsWith('@') && !str.startsWith('-') && isNaN(Number(str)) && str.length > 0) {
      str = '@' + str;
    }
    return str;
  };

  const handleUpdateBatchTelegram = (batchId, channelId, botToken = tgBotToken) => {
    const cleanId = cleanTgChannelInput(channelId);
    const updated = {
      ...batchTelegramMap,
      [batchId]: {
        channelId: cleanId,
        botToken: (botToken || tgBotToken).trim()
      }
    };
    setBatchTelegramMap(updated);
    try {
      localStorage.setItem('batch_telegram_map', JSON.stringify(updated));
      if (channelId) localStorage.setItem('tg_chat_id', channelId.trim());
      if (botToken) localStorage.setItem('tg_bot_token', botToken.trim());
    } catch (e) {}
  };

  const handleSelectTgBatch = (batchId) => {
    setTgSelectedBatch(batchId);
    if (batchId && batchTelegramMap[batchId]) {
      if (batchTelegramMap[batchId].channelId) {
        setTgChatId(batchTelegramMap[batchId].channelId);
      }
      if (batchTelegramMap[batchId].botToken) {
        setTgBotToken(batchTelegramMap[batchId].botToken);
      }
    }
  };

  useEffect(() => {
    // Admin Route Protection
    if (!localStorage.getItem('adminInfo')) {
      router.push('/admin-login');
      return;
    }

    async function fetchBatches() {
      const { data, error } = await supabase.from('batches').select('*');
      if (data) {
        setBatches(data);
        
        // Auto-assign TGT PGT channel @rkedu3229011 and NMMS channel @azadkumar3229011
        try {
          const currentMap = JSON.parse(localStorage.getItem('batch_telegram_map') || '{}');
          let changed = false;
          data.forEach(b => {
            const titleUpper = (b.title || '').toUpperCase();
            if ((titleUpper.includes('TGT') || titleUpper.includes('PGT')) && !currentMap[b.id]) {
              currentMap[b.id] = { channelId: '@rkedu3229011', botToken: tgBotToken };
              changed = true;
            } else if (titleUpper.includes('NMMS') && !currentMap[b.id]) {
              currentMap[b.id] = { channelId: '@azadkumar3229011', botToken: tgBotToken };
              changed = true;
            }
          });
          if (changed) {
            setBatchTelegramMap(currentMap);
            localStorage.setItem('batch_telegram_map', JSON.stringify(currentMap));
          }
        } catch (e) {
          console.error(e);
        }
      }

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

  const handleTgCsvUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTgCsvFile(e.target.files[0]);
      setTgCsvFileName(e.target.files[0].name);
    }
  };

  const handleGenerateTgCsvQuiz = async () => {
    if (!tgBotToken || !tgChatId || !tgCsvFile) {
      alert("Please fill all fields and upload a CSV!");
      return;
    }
    
    setIsTgGenerating(true);
    setTgGenerateProgress("Reading CSV file...");
    
    Papa.parse(tgCsvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async function(results) {
        try {
          const rows = results.data;
          if (rows.length === 0) throw new Error("CSV is empty");
          
          let successCount = 0;
          for (let i = 0; i < rows.length; i++) {
             const r = rows[i];
             
             const optA = (r.option_a || r.A || r.a || r['Option A'] || r['option a'] || '').toString().trim();
             const optB = (r.option_b || r.B || r.b || r['Option B'] || r['option b'] || '').toString().trim();
             const optC = (r.option_c || r.C || r.c || r['Option C'] || r['option c'] || '').toString().trim();
             const optD = (r.option_d || r.D || r.d || r['Option D'] || r['option d'] || '').toString().trim();
             
             let correctRaw = (r.correct_answer || r.Answer || r.answer || r.Ans || r.ans || r.correct || r.Key || r.key || r.Correct || '').toString().trim();
             
             let correctIndex = 0;
             let correctLetter = 'A';
             
             const crUpper = correctRaw.toUpperCase();
             if (crUpper === 'A' || crUpper === '(A)' || crUpper === 'A)' || crUpper === 'OPTION A' || (optA && correctRaw === optA)) {
               correctIndex = 0; correctLetter = 'A';
             } else if (crUpper === 'B' || crUpper === '(B)' || crUpper === 'B)' || crUpper === 'OPTION B' || (optB && correctRaw === optB)) {
               correctIndex = 1; correctLetter = 'B';
             } else if (crUpper === 'C' || crUpper === '(C)' || crUpper === 'C)' || crUpper === 'OPTION C' || (optC && correctRaw === optC)) {
               correctIndex = 2; correctLetter = 'C';
             } else if (crUpper === 'D' || crUpper === '(D)' || crUpper === 'D)' || crUpper === 'OPTION D' || (optD && correctRaw === optD)) {
               correctIndex = 3; correctLetter = 'D';
             } else {
               if (optB && correctRaw.toLowerCase() === optB.toLowerCase()) { correctIndex = 1; correctLetter = 'B'; }
               else if (optC && correctRaw.toLowerCase() === optC.toLowerCase()) { correctIndex = 2; correctLetter = 'C'; }
               else if (optD && correctRaw.toLowerCase() === optD.toLowerCase()) { correctIndex = 3; correctLetter = 'D'; }
               else if (optA && correctRaw.toLowerCase() === optA.toLowerCase()) { correctIndex = 0; correctLetter = 'A'; }
               else { correctIndex = 0; correctLetter = 'A'; }
             }
             
             setTgGenerateProgress(`Posting CSV Q${i + 1} of ${rows.length} (Verified Answer: ${correctLetter})...`);
             
             // Send CLEAN options WITHOUT letter prefixes
             const q = {
               question_text: `Q${i + 1}. ${r.question_text || r.Question || r.Q || r.question || ''}`,
               option_a: optA || 'Option A',
               option_b: optB || 'Option B',
               option_c: optC || 'Option C',
               option_d: optD || 'Option D',
               correct_option_id: correctIndex, // 0-3 ONLY SOURCE OF TRUTH
               correct_letter: correctLetter,
               explanation: r.explanation || r.Explanation || ''
             };
             
             const tgRes = await fetch('/api/post-telegram-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ botToken: tgBotToken.trim(), chatId: tgChatId.trim(), question: q })
             });
             
             const tgData = await tgRes.json();
             
             if (tgData.error && tgData.error.includes('retry after')) {
               const retryMatch = tgData.error.match(/retry after (\d+)/);
               const waitSec = retryMatch ? parseInt(retryMatch[1]) + 2 : 35;
               setTgGenerateProgress(`⏳ Rate limit! Waiting ${waitSec}s... (${i + 1}/${rows.length})`);
               await new Promise(res => setTimeout(res, waitSec * 1000));
               const retryRes = await fetch('/api/post-telegram-quiz', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ botToken: tgBotToken.trim(), chatId: tgChatId.trim(), question: q })
               });
               const retryData = await retryRes.json();
               if (retryData.error) throw new Error("Telegram Retry Error: " + retryData.error);
             } else if (tgData.error) {
               throw new Error("Telegram Error: " + tgData.error);
             }
             
             successCount++;
             await new Promise(res => setTimeout(res, 3000));
          }
          
          alert(`✅ Success! Successfully posted ${successCount} questions from CSV to Telegram with verified answers.`);
          setTgCsvFile(null);
          setTgCsvFileName('');
          if (tgHiddenCsvInput.current) tgHiddenCsvInput.current.value = '';
        } catch (err) {
          alert("Error posting CSV to Telegram: " + err.message);
        }
        
        setIsTgGenerating(false);
        setTgGenerateProgress('');
      },
      error: function(err) {
        alert("Error parsing CSV: " + err.message);
        setIsTgGenerating(false);
        setTgGenerateProgress('');
      }
    });
  };

  // --- Universal Text MCQ Parser with Accurate Answer Key Matching ---
  const parseTextMCQ = (text) => {
    if (!text || !text.trim()) return [];
    
    // Normalize line endings
    const rawLines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const questions = [];
    const answerKey = {}; // { 1: 'B', 2: 'A', ... }
    
    let currentQ = null;
    let inAnswerKey = false;
    
    const matchOption = (str) => {
      const m = str.match(/^[\s(\[]*([A-Da-d])[\s)\]:.-]+(.+)/);
      if (m) {
        return { letter: m[1].toUpperCase(), text: m[2].trim() };
      }
      return null;
    };

    const matchInlineAnswer = (str) => {
      const m = str.match(/^(?:Answer|उत्तर|Ans|सही\s*उत्तर|उत्तरमाला|Correct\s*Answer|Key|Solution)[\s:=.-]+(.+)/i);
      if (m) {
        return m[1].trim();
      }
      return null;
    };

    const isAnswerKeyHeader = (str) => {
      return /^(?:उत्तरमाला|answer\s*key|उत्तर\s*कुंजी|answers|उत्तर\s*तालिका|उत्तर\s*सूची|key\s*sheet)/i.test(str.trim());
    };

    for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
      const rawLine = rawLines[lineIndex];
      const line = rawLine.trim();
      if (!line) continue;

      // 1. Detect Answer Key Section Header
      if (isAnswerKeyHeader(line)) {
        inAnswerKey = true;
        if (currentQ && currentQ.question_text && (currentQ.option_a || currentQ.option_b)) {
          questions.push(currentQ);
        }
        currentQ = null;
        continue;
      }

      // 2. Parse lines inside the Answer Key Section
      if (inAnswerKey) {
        const regex = /(?:Q|प्रश्न)?\s*(\d+)[\s.:=)\-_]+\(?([A-Da-d])\)?/gi;
        let match;
        let foundAny = false;
        while ((match = regex.exec(line)) !== null) {
          const qNum = parseInt(match[1], 10);
          const ansLetter = match[2].toUpperCase();
          answerKey[qNum] = ansLetter;
          foundAny = true;
        }
        if (foundAny) continue;
      }

      // 3. Detect Question Header
      const qMatch = line.match(/^(?:Q|Question|प्रश्न|प्र\.)?\s*(\d+)[\s.):\-]+(.+)/i);
      const isActuallyOption = /^\s*\(?[A-Da-d]\s*[.)\]:-]/.test(line);

      if (qMatch && !isActuallyOption && !inAnswerKey) {
        if (currentQ && currentQ.question_text && (currentQ.option_a || currentQ.option_b)) {
          questions.push(currentQ);
        }
        currentQ = {
          num: parseInt(qMatch[1], 10),
          question_text: qMatch[2].trim(),
          option_a: '',
          option_b: '',
          option_c: '',
          option_d: '',
          correct_letter: '',
          correct_option_index: -1,
          correct_answer: '',
          explanation: ''
        };
        continue;
      }

      if (!currentQ) continue;

      // 4. Check for Inline Answer
      const inlineAns = matchInlineAnswer(line);
      if (inlineAns) {
        const letterMatch = inlineAns.match(/^[\s(\[]*([A-Da-d])[\s)\]:.-]*/);
        if (letterMatch) {
          currentQ.correct_letter = letterMatch[1].toUpperCase();
        } else {
          currentQ.correct_answer = inlineAns;
        }
        continue;
      }

      // 5. Check if line contains Multiple Options on the same line
      const multiOptRegex = /[\s(\[]*([A-Da-d])[\s)\]:.-]+([^(\[]+)/g;
      const multiMatches = [...line.matchAll(multiOptRegex)];
      if (multiMatches.length >= 2) {
        for (const m of multiMatches) {
          const letter = m[1].toUpperCase();
          const optText = m[2].trim();
          if (letter === 'A') currentQ.option_a = optText;
          else if (letter === 'B') currentQ.option_b = optText;
          else if (letter === 'C') currentQ.option_c = optText;
          else if (letter === 'D') currentQ.option_d = optText;
        }
        continue;
      }

      // 6. Check for Single Option on this line
      const opt = matchOption(line);
      if (opt) {
        if (opt.letter === 'A') currentQ.option_a = opt.text;
        else if (opt.letter === 'B') currentQ.option_b = opt.text;
        else if (opt.letter === 'C') currentQ.option_c = opt.text;
        else if (opt.letter === 'D') currentQ.option_d = opt.text;
        continue;
      }

      // 7. If options haven't started yet, append line to question_text
      if (!currentQ.option_a && !currentQ.option_b) {
        currentQ.question_text += ' ' + line;
      }
    }

    // Save the very last question if exists
    if (currentQ && currentQ.question_text && (currentQ.option_a || currentQ.option_b)) {
      questions.push(currentQ);
    }

    // 8. FINAL PASS: Resolve and Verify Correct Answer for each question!
    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const qNum = q.num || (idx + 1);

      let resolvedLetter = q.correct_letter || answerKey[qNum] || answerKey[idx + 1] || '';

      if (!resolvedLetter && q.correct_answer) {
        const cleanA = (q.option_a || '').trim().toLowerCase();
        const cleanB = (q.option_b || '').trim().toLowerCase();
        const cleanC = (q.option_c || '').trim().toLowerCase();
        const cleanD = (q.option_d || '').trim().toLowerCase();
        const cleanAns = q.correct_answer.trim().toLowerCase();

        if (cleanAns === cleanA || (cleanAns.length > 2 && cleanA.includes(cleanAns))) resolvedLetter = 'A';
        else if (cleanAns === cleanB || (cleanAns.length > 2 && cleanB.includes(cleanAns))) resolvedLetter = 'B';
        else if (cleanAns === cleanC || (cleanAns.length > 2 && cleanC.includes(cleanAns))) resolvedLetter = 'C';
        else if (cleanAns === cleanD || (cleanAns.length > 2 && cleanD.includes(cleanAns))) resolvedLetter = 'D';
      }

      if (!resolvedLetter) {
        resolvedLetter = 'A';
        q.is_unverified = true;
      } else {
        q.is_unverified = false;
      }

      q.correct_letter = resolvedLetter.toUpperCase();
      if (q.correct_letter === 'A') {
        q.correct_option_index = 0;
        q.correct_answer = q.option_a;
      } else if (q.correct_letter === 'B') {
        q.correct_option_index = 1;
        q.correct_answer = q.option_b;
      } else if (q.correct_letter === 'C') {
        q.correct_option_index = 2;
        q.correct_answer = q.option_c;
      } else if (q.correct_letter === 'D') {
        q.correct_option_index = 3;
        q.correct_answer = q.option_d;
      } else {
        q.correct_option_index = 0;
        q.correct_answer = q.option_a;
      }
    }

    return questions;
  };

  // --- Paste Text: Post to App (Live Test) ---
  const handlePasteToApp = async () => {
    if (!pasteText.trim()) { alert("Pehle text paste karein!"); return; }
    if (!pasteTestTitle.trim()) { alert("Test ka title daalein!"); return; }
    if (!pasteBatch.trim()) { alert("Batch select karein!"); return; }
    
    setIsPasteProcessing(true);
    setPasteProgress("Parsing questions & verifying answer key...");
    
    try {
      const parsed = parseTextMCQ(pasteText);
      if (parsed.length === 0) throw new Error("Koi question parse nahi ho saka. Sahi format me paste karein.");
      
      setPasteProgress(`${parsed.length} questions verified. Creating test on App...`);
      
      // Create test in Supabase
      const { data: testData, error: testError } = await supabase
        .from('tests')
        .insert([{
          title: pasteTestTitle.trim(),
          batch_id: pasteBatch.trim(),
          duration_mins: parseInt(pasteDuration) || 30,
          total_questions: parsed.length,
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }])
        .select();
      
      if (testError) throw new Error("Test create error: " + testError.message);
      const testId = testData[0].id;
      
      // Insert questions with 100% verified correct_answer text
      const questionsToInsert = parsed.map((q) => {
        let exactCorrectText = q.option_a;
        if (q.correct_option_index === 1 || q.correct_letter === 'B') exactCorrectText = q.option_b;
        else if (q.correct_option_index === 2 || q.correct_letter === 'C') exactCorrectText = q.option_c;
        else if (q.correct_option_index === 3 || q.correct_letter === 'D') exactCorrectText = q.option_d;
        else exactCorrectText = q.option_a;

        return {
          test_id: testId,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_answer: exactCorrectText
        };
      });
      
      const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
      if (qError) throw new Error("Questions insert error: " + qError.message);
      
      setPasteProgress('');
      alert(`✅ Success! ${parsed.length} questions ke sath "${pasteTestTitle}" test App pe 100% verified answers ke sath LIVE ho gaya!`);
      setPasteText('');
      setPasteTestTitle('');
      fetchTests();
    } catch (err) {
      alert("Error: " + err.message);
    }
    
    setIsPasteProcessing(false);
    setPasteProgress('');
  };

  // --- Paste Text: Post to Telegram ---
  const handlePasteToTelegram = async () => {
    if (!pasteText.trim()) { alert("Pehle text paste karein!"); return; }
    if (!tgBotToken || !tgChatId) { alert("Telegram Bot Token aur Channel ID required hai!"); return; }
    
    setIsPasteProcessing(true);
    setPasteProgress("Parsing questions & verifying answer key...");
    
    try {
      const parsed = parseTextMCQ(pasteText);
      if (parsed.length === 0) throw new Error("Koi question parse nahi ho saka.");
      
      let successCount = 0;
      
      for (let i = 0; i < parsed.length; i++) {
        const pq = parsed[i];
        setPasteProgress(`Posting Q${i + 1} of ${parsed.length} to Telegram (Verified Answer: ${pq.correct_letter})...`);
        
        // Send CLEAN options WITHOUT letter prefixes — the API uses correct_option_id (0-3) directly
        const q = {
          question_text: `Q${i + 1}. ${pq.question_text}`,
          option_a: pq.option_a || 'Option A',
          option_b: pq.option_b || 'Option B',
          option_c: pq.option_c || 'Option C',
          option_d: pq.option_d || 'Option D',
          correct_option_id: pq.correct_option_index, // 0, 1, 2, 3 — THIS IS THE ONLY SOURCE OF TRUTH
          correct_letter: pq.correct_letter, // 'A', 'B', 'C', 'D'
          explanation: pq.explanation || ''
        };
        
        const tgRes = await fetch('/api/post-telegram-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken: tgBotToken.trim(), chatId: tgChatId.trim(), question: q })
        });
        const tgData = await tgRes.json();
        
        if (tgData.error && tgData.error.includes('retry after')) {
          const retryMatch = tgData.error.match(/retry after (\d+)/);
          const waitSec = retryMatch ? parseInt(retryMatch[1]) + 2 : 35;
          setPasteProgress(`⏳ Rate limit! Waiting ${waitSec}s... (${i + 1}/${parsed.length})`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          const retryRes = await fetch('/api/post-telegram-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ botToken: tgBotToken.trim(), chatId: tgChatId.trim(), question: q })
          });
          const retryData = await retryRes.json();
          if (retryData.error) throw new Error("Telegram Retry Error: " + retryData.error);
        } else if (tgData.error) {
          throw new Error("Telegram Error: " + tgData.error);
        }
        
        successCount++;
        await new Promise(r => setTimeout(r, 3000));
      }
      
      alert(`✅ ${successCount} questions Telegram channel pe 100% verified answers ke sath post ho gaye!`);
      setPasteText('');
    } catch (err) {
      alert("Error: " + err.message);
    }
    
    setIsPasteProcessing(false);
    setPasteProgress('');
  };

  // --- Open Dedicated 2-Column Exam Paper in Chrome / External Browser ---
  const handleOpenPrintPaper = async () => {
    if (!pasteText.trim()) { alert("Pehle MCQ text paste karein!"); return; }
    const parsed = parseTextMCQ(pasteText);
    if (parsed.length === 0) { alert("Koi question parse nahi ho saka. Sahi format me text paste karein."); return; }

    setIsOpeningChrome(true);
    setChromeOpenLink('');

    const coaching = pasteCoachingName.trim() || "RK EDUCATION";
    const subHeader = pasteCoachingSub.trim() || "Competitive Exam & Coaching Center";
    const title = pasteTestTitle.trim() || "MODEL QUESTION PAPER";
    const duration = pasteDuration ? `${pasteDuration} Mins` : "45 Mins";
    const marks = pasteMaxMarks.trim() || `${parsed.length} Marks`;
    const batchName = pasteBatch ? (batches.find(b => b.id === pasteBatch)?.title || pasteBatch) : 'All Batches';
    const dateStr = new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const paperData = {
      coaching,
      subHeader,
      title,
      batchName,
      duration,
      marks,
      dateStr,
      questions: parsed
    };

    try {
      localStorage.setItem('print_paper_data', JSON.stringify(paperData));
    } catch (e) {
      console.error(e);
    }

    try {
      // 1. Generate server link
      const res = await fetch('/api/paper-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperData })
      });
      const data = await res.json();

      if (data.token || data.id) {
        const fullUrl = `${window.location.origin}/api/view-paper?d=${data.token || data.id}`;
        setChromeOpenLink(fullUrl);

        // Try opening in external browser / Chrome tab
        const win = window.open(fullUrl, '_blank');
        if (!win) {
          // If popup is blocked in WebView, navigate
          window.location.href = fullUrl;
        }
      } else {
        window.location.href = '/print-paper';
      }
    } catch (err) {
      console.error("Link error:", err);
      window.location.href = '/print-paper';
    } finally {
      setIsOpeningChrome(false);
    }
  };

  // --- Download Standalone Offline HTML Question Paper ---
  const handleDownloadStandaloneHtml = () => {
    if (!pasteText.trim()) { alert("Pehle MCQ text paste karein!"); return; }
    const parsed = parseTextMCQ(pasteText);
    if (parsed.length === 0) { alert("Koi question parse nahi ho saka."); return; }

    const coaching = pasteCoachingName.trim() || "RK EDUCATION";
    const subHeader = pasteCoachingSub.trim() || "Competitive Exam & Coaching Center";
    const title = pasteTestTitle.trim() || "MODEL QUESTION PAPER";
    const duration = pasteDuration ? `${pasteDuration} Mins` : "45 Mins";
    const marks = pasteMaxMarks.trim() || `${parsed.length} Marks`;
    const batchName = pasteBatch ? (batches.find(b => b.id === pasteBatch)?.title || pasteBatch) : 'All Batches';
    const dateStr = new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const cleanFileName = (title + '_' + coaching).replace(/[^a-zA-Z0-9_\u0900-\u097F]/g, '_').substring(0, 30) + '_ExamPaper.html';

    const fullHtml = `<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${coaching}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm 10mm 8mm 10mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nirmala UI', 'Mangal', 'Segoe UI', Arial, sans-serif; color: #000; background: #fff; line-height: 1.35; font-size: 12px; }
    .paper-container { width: 100%; max-width: 800px; margin: 0 auto; padding: 12px; }
    .header-box { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 8px; }
    .coaching-title { font-size: 22px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 1px; }
    .coaching-sub { font-size: 11px; font-weight: 600; color: #333; margin-bottom: 4px; }
    .test-title-badge { font-size: 13.5px; font-weight: 700; background: #f0f0f0; display: inline-block; padding: 2px 14px; border-radius: 4px; border: 1px solid #aaa; margin-bottom: 5px; }
    .meta-table { width: 100%; border-collapse: collapse; font-size: 11px; font-weight: 600; margin-top: 2px; }
    .meta-table td { padding: 1px 4px; }
    .instructions-bar { font-size: 10.5px; font-style: italic; border-bottom: 1px dashed #555; padding-bottom: 3px; margin-bottom: 8px; display: flex; justify-content: space-between; }
    .columns-wrapper { column-count: 2; column-gap: 22px; column-rule: 1px solid #222; text-align: left; }
    .question-item { break-inside: avoid !important; page-break-inside: avoid !important; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 0.5px dotted #bbb; }
    .q-text { font-weight: 700; font-size: 12px; margin-bottom: 3px; }
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 6px; font-size: 11px; }
    .opt-label { font-weight: 700; margin-right: 3px; }
    .footer-bar { margin-top: 10px; text-align: center; font-size: 9px; color: #555; border-top: 1px solid #aaa; padding-top: 3px; }
    .no-print { position: sticky; top: 0; background: #1e1e1e; color: #fff; padding: 10px; display: flex; justify-content: center; gap: 10px; z-index: 1000; margin-bottom: 15px; border-radius: 8px; }
    .no-print button { background: #4caf50; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">🖨️ Save as PDF / Print</button>
  </div>
  <div class="paper-container">
    <div class="header-box">
      <div class="coaching-title">${coaching}</div>
      <div class="coaching-sub">${subHeader}</div>
      <div class="test-title-badge">${title}</div>
      <table class="meta-table">
        <tr>
          <td style="text-align: left;"><b>Batch:</b> ${batchName}</td>
          <td style="text-align: center;"><b>Time:</b> ${duration}</td>
          <td style="text-align: right;"><b>Max Marks:</b> ${marks}</td>
        </tr>
        <tr>
          <td style="text-align: left;"><b>Date:</b> ${dateStr}</td>
          <td style="text-align: center;"><b>Total Qs:</b> ${parsed.length}</td>
          <td style="text-align: right;"><b>Roll No:</b> ____________</td>
        </tr>
      </table>
    </div>
    <div class="instructions-bar">
      <span><b>निर्देश:</b> सभी प्रश्न अनिवार्य हैं। सही विकल्प का चयन करें।</span>
      <span><b>Negative Marking:</b> No</span>
    </div>
    <div class="columns-wrapper">
      ${parsed.map((q, idx) => `
        <div class="question-item">
          <div class="q-text">Q${idx + 1}. ${q.question_text}</div>
          <div class="options-grid">
            <div><span class="opt-label">(A)</span> ${q.option_a || '-'}</div>
            <div><span class="opt-label">(B)</span> ${q.option_b || '-'}</div>
            <div><span class="opt-label">(C)</span> ${q.option_c || '-'}</div>
            <div><span class="opt-label">(D)</span> ${q.option_d || '-'}</div>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="footer-bar">*** Best of Luck • ${coaching} ***</div>
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = cleanFileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 1000);
  };

  const handleGenerateTgQuiz = async () => {
    if (!tgBotToken || !tgChatId || !tgPdfFile) {
      alert("Please fill all fields and upload a PDF!");
      return;
    }
    
    setIsTgGenerating(true);
    setTgGenerateProgress("Step 1/2: Extracting Text from PDF...");
    
    try {
      // Client-side PDF parsing using pdfjs-dist
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      
      const arrayBuffer = await tgPdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let extractedText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += pageText + '\n';
      }
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error("PDF se koi text extract nahi ho saka.");
      }
      
      // Use parseTextMCQ to accurately parse questions AND answer keys from PDF!
      setTgGenerateProgress("Step 1/2: Parsing questions and verifying answers from PDF...");
      const parsedQuestions = parseTextMCQ(extractedText);
      
      if (parsedQuestions.length === 0) {
        throw new Error("PDF se koi question parse nahi ho saka. PDF me questions 1. 2. aur A) B) format me hone chahiye.");
      }
      
      const total = parseInt(tgQuestionCount, 10) || parsedQuestions.length;
      const questionsToPost = parsedQuestions.slice(0, total);
      let successCount = 0;
      
      for (let i = 0; i < questionsToPost.length; i++) {
        const pq = questionsToPost[i];
        setTgGenerateProgress(`Step 2/2: Posting Question ${i + 1} of ${questionsToPost.length} to Telegram (Verified Answer: ${pq.correct_letter})...`);
        
        // Send CLEAN options WITHOUT letter prefixes — the API uses correct_option_id (0-3) directly
        const q = {
          question_text: `Q${i + 1}. ${pq.question_text}`,
          option_a: pq.option_a || 'Option A',
          option_b: pq.option_b || 'Option B',
          option_c: pq.option_c || 'Option C',
          option_d: pq.option_d || 'Option D',
          correct_option_id: pq.correct_option_index, // 0, 1, 2, 3 — ONLY SOURCE OF TRUTH
          correct_letter: pq.correct_letter, // 'A', 'B', 'C', 'D'
          explanation: pq.explanation || ''
        };
        
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
        
        if (tgData.error && tgData.error.includes('retry after')) {
          const retryMatch = tgData.error.match(/retry after (\d+)/);
          const waitSec = retryMatch ? parseInt(retryMatch[1]) + 2 : 35;
          setTgGenerateProgress(`⏳ Telegram rate limit! Waiting ${waitSec}s before continuing... (${i + 1}/${questionsToPost.length})`);
          await new Promise(r => setTimeout(r, waitSec * 1000));
          const retryRes = await fetch('/api/post-telegram-quiz', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ botToken: tgBotToken.trim(), chatId: tgChatId.trim(), question: q })
          });
          const retryData = await retryRes.json();
          if (retryData.error) throw new Error("Telegram Retry Error: " + retryData.error);
        } else if (tgData.error) {
          throw new Error("Telegram Error: " + tgData.error);
        }
        
        successCount++;
        await new Promise(r => setTimeout(r, 3000));
      }
      
      alert(`✅ Success! ${successCount} questions posted to Telegram from PDF with verified answers.`);
      setTgPdfFile(null);
      setTgPdfFileName('');
      if (tgHiddenFileInput.current) tgHiddenFileInput.current.value = '';
    } catch (err) {
      alert("Error: " + err.message);
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
        <button className={activeTab === 'paste_mcq' ? 'btn-primary' : 'btn-outline'} onClick={() => switchTab('paste_mcq')} style={{ padding: '0.5rem 1rem' }}>📋 Paste MCQ</button>
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
                      <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0 0 0.35rem 0' }}>
                        {b.is_free ? 'Free' : `₹${b.price}`}
                      </p>
                      <div style={{ fontSize: '0.8rem', color: batchTelegramMap[b.id]?.channelId ? '#64b5f6' : '#9e9e9e', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span>📲 TG:</span> <b>{batchTelegramMap[b.id]?.channelId || 'Not connected'}</b>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button 
                      type="button"
                      onClick={() => {
                        const currentVal = batchTelegramMap[b.id]?.channelId || '';
                        const newChan = window.prompt(`Enter Telegram Channel ID or @Username for "${b.title}":`, currentVal);
                        if (newChan !== null) {
                          handleUpdateBatchTelegram(b.id, newChan.trim());
                        }
                      }} 
                      className="btn-outline" 
                      style={{ border: '1px solid #2196F3', color: '#2196F3', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
                    >
                      📲 Set Telegram
                    </button>
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

      {activeTab === 'paste_mcq' && (
        <div className="animate-tab-enter" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card mb-4" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h3 className="mb-4 text-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 Paste MCQ Text — Instant Quiz
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              MCQ questions ko neeche paste karein (Answer Key ke sath). Phir choose karein — <b>App pe Live</b> karna hai ya <b>Telegram Channel</b> pe post karna hai.
            </p>

            <textarea 
              value={pasteText} 
              onChange={(e) => setPasteText(e.target.value)} 
              placeholder={`Example format:\n\n1. भारत की राजधानी क्या है?\n(A) मुंबई\n(B) दिल्ली\n(C) कोलकाता\n(D) चेन्नई\n\n2. सबसे बड़ा ग्रह?\n(A) पृथ्वी\n(B) मंगल\n(C) शनि\n(D) बृहस्पति\n\nउत्तरमाला (Answer Key)\n1. B\n2. D`}
              style={{ 
                width: '100%', minHeight: '300px', padding: '1rem', borderRadius: '8px', 
                border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', 
                color: 'white', fontSize: '0.95rem', fontFamily: 'monospace', resize: 'vertical'
              }} 
            />

            {(() => {
              const parsedPreview = pasteText.trim() ? parseTextMCQ(pasteText) : [];
              const verifiedCount = parsedPreview.filter(q => !q.is_unverified).length;
              
              return (
                <>
                  <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '8px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <p style={{ margin: 0, fontSize: '0.95rem', color: '#4caf50', fontWeight: 'bold' }}>
                        ✅ Questions Found: {parsedPreview.length} | Sahi Uttar Verified: {verifiedCount}/{parsedPreview.length}
                      </p>
                      {parsedPreview.length > 0 && (
                        <span style={{ fontSize: '0.85rem', color: verifiedCount === parsedPreview.length ? '#4caf50' : '#ff9800' }}>
                          {verifiedCount === parsedPreview.length ? '✨ All Answers 100% Matched with Answer Key' : '⚠️ Kuch answers answer key me nahi mile (Option A set hua)'}
                        </span>
                      )}
                    </div>
                  </div>

                  {parsedPreview.length > 0 && (
                    <div style={{ marginTop: '1rem', maxHeight: '250px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                        🔍 Question & Answer Verification Preview:
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {parsedPreview.map((pq, pidx) => (
                          <div key={pidx} style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: `3px solid ${pq.is_unverified ? '#ff9800' : '#4caf50'}`, fontSize: '0.85rem' }}>
                            <div style={{ fontWeight: 'bold', color: 'white', marginBottom: '0.25rem' }}>
                              Q{pidx + 1}. {pq.question_text}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                              <span><b>A:</b> {pq.option_a || '-'}</span>
                              <span><b>B:</b> {pq.option_b || '-'}</span>
                              <span><b>C:</b> {pq.option_c || '-'}</span>
                              <span><b>D:</b> {pq.option_d || '-'}</span>
                            </div>
                            <div style={{ color: pq.is_unverified ? '#ff9800' : '#4caf50', fontWeight: 'bold', fontSize: '0.82rem' }}>
                              {pq.is_unverified ? '⚠️ Unverified (Default: A)' : `🟢 Verified Sahi Uttar: Option ${pq.correct_letter} (${pq.correct_answer || 'Option ' + pq.correct_letter})`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* --- Option 1: App pe Live --- */}
            <h4 className="mt-4 text-accent" style={{ color: '#4caf50' }}>🟢 Option 1: App pe Live Test Banao</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(76, 175, 80, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 2, minWidth: '200px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Test Title</label>
                  <input type="text" placeholder="e.g. Class 8 Science Chapter 1" value={pasteTestTitle} onChange={(e) => setPasteTestTitle(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '0.25rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Batch</label>
                  <select value={pasteBatch} onChange={(e) => setPasteBatch(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '0.25rem' }}>
                    <option value="">Select Batch</option>
                    {batches.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: '100px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Duration (min)</label>
                  <input type="number" value={pasteDuration} onChange={(e) => setPasteDuration(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '0.25rem' }} />
                </div>
              </div>
              <button type="button" onClick={handlePasteToApp} disabled={isPasteProcessing} className="btn-primary" 
                style={{ background: '#4caf50', width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
                {isPasteProcessing ? 'Processing...' : '🟢 App pe LIVE karo'}
              </button>
            </div>

            {/* --- Option 2: Telegram pe Post --- */}
            <h4 className="mt-4 text-accent" style={{ color: '#2196F3', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔵 Option 2: Telegram Channel pe Post karo
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(33, 150, 243, 0.08)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
              
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#90caf9', fontWeight: 'bold' }}>Target Batch / Course Select Karein</label>
                  <select 
                    value={tgSelectedBatch || pasteBatch} 
                    onChange={(e) => {
                      const bId = e.target.value;
                      handleSelectTgBatch(bId);
                      if (!pasteBatch) setPasteBatch(bId);
                    }}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #2196f3', background: 'rgba(0,0,0,0.3)', color: 'white', marginTop: '0.25rem' }}
                  >
                    <option value="">-- All Batches / Custom Channel --</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title} {batchTelegramMap[b.id]?.channelId ? `(${batchTelegramMap[b.id].channelId})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1, minWidth: '220px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#90caf9', fontWeight: 'bold' }}>Telegram Channel Username / ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. @tgt_pgt_batch or @azadkumar3229011" 
                    value={tgChatId} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setTgChatId(val);
                      const currentBId = tgSelectedBatch || pasteBatch;
                      if (currentBId) {
                        handleUpdateBatchTelegram(currentBId, val);
                      } else {
                        try { localStorage.setItem('tg_chat_id', val); } catch(e){}
                      }
                    }} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white', marginTop: '0.25rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  📡 <b>Posting to Channel:</b> <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{tgChatId || 'Not Set (Enter Channel above)'}</span>
                  {(tgSelectedBatch || pasteBatch) && batches.find(b => b.id === (tgSelectedBatch || pasteBatch)) && (
                    <span style={{ marginLeft: '0.5rem', color: '#64b5f6' }}>
                      • Batch: <b>{batches.find(b => b.id === (tgSelectedBatch || pasteBatch))?.title}</b>
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#81c784' }}>
                  💾 Channel ID is saved automatically
                </span>
              </div>

              <button type="button" onClick={handlePasteToTelegram} disabled={isPasteProcessing} className="btn-primary" 
                style={{ background: '#2196F3', width: '100%', fontSize: '1.1rem', padding: '1rem', fontWeight: 'bold' }}>
                {isPasteProcessing ? '⏳ Posting to Telegram...' : `🔵 ${((tgSelectedBatch || pasteBatch) && batches.find(b => b.id === (tgSelectedBatch || pasteBatch))?.title) || 'Selected'} Telegram Channel pe Post karo`}
              </button>
            </div>

            {/* --- Option 3: Download Question Paper PDF (2-Column Exam Format) --- */}
            <h4 className="mt-4 text-accent" style={{ color: '#ff9800' }}>📄 Option 3: Download Question Paper PDF (2-Column Exam Format)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'rgba(255, 152, 0, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255, 152, 0, 0.3)' }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>
                Apne coaching name ke sath <b>2-Column Side-by-Side Exam Question Paper</b> download karein (bich me divider line ke sath, bina answer key ke).
              </p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Coaching Name</label>
                  <input type="text" placeholder="e.g. RK Education" value={pasteCoachingName} onChange={(e) => setPasteCoachingName(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '0.25rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Tagline / Subtitle</label>
                  <input type="text" placeholder="e.g. NMMS & Competitive Exam Center" value={pasteCoachingSub} onChange={(e) => setPasteCoachingSub(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '0.25rem' }} />
                </div>
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>Total Marks (Optional)</label>
                  <input type="text" placeholder="e.g. 20" value={pasteMaxMarks} onChange={(e) => setPasteMaxMarks(e.target.value)} 
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', marginTop: '0.25rem' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                <button type="button" onClick={handleOpenPrintPaper} disabled={isOpeningChrome} className="btn-primary" 
                  style={{ flex: 2, minWidth: '220px', background: '#ff9800', fontSize: '1.05rem', padding: '1rem', color: '#111', fontWeight: 'bold' }}>
                  {isOpeningChrome ? '⏳ Opening in Chrome...' : '🌐 📱 Chrome me Paper Open & Download karo'}
                </button>
                <button type="button" onClick={handleDownloadStandaloneHtml} className="btn-outline" 
                  style={{ flex: 1, minWidth: '160px', border: '1px solid #ff9800', color: '#ff9800', fontSize: '0.95rem', padding: '1rem' }}>
                  ⬇️ 📱 Download Offline Paper
                </button>
              </div>

              {chromeOpenLink && (
                <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(76, 175, 80, 0.15)', border: '1px solid #4caf50', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#4caf50', fontWeight: 'bold', fontSize: '0.95rem' }}>
                      ✅ Paper Link Ready!
                    </p>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.85rem' }}>
                      Agar Chrome auto-open nahi hua toh niche button dabayein:
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <a 
                      href={chromeOpenLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ background: '#4caf50', color: '#fff', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', fontSize: '0.9rem' }}
                    >
                      🚀 Open in Chrome Now
                    </a>
                    <button 
                      type="button" 
                      onClick={() => {
                        navigator.clipboard.writeText(chromeOpenLink);
                        alert("Link copied! Aap isko kisi bhi browser ya WhatsApp par paste kar sakte hain.");
                      }} 
                      style={{ background: '#333', color: '#fff', border: '1px solid #555', padding: '0.6rem 1rem', borderRadius: '6px', fontSize: '0.9rem', cursor: 'pointer' }}
                    >
                      📋 Copy Link
                    </button>
                  </div>
                </div>
              )}
            </div>

            {pasteProgress && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255, 193, 7, 0.15)', borderRadius: '8px', border: '1px solid rgba(255, 193, 7, 0.4)', textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#ffc107', fontWeight: 'bold' }}>{pasteProgress}</p>
              </div>
            )}

          </div>
        </div>
      )}

      {activeTab === 'tg_test' && (
        <div className="animate-tab-enter" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card mb-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="mb-4 text-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📲 Telegram Quiz Auto-Poster
            </h3>
            <p className="text-muted mb-4">Apne batches (TGT PGT, NMMS, etc.) ke Telegram channels connect karein aur PDF ya CSV se questions directly Quiz Polls ke roop me post karein.</p>
            
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Batch & Channel Selector Box */}
              <div style={{ background: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.3)', padding: '1.25rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, color: '#2196f3', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🎯 Select Target Batch & Channel
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: '#81c784' }}>💾 Settings auto-saved per batch</span>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-light" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Target Batch</label>
                    <select 
                      value={tgSelectedBatch} 
                      onChange={(e) => handleSelectTgBatch(e.target.value)} 
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #2196F3', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                    >
                      <option value="">-- Custom / Direct Channel --</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title} {batchTelegramMap[b.id]?.channelId ? `(Connected: ${batchTelegramMap[b.id].channelId})` : '(Not linked yet)'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-light" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Telegram Channel Username / ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. @tgt_pgt_channel or @azadkumar3229011" 
                      value={tgChatId} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setTgChatId(val);
                        if (tgSelectedBatch) {
                          handleUpdateBatchTelegram(tgSelectedBatch, val);
                        } else {
                          try { localStorage.setItem('tg_chat_id', val); } catch(e){}
                        }
                      }} 
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <label className="text-light" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Telegram Bot Token</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 8054498159:AAHdHB..." 
                      value={tgBotToken} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setTgBotToken(val);
                        if (tgSelectedBatch) {
                          handleUpdateBatchTelegram(tgSelectedBatch, tgChatId, val);
                        } else {
                          try { localStorage.setItem('tg_bot_token', val); } catch(e){}
                        }
                      }} 
                      style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white' }} 
                      required 
                    />
                  </div>
                </div>

                {/* Helpful Connection Guide */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 0.35rem 0', color: '#ffb74d', fontWeight: 'bold' }}>💡 Telegram Channel Connect Karne Ka Tarika:</p>
                  <ol style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-light)', lineHeight: '1.5' }}>
                    <li>Telegram app me apne naye <b>TGT PGT Channel</b> ko open karein.</li>
                    <li>Channel Settings &gt; <b>Administrators &gt; Add Admin</b> me jaakar apne Bot (Token wale bot) ko add karein.</li>
                    <li>Bot ko <b>"Post Messages"</b> permission allow karein.</li>
                    <li>Channel ka Username (jaise <code>@tgt_pgt_channel</code>) ya Channel ID upar daal dein. Yeh automatic save ho jayega!</li>
                  </ol>
                </div>
              </div>

              <h4 className="mt-4 text-accent" style={{ color: '#2196F3' }}>Option 1: Upload CSV (Direct Posting, No AI limit)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(33, 150, 243, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(33, 150, 243, 0.3)' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>Upload a CSV file with columns: <b>Question, A, B, C, D, Answer, Explanation (Optional)</b></p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button type="button" onClick={() => tgHiddenCsvInput.current.click()} className="btn-outline" style={{ flexShrink: 0, border: '1px solid #2196F3', color: '#2196F3' }}>Select CSV File</button>
                    <span style={{ color: 'var(--text-muted)' }}>{tgCsvFileName || 'No file selected'}</span>
                    <input type="file" accept=".csv" ref={tgHiddenCsvInput} onChange={handleTgCsvUpload} style={{ display: 'none' }} />
                </div>
                <button type="button" onClick={handleGenerateTgCsvQuiz} disabled={isTgGenerating} className="btn-primary mt-2" style={{ background: '#2196F3', width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
                  {isTgGenerating ? 'Processing...' : '📊 Post CSV to Telegram'}
                </button>
              </div>

              <h4 className="mt-4 text-accent" style={{ color: '#9c27b0' }}>Option 2: Upload PDF (AI Generates Questions)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(156, 39, 176, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(156, 39, 176, 0.3)' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button type="button" onClick={() => tgHiddenFileInput.current.click()} className="btn-outline" style={{ flexShrink: 0, border: '1px solid #9c27b0', color: '#9c27b0' }}>Select PDF File</button>
                    <span style={{ color: 'var(--text-muted)' }}>{tgPdfFileName || 'No file selected'}</span>
                    <input type="file" accept="application/pdf" ref={tgHiddenFileInput} onChange={handleTgPdfUpload} style={{ display: 'none' }} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label className="text-light" style={{ fontSize: '0.9rem' }}>Number of Questions to Post</label>
                    <input type="number" placeholder="e.g. 10" value={tgQuestionCount} onChange={(e) => setTgQuestionCount(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white' }} />
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

                <button type="button" onClick={handleGenerateTgQuiz} disabled={isTgGenerating} className="btn-primary mt-2" style={{ background: '#9c27b0', width: '100%', fontSize: '1.1rem', padding: '1rem' }}>
                  {isTgGenerating ? 'Processing...' : '🚀 AI Generate & Post to Telegram'}
                </button>
              </div>



              {tgGenerateProgress && (
                <div style={{ padding: '1rem', background: 'rgba(33, 150, 243, 0.1)', border: '1px solid #2196F3', borderRadius: '8px', color: '#2196F3', fontWeight: 'bold', textAlign: 'center' }}>
                  {tgGenerateProgress}
                </div>
              )}
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

      {/* PDF Ready & Phone Location Action Modal */}
      {pdfModalInfo && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '520px', background: '#18181b', border: '1px solid #3f3f46', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#4caf50', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✅ PDF Download Ready!
              </h3>
              <button onClick={() => setPdfModalInfo(null)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.4rem', cursor: 'pointer' }}>✖</button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '1.2rem' }}>
              <p style={{ margin: '0 0 0.4rem 0', fontWeight: 'bold', color: '#fff', fontSize: '0.95rem' }}>
                📄 {pdfModalInfo.fileName}
              </p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#a1a1aa' }}>
                Coaching: {pdfModalInfo.coaching} • 2-Column Exam Format (No Answer Key)
              </p>
            </div>

            {/* Exact Phone Location Notice */}
            <div style={{ background: 'rgba(33, 150, 243, 0.12)', border: '1px solid rgba(33, 150, 243, 0.35)', padding: '0.9rem', borderRadius: '10px', marginBottom: '1.2rem' }}>
              <p style={{ margin: '0 0 0.3rem 0', color: '#60a5fa', fontWeight: 'bold', fontSize: '0.88rem' }}>
                📁 Phone me kaha milegi ye file?
              </p>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.82rem', lineHeight: '1.4' }}>
                Aapke phone ke <b>"Files" / "File Manager"</b> app me jaakar <b>"Downloads"</b> folder check karein. Wahan sabse upar yeh PDF mil jayegi!
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* WhatsApp / Direct Share Button */}
              {typeof navigator !== 'undefined' && navigator.canShare && (
                <button 
                  type="button" 
                  onClick={async () => {
                    try {
                      const file = new File([pdfModalInfo.pdfBlob], pdfModalInfo.fileName, { type: 'application/pdf' });
                      if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                          files: [file],
                          title: pdfModalInfo.title,
                          text: `Question Paper: ${pdfModalInfo.title}`
                        });
                      }
                    } catch (err) {
                      console.log("Share cancelled:", err);
                    }
                  }} 
                  className="btn-primary" 
                  style={{ background: '#25D366', color: '#000', fontWeight: 'bold', padding: '0.85rem', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                >
                  📲 WhatsApp / Drive par Share ya Save karein
                </button>
              )}

              {/* Open in Browser / Phone Viewer */}
              <a 
                href={pdfModalInfo.blobUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-outline" 
                style={{ textAlign: 'center', padding: '0.85rem', border: '1px solid #4caf50', color: '#4caf50', fontWeight: 'bold', textDecoration: 'none', display: 'block', borderRadius: '8px', fontSize: '0.95rem' }}
              >
                👁️ PDF Kholkar Dekhein (Open in Phone)
              </a>

              {/* Download Again Button */}
              <a 
                href={pdfModalInfo.blobUrl} 
                download={pdfModalInfo.fileName} 
                className="btn-outline" 
                style={{ textAlign: 'center', padding: '0.75rem', border: '1px solid #71717a', color: '#d4d4d8', textDecoration: 'none', display: 'block', borderRadius: '8px', fontSize: '0.85rem' }}
              >
                📥 Fir se Download karein (Save to Downloads)
              </a>

              <button 
                type="button" 
                onClick={() => setPdfModalInfo(null)} 
                className="btn-outline" 
                style={{ border: 'none', color: '#71717a', fontSize: '0.85rem', padding: '0.5rem', cursor: 'pointer' }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

