const fs = require('fs');
let content = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

const func = `
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student's account? This will remove them from the system.")) return;
    const { error } = await supabase.from('profiles').delete().eq('id', studentId);
    if (error) {
      alert("Error deleting student: " + error.message);
    } else {
      alert("Student deleted successfully.");
      setDbStudents(prev => prev.filter(s => s.id !== studentId));
      setTotalStudents(prev => prev - 1);
    }
  };

  const handleDeleteTest = async (id) => {`;

if (!content.includes('handleDeleteStudent')) {
    content = content.replace('  const handleDeleteTest = async (id) => {', func);
}

const button_old = `                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => { setActiveTab('admin_chats'); setActiveChatStudentId(student.id); document.body.style.overflow = 'hidden'; }}
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          💬 Chat
                        </button>
                      </td>`;

const button_new = `                      <td style={{ padding: '1rem', textAlign: 'right' }}>
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
                          🗑️
                        </button>
                      </td>`;

if (content.includes(button_old)) {
    content = content.replace(button_old, button_new);
} else {
    console.log("Warning: button_old not found!");
}

fs.writeFileSync('src/app/admin-dashboard/page.js', content, 'utf8');
console.log("Patched admin-dashboard/page.js");
