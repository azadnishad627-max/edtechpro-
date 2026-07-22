const fs = require('fs');
let content = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

// 1. Add state variable
content = content.replace('const [dbStudents, setDbStudents] = useState([]);', 'const [dbStudents, setDbStudents] = useState([]);\n  const [dbTestAttempts, setDbTestAttempts] = useState([]);');

// 2. Add fetch logic
const fetchLogic = `      const { data: testAttemptsData } = await supabase
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
      }`;
content = content.replace('      const { data: studentsData', fetchLogic + '\n\n      const { data: studentsData');

// 3. Add tab button
const tabButton = `<button className={activeTab === 'results' ? 'btn-primary' : 'btn-outline'} onClick={() => setActiveTab('results')} style={{ padding: '0.5rem 1rem' }}>Test Results</button>\n        <button className={activeTab === 'content'`;
content = content.replace('<button className={activeTab === \'content\'', tabButton);

// 4. Add tab UI
const tabUI = `      {activeTab === 'results' && (
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
      
      {activeTab === 'test' && (`;

content = content.replace('{activeTab === \'test\' && (', tabUI);

fs.writeFileSync('src/app/admin-dashboard/page.js', content, 'utf8');
console.log('Patched admin dashboard');
