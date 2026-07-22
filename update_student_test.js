const fs = require('fs');

let content = fs.readFileSync('src/app/student-dashboard/page.js', 'utf8');

// 1. Add state variable
const state_target = `  const [activeLiveClassUrl, setActiveLiveClassUrl] = useState(null);`;
const state_replace = `  const [activeLiveClassUrl, setActiveLiveClassUrl] = useState(null);
  const [activeTestUrl, setActiveTestUrl] = useState(null);
  const activeTestUrlRef = useRef(null);
  useEffect(() => { activeTestUrlRef.current = activeTestUrl; }, [activeTestUrl]);`;
content = content.replace(state_target, state_replace);

// 2. Update popState
const pop_target = `      if (showAdminChatModalRef.current) {
        setShowAdminChatModal(false);
        preventExit = true;
      } else if (activeTabRef.current !== 'overview') {`;
const pop_replace = `      if (showAdminChatModalRef.current) {
        setShowAdminChatModal(false);
        preventExit = true;
      } else if (activeTestUrlRef.current) {
        setActiveTestUrl(null);
        document.body.style.overflow = '';
        preventExit = true;
      } else if (activeTabRef.current !== 'overview') {`;
content = content.replace(pop_target, pop_replace);

// 3. Update Start Test button
const btn_target = `<button onClick={() => router.push(\`/test/\${test.id}\`)} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Start Test</button>`;
const btn_replace = `<button onClick={() => { 
                    if(test.test_url) {
                      setActiveTestUrl(test.test_url); 
                      document.body.style.overflow = 'hidden'; 
                    } else {
                      alert("This test does not have a valid link.");
                    }
                  }} className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Start Test</button>`;
content = content.replace(btn_target, btn_replace);

// 4. Append Test iframe Modal before the very last `</>`
const modal_code = `
      {activeTestUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', background: 'var(--bg-dark)', zIndex: 10000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)' }}>
            <h3 style={{ margin: 0, color: 'white' }}>Online Test</h3>
            <button onClick={() => { setActiveTestUrl(null); document.body.style.overflow = ''; }} className="btn-outline" style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem' }}>Close Test</button>
          </div>
          <iframe src={activeTestUrl} style={{ flex: 1, width: '100%', border: 'none', background: 'white' }} />
        </div>
      )}
`;

content = content.replace('    </>\n  );\n}\n', modal_code + '\n    </>\n  );\n}\n');

fs.writeFileSync('src/app/student-dashboard/page.js', content, 'utf8');
console.log("Updated student-dashboard/page.js successfully");
