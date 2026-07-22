import re

with open('src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Papa import
content = content.replace(
    "import { supabase } from '../../lib/supabaseClient';",
    "import { supabase } from '../../lib/supabaseClient';\nimport Papa from 'papaparse';"
)

# 2. Add state variables
state_target = "  const [isGenerating, setIsGenerating] = useState(false);"
state_replacement = "  const [isGenerating, setIsGenerating] = useState(false);\n  const [testUrl, setTestUrl] = useState('');\n  const [csvFile, setCsvFile] = useState(null);\n  const [showLegacyOptions, setShowLegacyOptions] = useState(false);"
content = content.replace(state_target, state_replacement)

# 3. Add handlePublishLinkTest and handlePublishCsvTest
handlers = """
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
          const questionsToInsert = rows.map(r => ({
            test_id: testId,
            question_text: r.question_text || r.Question || r.Q,
            option_a: r.option_a || r.A,
            option_b: r.option_b || r.B,
            option_c: r.option_c || r.C,
            option_d: r.option_d || r.D,
            correct_answer: r.correct_answer || r.Answer
          }));
          
          const { error: qError } = await supabase.from('questions').insert(questionsToInsert);
          if (qError) throw qError;
          
          alert(Success! Generated and saved  questions from CSV to the database.);
          setTestTitle(''); setCsvFile(null); setDuration(''); setTotalQuestions('');
          document.getElementById('csv-upload').value = '';
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
"""

content = content.replace("  const handleGenerateAI = async () => {", handlers + "\n  const handleGenerateAI = async () => {")

# 4. Replace the UI block for Option 1, 2, 3
ui_target = r'''              <h4 className="mt-2 text-accent">Option 1: Generate from Topic</h4>.*?<button type="submit" className="btn-outline mt-2">Publish Manually \(Legacy\)</button>'''
ui_replacement = """              <h4 className="mt-2 text-accent" style={{ color: '#4CAF50' }}>Option 1: Embed a Test Link (Google Forms, etc.)</h4>
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
                      <button type="button" onClick={handleGenerateText} disabled={isGenerating} className="btn-primary" style={{ background: 'var(--gradient-brand)', width: '100%' }}>
                        {isGenerating ? 'Generating...' : '📋 Generate from Text'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
              <button type="submit" className="btn-outline mt-2">Publish Blank Test (Add manually later)</button>"""

content = re.sub(ui_target, ui_replacement, content, flags=re.DOTALL)

with open('src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to admin-dashboard/page.js")
