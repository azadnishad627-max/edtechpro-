const fs = require('fs');

let content = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

const state_target = `  const [testTopic, setTestTopic] = useState('');
  const [testPdf, setTestPdf] = useState(null);
  const [rawText, setRawText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);`;
const state_replace = `  const [testUrl, setTestUrl] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);`;

content = content.replace(state_target, state_replace);

const func_pattern = /  const handlePublishTest = async \(e\) => \{.*?\n        alert\("Error generating test: " \+ err\.message\);\n      \}\n      setIsGenerating\(false\);\n    \};\n/s;
const new_func = `  const handlePublishTest = async (e) => {
    e.preventDefault();
    if (!testBatch || !testTitle || !duration || !totalQuestions || !testUrl) {
      alert("Please fill all test fields including the Test Link!");
      return;
    }
    setIsPublishing(true);
    try {
      const { data: testData, error: testError } = await supabase.from('tests').insert([
        { batch_id: testBatch, title: testTitle, duration_mins: parseInt(duration), total_questions: parseInt(totalQuestions), test_url: testUrl }
      ]).select();

      if (testError) throw testError;

      alert(\`Success! Published test link successfully.\`);
      setTestTitle(''); setTestUrl(''); setDuration(''); setTotalQuestions('');
      
      const { data: tData } = await supabase.from('tests').select('*, batches(title)');
      if (tData) setDbTests(tData);
    } catch (err) {
      alert("Error publishing test: " + err.message);
    }
    setIsPublishing(false);
  };
`;
content = content.replace(func_pattern, new_func);

const ui_pattern = /                <h4 className="mt-2 text-accent">Option 1: Generate from Topic<\/h4>.*?<button type="submit" className="btn-outline mt-2">Publish Manually \(Legacy\)<\/button>\n              <\/form>/s;
const new_ui = `                <h4 className="mt-2 text-accent">Test Link</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <input type="url" placeholder="Paste Gemini Quiz or Form Link here..." value={testUrl} onChange={(e) => setTestUrl(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-dark)', color: 'white' }} required />
                </div>
                
                <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />
                <button type="submit" disabled={isPublishing} className="btn-primary mt-2" style={{ background: 'var(--gradient-brand)' }}>
                  {isPublishing ? 'Publishing...' : 'Publish Test'}
                </button>
              </form>`;
content = content.replace(ui_pattern, new_ui);

fs.writeFileSync('src/app/admin-dashboard/page.js', content, 'utf8');
console.log("Updated admin-dashboard/page.js successfully");
