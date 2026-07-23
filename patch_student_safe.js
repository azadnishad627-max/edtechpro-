const fs = require('fs');

// Student Dashboard
let studentContent = fs.readFileSync('src/app/student-dashboard/page.js', 'utf8');
if (!studentContent.includes('framer-motion')) {
  studentContent = studentContent.replace("import { useState", "import { motion } from 'framer-motion';\nimport { Tilt } from 'react-tilt';\nimport { useState");
  
  studentContent = studentContent.replaceAll('<div className="animate-fade-in">', '<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="animate-fade-in">');
  studentContent = studentContent.replaceAll('<div className="grid-cols-2"', '<motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="grid-cols-2"');
  
  studentContent = studentContent.replaceAll('</div>\n        )}', '</motion.div>\n        )}');
  
  // Add tilt to course cards in student dashboard
  const oldCourseCard = `<div key={batch.id} className="glass-card" style={{ flex: '1 1 300px', maxWidth: '400px' }}>`;
  const newCourseCard = `<Tilt key={batch.id} options={{ max: 10, scale: 1.02, speed: 400 }} style={{ flex: '1 1 300px', maxWidth: '400px' }}>\n                    <div className="glass-card" style={{ height: '100%' }}>`;
  studentContent = studentContent.replaceAll(oldCourseCard, newCourseCard);
  
  studentContent = studentContent.replaceAll('</div>\n                  ))', '</div>\n                  </Tilt>\n                  ))');
  
  fs.writeFileSync('src/app/student-dashboard/page.js', studentContent, 'utf8');
  console.log('Patched Student Dashboard');
}

// Test page
let testContent = fs.readFileSync('src/app/test/[id]/page.js', 'utf8');
if (!testContent.includes('react-confetti')) {
  testContent = testContent.replace("import { useState", "import Confetti from 'react-confetti';\nimport { useWindowSize } from 'react-use';\nimport { motion, AnimatePresence } from 'framer-motion';\nimport { useState");
  
  testContent = testContent.replace("const router = useRouter();", "const router = useRouter();\n  const { width, height } = useWindowSize();");
  
  const oldResultBlock = `<div className="glass-card text-center animate-fade-in" style={{ padding: '3rem 2rem' }}>`;
  const newResultBlock = `
        {score !== null && score >= test.questions.length / 2 && (
          <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />
        )}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="glass-card text-center" style={{ padding: '3rem 2rem' }}>`;
  testContent = testContent.replace(oldResultBlock, newResultBlock);
  testContent = testContent.replace('</div>\n      </div>\n    );\n  }\n', '</motion.div>\n      </div>\n    );\n  }\n');
  
  const oldQuestionBlock = `<div className="glass-card mb-6 animate-fade-in" style={{ padding: '2rem' }}>`;
  const newQuestionBlock = `<AnimatePresence mode="wait">
            <motion.div 
              key={currentQuestionIndex}
              initial={{ x: 50, opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: -50, opacity: 0 }} 
              transition={{ duration: 0.3 }}
              className="glass-card mb-6" 
              style={{ padding: '2rem' }}>`;
              
  testContent = testContent.replace(oldQuestionBlock, newQuestionBlock);
  testContent = testContent.replace('</div>\n          \n          <div style={{ display:', '</motion.div>\n          </AnimatePresence>\n          \n          <div style={{ display:');
  
  fs.writeFileSync('src/app/test/[id]/page.js', testContent, 'utf8');
  console.log('Patched Test Page');
}
