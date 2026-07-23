const fs = require('fs');

function replaceAllInFile(filepath, target, replacement) {
    let content = fs.readFileSync(filepath, 'utf8');
    content = content.replaceAll(target, replacement);
    fs.writeFileSync(filepath, content, 'utf8');
}

// Just apply pure CSS animations for tab switching (much safer and still very smooth)
replaceAllInFile('src/app/admin-dashboard/page.js', 'animate-fade-in', 'animate-tab-enter');
replaceAllInFile('src/app/student-dashboard/page.js', 'animate-fade-in', 'animate-tab-enter');

console.log('Applied safe CSS animations');
