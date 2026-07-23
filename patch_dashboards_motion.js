const fs = require('fs');

// Add animated gradient to globals.css
let cssContent = fs.readFileSync('src/app/globals.css', 'utf8');
if (!cssContent.includes('.animated-gradient-bg')) {
  cssContent += `\n
@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.animated-gradient-bg {
  background: linear-gradient(-45deg, #0a0f1c, #1a2333, #0d1424, #121c2d);
  background-size: 400% 400%;
  animation: gradientAnimation 15s ease infinite;
}

.animate-tab-enter {
  animation: tabEnter 0.4s ease-out forwards;
}

@keyframes tabEnter {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
  fs.writeFileSync('src/app/globals.css', cssContent, 'utf8');
  console.log('Added CSS animations');
}

// Update Admin Dashboard
let adminContent = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');
if (!adminContent.includes('framer-motion')) {
  const importStatement = `import { motion, AnimatePresence } from 'framer-motion';\nimport { Tilt } from 'react-tilt';\n`;
  adminContent = adminContent.replace("import { useState", importStatement + "import { useState");
  
  // Replace `<div className="animate-fade-in">` with `<motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>`
  // Actually, there's no AnimatePresence wrapper yet, so let's just use motion.div without exit
  adminContent = adminContent.replace(/<div className="animate-fade-in">/g, '<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="animate-fade-in">');
  adminContent = adminContent.replace(/<\/div>\n        \)}/g, '</motion.div>\n        )}');
  
  fs.writeFileSync('src/app/admin-dashboard/page.js', adminContent, 'utf8');
  console.log('Patched Admin Dashboard with Motion');
}

// Update Student Dashboard
let studentContent = fs.readFileSync('src/app/student-dashboard/page.js', 'utf8');
if (!studentContent.includes('framer-motion')) {
  const importStatement = `import { motion } from 'framer-motion';\nimport { Tilt } from 'react-tilt';\n`;
  studentContent = studentContent.replace("import { useState", importStatement + "import { useState");
  
  // Same replacement for student dashboard
  studentContent = studentContent.replace(/<div className="animate-fade-in">/g, '<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="animate-fade-in">');
  // Need to fix closing tags
  studentContent = studentContent.replace(/<\/div>\n        \)}/g, '</motion.div>\n        )}');
  
  // Add tilt to course cards in student dashboard
  const oldCourseCard = `<div key={batch.id} className="glass-card" style={{ flex: '1 1 300px', maxWidth: '400px' }}>`;
  const newCourseCard = `<Tilt options={{ max: 10, scale: 1.02, speed: 400 }} style={{ flex: '1 1 300px', maxWidth: '400px' }}>\n                    <div key={batch.id} className="glass-card" style={{ height: '100%' }}>`;
  studentContent = studentContent.replace(oldCourseCard, newCourseCard);
  
  // Close Tilt
  studentContent = studentContent.replace(/<\/div>\n                  \)\)/g, '</div>\n                  </Tilt>\n                  ))');
  
  fs.writeFileSync('src/app/student-dashboard/page.js', studentContent, 'utf8');
  console.log('Patched Student Dashboard with Motion and Tilt');
}
