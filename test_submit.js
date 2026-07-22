const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let NEXT_PUBLIC_SUPABASE_URL = '', NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
env.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) NEXT_PUBLIC_SUPABASE_URL = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) NEXT_PUBLIC_SUPABASE_ANON_KEY = line.split('=')[1].trim();
});
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testSubmit() {
    // get a real test
    const { data: tests } = await supabase.from('tests').select('*').limit(1);
    if (!tests || !tests.length) { console.log("No tests"); return; }
    const testId = tests[0].id;
    
    // get a real student
    const { data: students } = await supabase.from('profiles').select('*').eq('role', 'student').limit(1);
    if (!students || !students.length) { console.log("No students"); return; }
    const studentId = students[0].id;

    console.log("Simulating submit for test:", testId, "student:", studentId);
    
    // Attempt to insert into test_attempts directly to test RLS
    const { error: insertError } = await supabase.from('test_attempts').insert([{
        student_id: studentId,
        test_id: testId,
        score: 5,
        total_questions: 10
    }]);
    
    console.log("Direct Insert Error:", insertError);
}
testSubmit();
