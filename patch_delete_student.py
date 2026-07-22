import sys

with open('src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

func = '''
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

  const handleDeleteTest = async (id) => {'''

if 'handleDeleteStudent' not in content:
    content = content.replace('  const handleDeleteTest = async (id) => {', func)

button_old = '''                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button 
                          onClick={() => { setActiveTab('admin_chats'); setActiveChatStudentId(student.id); document.body.style.overflow = 'hidden'; }}
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          💬 Chat
                        </button>
                      </td>'''

button_new = '''                      <td style={{ padding: '1rem', textAlign: 'right' }}>
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
                      </td>'''

if button_old in content:
    content = content.replace(button_old, button_new)
else:
    print("Warning: button_old not found!")

with open('src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched admin-dashboard/page.js")
