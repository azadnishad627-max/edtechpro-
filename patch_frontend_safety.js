const fs = require('fs');
let content = fs.readFileSync('src/app/test/[id]/page.js', 'utf8');

content = content.replace('body: JSON.stringify({ testId: id, answers, student_id: studentInfo.id })', 'body: JSON.stringify({ testId: id, answers, student_id: studentInfo?.id })');

fs.writeFileSync('src/app/test/[id]/page.js', content, 'utf8');
console.log('Patched frontend route safety');
