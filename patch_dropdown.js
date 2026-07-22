const fs = require('fs');
let content = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

const oldDetailsBlock = `<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '200px' }}>
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
                              </div>`;

const newDetailsBlock = `<details style={{ cursor: 'pointer', minWidth: '200px' }}>
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
                              </details>`;

content = content.replace(oldDetailsBlock, newDetailsBlock);

fs.writeFileSync('src/app/admin-dashboard/page.js', content, 'utf8');
console.log('Added details/summary dropdown');
