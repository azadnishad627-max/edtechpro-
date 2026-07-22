const fs = require('fs');
let content = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

content = content.replace(
  '<input id="csv-upload" type="file" accept=".csv"',
  '<input id="csv-upload" type="file" accept=".csv, text/csv, application/vnd.ms-excel, text/plain"'
);

fs.writeFileSync('src/app/admin-dashboard/page.js', content, 'utf8');
console.log('Patched file input accept attribute');
