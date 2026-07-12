"use client";
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [batches, setBatches] = useState([]);
  
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
    }
    fetchBatches();
  }, [router]);

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
    <div className="container py-4">
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
        <button className={activeTab === 'content' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('content')} style={{ padding: '0.5rem 1rem' }}>Content Manager</button>
        <button className={activeTab === 'test' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('test')} style={{ padding: '0.5rem 1rem' }}>Test Manager</button>
      </div>

      {activeTab === 'overview' && (
        <div className="animate-fade-in grid-cols-2" style={{ alignItems: 'flex-start' }}>
          <div>
            <div className="grid-cols-2 mb-4">
              <div className="glass-card text-center">
                <h3 className="text-accent" style={{ fontSize: '2rem' }}>₹1.2L</h3>
                <p className="text-muted">Total Revenue</p>
              </div>
              <div className="glass-card text-center">
                <h3 className="text-accent" style={{ fontSize: '2rem' }}>1,240</h3>
                <p className="text-muted">Total Students</p>
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
                <div key={b.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
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
              
              <div style={{ display: 'flex', gap: '1rem' }}>
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

      {activeTab === 'test' && (
        <div className="animate-fade-in grid-cols-2" style={{ alignItems: 'flex-start' }}>
          <div className="glass-card mb-4">
            <h3 className="mb-4">Create New Online Test</h3>
            <form onSubmit={handlePublishTest} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select value={testBatch} onChange={(e) => setTestBatch(e.target.value)} style={{ padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required>
                <option value="">Select Batch for Test...</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
              <div className="flex" style={{ gap: '1rem' }}>
                <input type="text" placeholder="Test Name (e.g. MAT Mock Test 1)" value={testTitle} onChange={(e) => setTestTitle(e.target.value)} style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                <input type="number" placeholder="Duration (Mins)" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ width: '150px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                <input type="number" placeholder="Total Questions" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} style={{ width: '150px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
              </div>
              
              <h4 className="mt-2 text-accent">Option 1: Generate from Topic</h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="text" placeholder="Topic for AI (e.g. Science Class 10)" value={testTopic} onChange={(e) => setTestTopic(e.target.value)} style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className="btn-primary" style={{ background: 'var(--gradient-brand)' }}>
                  {isGenerating ? 'Generating...' : '✨ Auto-Generate Test'}
                </button>
              </div>

              <h4 className="mt-2 text-accent">Option 2: Generate from PDF (Question Paper + Answer Key)</h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input id="pdf-upload" type="file" accept="application/pdf" onChange={(e) => setTestPdf(e.target.files[0])} style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} />
                <button type="button" onClick={handleGeneratePDF} disabled={isGenerating} className="btn-primary" style={{ background: 'var(--gradient-brand)' }}>
                  {isGenerating ? 'Generating...' : '📄 Read PDF & Generate'}
                </button>
              </div>

              <h4 className="mt-2 text-accent">Option 3: Paste Text (Copy-Paste from anywhere)</h4>
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
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
              <button type="submit" className="btn-outline mt-2">Publish Manually (Legacy)</button>
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
    </div>
  );
}
