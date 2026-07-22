const fs = require('fs');
let content = fs.readFileSync('src/app/api/evaluate-test/route.js', 'utf8');

content = content.replace('const { testId, answers } = await req.json();', 'const { testId, answers, student_id } = await req.json();');

const insertion = `
    if (student_id) {
      const { error: insertError } = await supabase.from('test_attempts').insert([{
        student_id,
        test_id: testId,
        score,
        total_questions: questions.length
      }]);
      if (insertError) {
        console.error('Error saving test attempt:', insertError);
      }
    }
`;

content = content.replace('    return NextResponse.json({', insertion + '\n    return NextResponse.json({');

fs.writeFileSync('src/app/api/evaluate-test/route.js', content, 'utf8');
console.log('Patched API route');
