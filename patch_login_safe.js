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
}

// Function to exactly replace in file
function replaceInFile(filepath, target, replacement) {
    let content = fs.readFileSync(filepath, 'utf8');
    if(content.includes(target)) {
        content = content.replace(target, replacement);
        fs.writeFileSync(filepath, content, 'utf8');
    }
}

// Student Login
let sLoginTarget = `      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
        <h2 className="text-center mb-6 text-2xl">Student Login</h2>`;
let sLoginReplacement = `      <Tilt options={{ max: 15, scale: 1.02, speed: 400, glare: true, 'max-glare': 0.2 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
        <h2 className="text-center mb-6 text-2xl">Student Login</h2>`;
replaceInFile('src/app/student-login/page.js', sLoginTarget, sLoginReplacement);
replaceInFile('src/app/student-login/page.js', `        </form>\n      </div>\n    </div>`, `        </form>\n        </motion.div>\n      </Tilt>\n    </div>`);
replaceInFile('src/app/student-login/page.js', `import { useState`, `import { motion } from 'framer-motion';\nimport { Tilt } from 'react-tilt';\nimport { useState`);
replaceInFile('src/app/student-login/page.js', `className="min-h-screen flex items-center justify-center p-4"`, `className="min-h-screen flex items-center justify-center p-4 animated-gradient-bg"`);

// Admin Login
let aLoginTarget = `      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
        <h2 className="text-center mb-6 text-2xl">Admin Login</h2>`;
let aLoginReplacement = `      <Tilt options={{ max: 15, scale: 1.02, speed: 400, glare: true, 'max-glare': 0.2 }}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem' }}>
        <h2 className="text-center mb-6 text-2xl">Admin Login</h2>`;
replaceInFile('src/app/admin-login/page.js', aLoginTarget, aLoginReplacement);
replaceInFile('src/app/admin-login/page.js', `        </form>\n      </div>\n    </div>`, `        </form>\n        </motion.div>\n      </Tilt>\n    </div>`);
replaceInFile('src/app/admin-login/page.js', `import { useState`, `import { motion } from 'framer-motion';\nimport { Tilt } from 'react-tilt';\nimport { useState`);
replaceInFile('src/app/admin-login/page.js', `className="min-h-screen flex items-center justify-center p-4"`, `className="min-h-screen flex items-center justify-center p-4 animated-gradient-bg"`);

console.log('Login pages patched');
