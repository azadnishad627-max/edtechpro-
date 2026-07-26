const fs = require('fs');

let testContent = fs.readFileSync('src/app/test/[id]/page.js', 'utf8');

// Find the index of `const handleLanguageSwitch`
const idx = testContent.indexOf('const handleLanguageSwitch =');
const topPart = testContent.slice(0, idx);

// Reconstruct the bottom part properly
const bottomPart = `const handleLanguageSwitch = async (lang) => {
    if (lang === language) return;
    setLanguage(lang);
    
    if (lang === 'hi' && !translatedQuestions) {
      setIsTranslating(true);
      try {
        const res = await fetch('/api/translate-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions })
        });
        const data = await res.json();
        if (data.translatedQuestions) {
          setTranslatedQuestions(data.translatedQuestions);
        } else if (data.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.error("Translation failed", err);
        alert("Failed to translate the test: " + err.message);
        setLanguage('en');
      }
      setIsTranslating(false);
    }
  };

  if (!test) return <div className="container py-4 text-center">Loading Test...</div>;
  if (questions.length === 0) return <div className="container py-4 text-center">No questions found for this test. Maybe they are still being generated!</div>;

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

  if (lockedUntil) {
    return (
      <div className="container py-4 text-center animate-fade-in" style={{ marginTop: '10vh' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem' }}>
          <h2 style={{ fontSize: '3rem', margin: '0 0 1rem 0' }}>🔒</h2>
          <h2 className="text-accent mb-4">Test Locked</h2>
          <p className="text-muted" style={{ lineHeight: '1.6', fontSize: '1.1rem' }}>
            You have recently submitted this test. To prevent spamming, you must wait 20 minutes before re-attempting the same test.
          </p>
          <div style={{ margin: '2rem 0', padding: '1rem', background: 'rgba(255, 23, 68, 0.1)', border: '1px solid #ff1744', borderRadius: '12px' }}>
            <strong style={{ color: '#ff1744' }}>Unlocks at: {lockedUntil.toLocaleTimeString()}</strong>
          </div>
          <button className="btn-primary" onClick={() => router.push('/student-dashboard')} style={{ width: '100%' }}>
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestions = language === 'hi' && translatedQuestions ? translatedQuestions : questions;
`;

// Find where `const currentQuestions` starts to replace properly
const currentQuestionsIdx = testContent.indexOf('const currentQuestions =');
const remainder = testContent.slice(currentQuestionsIdx + bottomPart.split('const currentQuestions =')[1].length);

fs.writeFileSync('src/app/test/[id]/page.js', topPart + bottomPart + remainder, 'utf8');
