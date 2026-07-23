const fs = require('fs');

let testContent = fs.readFileSync('src/app/test/[id]/page.js', 'utf8');

if (!testContent.includes('react-confetti')) {
  testContent = testContent.replace("import { useEffect, useState } from 'react';", "import { useEffect, useState } from 'react';\nimport Confetti from 'react-confetti';\nimport { useWindowSize } from 'react-use';\nimport { motion, AnimatePresence } from 'framer-motion';");
  fs.writeFileSync('src/app/test/[id]/page.js', testContent, 'utf8');
  console.log('Added missing imports to test page');
} else {
  console.log('Imports already exist');
}
