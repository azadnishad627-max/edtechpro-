const fs = require('fs');
let content = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

const replacement = `  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student's account? This will remove them from the system.")) return;
    
    // Manually delete enrollments first to avoid foreign key constraints
    await supabase.from('enrollments').delete().eq('student_id', studentId);
    // Chats and bookmarks cascade automatically
    
    const { error } = await supabase.from('profiles').delete().eq('id', studentId);
    if (error) {
      alert("Error deleting student: " + error.message);
    } else {
      alert("Student deleted successfully.");
      setDbStudents(prev => prev.filter(s => s.id !== studentId));
      setTotalStudents(prev => prev - 1);
    }
  };`;

content = content.replace(/  const handleDeleteStudent = async \(studentId\) => \{[\s\S]*?setTotalStudents\(prev => prev - 1\);\s*\}\s*\};\s*/, replacement + '\n\n');

fs.writeFileSync('src/app/admin-dashboard/page.js', content, 'utf8');
