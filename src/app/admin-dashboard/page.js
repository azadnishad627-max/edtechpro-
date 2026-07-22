"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import Papa from 'papaparse';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
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
  const [testTopic, setTestTopic] = useState('');
  const [testPdf, setTestPdf] = useState(null);
  const [rawText, setRawText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [csvFile, setCsvFile] = useState(null);
  const [showLegacyOptions, setShowLegacyOptions] = useState(false);
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
    if (!window.confirm("Are you sure you want to delete this student's account? This will remove them from the system.")) return;
    
    // Manually delete enrollments first to avoid foreign key constraints
    await supabase.from('enrollments').delete().eq('student_id', studentId);
    
    const { error } = await supabase.from('profiles').delete().eq('id', studentId);
    if (error) {
      alert("Error deleting student: " + error.message);
    } else {
      alert("Student deleted successfully.");
      setDbStudents(prev => prev.filter(s => s.id !== studentId));
      setTotalStudents(prev => prev - 1);
    }
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this test? This will also delete all its questions!")) return;
    
    // First delete questions associated with the test
    const { error: qError } = await supabase.from('questions').delete().eq('test_id', id);
    if (qError) {
      alert("Error deleting questions: " + qError.message);
      return;
    }

    // Then delete the test itself
    const { error: tError } = await supabase.from('tests').delete().eq('id', id);
    if (tError) {
      alert("Error deleting test: " + tError.message);
    } else {
      setDbTests(prev => prev.filter(t => t.id !== id));
      alert("Test and all questions deleted successfully!");
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
      const { data, error } = await supabase.from('tests').insert([
        { batch_id: testBatch, title: testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions), test_url: testUrl }
      ]);
      if (error) throw error;
      alert("Test Link Published Successfully!");
      setTestTitle(''); setTestUrl(''); setDuration(''); setTotalQuestions('');
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
          
          // 1. Insert Test
          const { data: testData, error: testError } = await supabase.from('tests').insert([
            { batch_id: testBatch, title: testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions) }
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
          setTestTitle(''); setCsvFile(null); setDuration(''); setTotalQuestions('');
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
    try {
      const res = await fetch('/api/generate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: testTopic, questionCount: totalQuestions })
      });
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);
      if (!data.questions || data.questions.length === 0) throw new Error("No questions generated.");

      // 1. Insert Test
      const { data: testData, error: testError } = await supabase.from('tests').insert([
        { batch_id: testBatch, title: testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions) }
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

      alert(`Success! Generated and saved ${questionsToInsert.length} questions to the database.`);
      setTestTitle(''); setTestTopic(''); setDuration(''); setTotalQuestions('');
      
      const { data: tData } = await supabase.from('tests').select('*, batches(title)');
      if (tData) setDbTests(tData);
    } catch (err) {
      alert("Error generating test: " + err.message);
    }
    setIsGenerating(false);
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

      // 1. Insert Test
      const { data: testData, error: testError } = await supabase.from('tests').insert([
        { batch_id: testBatch, title: testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions) }
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
      setTestTitle(''); setTestPdf(null); setDuration(''); setTotalQuestions('');
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

      // 1. Insert Test
      const { data: testData, error: testError } = await supabase.from('tests').insert([
        { batch_id: testBatch, title: testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions) }
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
      setTestTitle(''); setRawText(''); setDuration(''); setTotalQuestions('');
      
      const { data: tData } = await supabase.from('tests').select('*, batches(title)');
      if (tData) setDbTests(tData);
    } catch (err) {
      alert("Error generating test from text: " + err.message);
    }
    setIsGenerating(false);
  };

  return (
    <div className="container pt-navbar mobile-pb">
      <div className="flex justify-between align-center mb-4 animate-fade-in" style={{ flexWrap: 'wrap', gap: '1rem' }}>
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
        <button className={activeTab === 'overview' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('overview')} style={{ padding: '0.5rem 1rem' }}>Overview</button>
        <button className={activeTab === 'students' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('students')} style={{ padding: '0.5rem 1rem' }}>Students List</button>
        <button className={activeTab === 'results' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('results')} style={{ padding: '0.5rem 1rem' }}>Test Results</button>
        <button className={activeTab === 'content' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('content')} style={{ padding: '0.5rem 1rem' }}>Content Manager</button>
        <button className={activeTab === 'test' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('test')} style={{ padding: '0.5rem 1rem' }}>Test Manager</button>
        <button className={activeTab === 'live' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('live')} style={{ padding: '0.5rem 1rem' }}>Live Classes</button>
        <button className={activeTab === 'announcements' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('announcements')} style={{ padding: '0.5rem 1rem' }}>Announcements</button>
        <button className={activeTab === 'feedback' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('feedback')} style={{ padding: '0.5rem 1rem' }}>Student Feedback</button>
        <button className={activeTab === 'admin_chats' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('admin_chats')} style={{ padding: '0.5rem 1rem' }}>💬 Student Chats</button>
      </div>

      {activeTab === 'overview' && (
        <div className="animate-fade-in grid-cols-2" style={{ alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div className="glass-card text-center" style={{ flex: 1, minWidth: '150px' }}>
                <h3 className="text-accent" style={{ fontSize: '2rem' }}>₹{totalRevenue}</h3>
                <p className="text-muted">Total Revenue</p>
              </div>
              <div className="glass-card text-center" style={{ flex: 1, minWidth: '150px', cursor: 'pointer', transition: 'transform 0.2s ease', border: '1px solid var(--accent)' }} onClick={() => setActiveTab('students')}>
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
        <div className="animate-fade-in grid-cols-2" style={{ alignItems: 'flex-start' }}>
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
        <div className="animate-fade-in">
          <div className="glass-card">
            <h3 className="mb-4">Student Test Results</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Student Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Test Title</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Attempt #</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Score</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dbTestAttempts.length === 0 ? (
                    <tr><td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>No results found.</td></tr>
                  ) : dbTestAttempts.map(attempt => (
                    <tr key={attempt.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{attempt.profiles?.name || 'N/A'} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({attempt.profiles?.class_name || 'N/A'})</span></td>
                      <td style={{ padding: '1rem' }}>{attempt.tests?.title || 'Deleted Test'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem' }}>Attempt {attempt.attempt_number}</span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: attempt.score >= attempt.total_questions / 2 ? '#10b981' : '#ff4444' }}>{attempt.score} / {attempt.total_questions}</td>
                      <td style={{ padding: '1rem' }}>{new Date(attempt.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'test' && (
        <div className="animate-fade-in grid-cols-2" style={{ alignItems: 'flex-start' }}>
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
                </div>
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
                <input id="csv-upload" type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
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
              {dbTests.length === 0 ? <p className="text-muted">No tests published yet.</p> : dbTests.map(t => (
                <div key={t.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0' }}>{t.title}</h4>
                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Batch: {t.batches?.title} • {t.duration_mins}m • {t.total_questions}Q</p>
                  </div>
                  <button onClick={() => handleDeleteTest(t.id)} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem' }}>Delete</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'students' && (
        <div className="animate-fade-in">
          <div className="glass-card">
            <h3 className="mb-4">Registered Students ({dbStudents.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Name</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Username</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Class</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>DOB</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)' }}>Joined Date</th>
                    <th style={{ padding: '1rem', color: 'var(--text-secondary-dark)', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dbStudents.length === 0 ? (
                    <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center' }}>No students found.</td></tr>
                  ) : dbStudents.map(student => (
                    <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{student.name || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{student.username || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{student.class_name || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{student.dob || 'N/A'}</td>
                      <td style={{ padding: '1rem' }}>{new Date(student.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => { setActiveTab('admin_chats'); setActiveChatStudentId(student.id); document.body.style.overflow = 'hidden'; }}
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
        <div className="animate-fade-in grid-cols-2" style={{ alignItems: 'flex-start' }}>
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
        <div className="animate-fade-in grid-cols-2" style={{ alignItems: 'flex-start' }}>
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
        <div className="animate-fade-in">
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
        <div className="animate-fade-in" style={{ height: 'calc(100vh - 200px)' }}>
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
    </div>
  );
}

