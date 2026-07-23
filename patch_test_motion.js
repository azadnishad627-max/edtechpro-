const fs = require('fs');

let testContent = fs.readFileSync('src/app/test/[id]/page.js', 'utf8');
if (!testContent.includes('react-confetti')) {
  const importStatement = `import Confetti from 'react-confetti';\nimport { useWindowSize } from 'react-use';\nimport { motion, AnimatePresence } from 'framer-motion';\n`;
  testContent = testContent.replace("import { useState", importStatement + "import { useState");
  
  // Add useWindowSize inside the component
  testContent = testContent.replace("const router = useRouter();", "const router = useRouter();\n  const { width, height } = useWindowSize();");
  
  // Show confetti when submitted
  const oldResultBlock = `<div className="glass-card text-center animate-fade-in" style={{ padding: '3rem 2rem' }}>`;
  const newResultBlock = `
        {score !== null && score >= test.questions.length / 2 && (
          <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} />
        )}
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="glass-card text-center" style={{ padding: '3rem 2rem' }}>`;
  testContent = testContent.replace(oldResultBlock, newResultBlock);
  testContent = testContent.replace(/<\/div>\n      <\/div>\n    \);\n  }\n/g, '</motion.div>\n      </div>\n    );\n  }\n');
  
  // Animate questions using AnimatePresence
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
  testContent = testContent.replace(/<\/div>\n          \n          <div style={{ display/g, '</motion.div>\n          </AnimatePresence>\n          \n          <div style={{ display');
  
  fs.writeFileSync('src/app/test/[id]/page.js', testContent, 'utf8');
  console.log('Patched Test engine with Confetti and Framer Motion');
}
