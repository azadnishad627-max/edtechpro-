const fs = require('fs');
let content = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

// Find the exact activeTab === 'results' block
const resultsBlockStart = content.indexOf(`{activeTab === 'results' && (`);
const testBlockStart = content.indexOf(`{activeTab === 'test' && (`);

const beforeResults = content.substring(0, resultsBlockStart);
const afterResults = content.substring(testBlockStart);

const newResultsBlock = `{activeTab === 'results' && (
          <div className="animate-fade-in">
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
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
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
        
        `;

content = beforeResults + newResultsBlock + afterResults;

fs.writeFileSync('src/app/admin-dashboard/page.js', content, 'utf8');
console.log('Grouped attempts successfully');
