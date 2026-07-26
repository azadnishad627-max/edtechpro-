const fs = require('fs');

let testContent = fs.readFileSync('src/app/test/[id]/page.js', 'utf8');

if (!testContent.includes('const [isTooEarly, setIsTooEarly]')) {
  // Add state variables
  testContent = testContent.replace(
    "const [proctorLockTimer, setProctorLockTimer] = useState(0);",
    "const [proctorLockTimer, setProctorLockTimer] = useState(0);\n  const [isTooEarly, setIsTooEarly] = useState(false);\n  const [isTooLate, setIsTooLate] = useState(false);"
  );
  
  // Add the strict timing useEffect
  const timingEffect = `
  useEffect(() => {
    if (!test || isSubmitted) return;
    
    const checkTime = () => {
      const now = new Date();
      if (test.start_time) {
        const start = new Date(test.start_time);
        if (now < start) {
          setIsTooEarly(true);
          return;
        } else {
          setIsTooEarly(false);
        }
      }
      if (test.end_time) {
        const end = new Date(test.end_time);
        if (now >= end && !isSubmitted && !isEvaluating) {
          setIsTooLate(true);
          handleSubmit();
        }
      }
    };
    
    checkTime();
    const interval = setInterval(checkTime, 10000);
    return () => clearInterval(interval);
  }, [test, isSubmitted, isEvaluating]);
`;

  testContent = testContent.replace(
    "const handleFaceStatus = (isFacePresent) => {",
    timingEffect + "\n  const handleFaceStatus = (isFacePresent) => {"
  );
  
  // Add rendering for Too Early
  const tooEarlyBlock = `
  if (isTooEarly) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6 pt-20 flex flex-col items-center justify-center animated-gradient-bg">
        <div className="glass-card text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-yellow-400 mb-4">Test Not Started Yet</h2>
          <p className="mb-4">This test is scheduled to start at: <br/><strong>{new Date(test.start_time).toLocaleString()}</strong></p>
          <button className="btn-secondary" onClick={() => router.push('/student-dashboard')}>Go Back</button>
        </div>
      </div>
    );
  }
`;

  testContent = testContent.replace(
    "if (!test || questions.length === 0) return <div className=\"min-h-screen flex items-center justify-center pt-20\">Loading test...</div>;",
    "if (!test || questions.length === 0) return <div className=\"min-h-screen flex items-center justify-center pt-20 text-white\">Loading test...</div>;\n" + tooEarlyBlock
  );

  fs.writeFileSync('src/app/test/[id]/page.js', testContent, 'utf8');
  console.log('Patched test page for strict scheduling');
} else {
  console.log('Test page already patched');
}
