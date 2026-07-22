const fs = require('fs');
let content = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

// Find the second instance and remove it
const firstIndex = content.indexOf('const handleDeleteStudent');
const secondIndex = content.indexOf('const handleDeleteStudent', firstIndex + 1);

if (secondIndex !== -1) {
    // The second one was at line 548
    // We should just remove the second one. But let's check what exactly it looks like.
    // Actually, since the first one lacks the enrollments delete, I should remove the FIRST one, and keep the SECOND one.
    // Or just manually fix the whole block using string slicing.
    
    // Let's replace the first one with the correct code, and remove the second one.
    const startFirst = content.lastIndexOf('  const handleDeleteStudent = async (studentId)', firstIndex);
    
    // Find where the second one ends
    const endSecond = content.indexOf('  const handleDeleteTest = async (id)', secondIndex);
    
    const replacement = `  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student's account? This will remove them from the system.")) return;
    
    // Manually delete enrollments first to avoid foreign key constraints
    await supabase.from('enrollments').delete().eq('student_id', studentId);
    
    const { error } = await supabase.from('profiles').delete().eq('id', studentId);
    if (error) {
      alert("Error deleting student: " + error.message);
    } else {
      alert("Student deleted successfully.");
      setDbStudents(prev => prev.filter(s => s.id !== studentId));
      setTotalStudents(prev => prev - 1);
    }
  };\n\n`;

    content = content.substring(0, startFirst) + replacement + content.substring(endSecond);
    fs.writeFileSync('src/app/admin-dashboard/page.js', content, 'utf8');
    console.log("Fixed duplicates!");
}
