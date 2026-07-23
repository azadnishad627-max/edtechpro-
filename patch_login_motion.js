const fs = require('fs');

function addMotionToLogin(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  if (!content.includes('framer-motion')) {
    // Add imports
    const importStatement = `import { motion } from 'framer-motion';\nimport { Tilt } from 'react-tilt';\n`;
    content = content.replace("import { useState", importStatement + "import { useState");
    
    // Replace the main glass-card div with a motion.div and wrap it in Tilt
    const tiltOptions = `options={{ max: 15, scale: 1.02, speed: 400, glare: true, 'max-glare': 0.2 }}`;
    const motionProps = `initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut" }}`;
    
    // Wrap the glass-card
    content = content.replace(
      '<div className="glass-card"', 
      `<Tilt ${tiltOptions}>\n        <motion.div ${motionProps} className="glass-card"`
    );
    
    // Find the closing div of glass-card. This is tricky with regex, so we'll just replace the final closing tags of the component.
    // Instead of regex for closing div, we find the return statement structure.
    // The login pages return:
    // <div className="min-h-screen...">
    //   <div className="glass-card" style={...}>
    //      ... form ...
    //   </div>
    // </div>
    // Let's replace the last `</div>\n    </div>` with `</motion.div>\n      </Tilt>\n    </div>`
    
    content = content.replace(
      `</form>\n      </div>\n    </div>`,
      `</form>\n        </motion.div>\n      </Tilt>\n    </div>`
    );
    
    // Also add a subtle animated background class if not present
    if (content.includes('bg-[url(')) {
        // already has background
    } else {
        content = content.replace('className="min-h-screen flex items-center justify-center p-4"', 'className="min-h-screen flex items-center justify-center p-4 animated-gradient-bg"');
    }

    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Patched ' + filepath);
  }
}

addMotionToLogin('src/app/student-login/page.js');
addMotionToLogin('src/app/admin-login/page.js');
addMotionToLogin('src/app/student-setup/page.js');
