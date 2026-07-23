const fs = require('fs');

function replaceInFile(filepath, target, replacement) {
    let content = fs.readFileSync(filepath, 'utf8');
    if(content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(filepath, content, 'utf8');
    }
}

// Admin Dashboard
let adminContent = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');
if (!adminContent.includes('framer-motion')) {
  adminContent = adminContent.replace("import { useState", "import { motion } from 'framer-motion';\nimport { Tilt } from 'react-tilt';\nimport { useState");
  
  // We want to replace <div className="animate-fade-in"...> with <motion.div initial...
  // There are multiple activeTab blocks:
  // <div className="animate-fade-in grid-cols-2" style={{ alignItems: 'flex-start' }}>
  // <div className="animate-fade-in">
  
  adminContent = adminContent.replaceAll('<div className="animate-fade-in">', '<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="animate-fade-in">');
  adminContent = adminContent.replaceAll('<div className="animate-fade-in grid-cols-2"', '<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="animate-fade-in grid-cols-2"');
  
  // Now we need to carefully replace the closing </div> for these blocks.
  // Each block ends with </div>\n        )}
  adminContent = adminContent.replaceAll('</div>\n        )}', '</motion.div>\n        )}');
  adminContent = adminContent.replaceAll('</div>\n      )}', '</motion.div>\n      )}'); // for activeTab === 'admin_chats'
  
  fs.writeFileSync('src/app/admin-dashboard/page.js', adminContent, 'utf8');
  console.log('Patched Admin Dashboard with Motion');
}

