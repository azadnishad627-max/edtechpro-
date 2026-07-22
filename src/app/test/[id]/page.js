"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';

export default function TakeTest() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [bookmarkedQs, setBookmarkedQs] = useState(new Set());
  const [studentInfo, setStudentInfo] = useState(null);

  const [language, setLanguage] = useState('en');
  const [translatedQuestions, setTranslatedQuestions] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    async function fetchTest() {
      if (!id) return;
      const { data: testData } = await supabase.from('tests').select('*').eq('id', id).single();
      if (testData) setTest(testData);

      // Only select fields needed for taking the test, DO NOT send correct_answer or explanation to client!
      const { data: qData } = await supabase.from('questions').select('id, test_id, question_text, option_a, option_b, option_c, option_d').eq('test_id', id);
      if (qData) setQuestions(qData);

      const sData = localStorage.getItem('studentInfo');
      if (sData) {
        const student = JSON.parse(sData);
        setStudentInfo(student);
        const { data: bData } = await supabase.from('bookmarks').select('question_id').eq('student_id', student.id);
        if (bData) {
          setBookmarkedQs(new Set(bData.map(b => b.question_id)));
        }
      }
    }
    fetchTest();
  }, [id]);

  const handleBookmark = async (questionId) => {
    if (!studentInfo) return;
    
    const isCurrentlyBookmarked = bookmarkedQs.has(questionId);
    
    if (isCurrentlyBookmarked) {
      const { error } = await supabase.from('bookmarks').delete().eq('student_id', studentInfo.id).eq('question_id', questionId);
      if (!error) {
        const newSet = new Set(bookmarkedQs);
        newSet.delete(questionId);
        setBookmarkedQs(newSet);
      }
    } else {
      const { error } = await supabase.from('bookmarks').insert([{ student_id: studentInfo.id, question_id: questionId }]);
      if (!error) {
        const newSet = new Set(bookmarkedQs);
        newSet.add(questionId);
        setBookmarkedQs(newSet);
      }
    }
  };

  const handleSelect = (option) => {
    setAnswers({ ...answers, [currentIdx]: option });
  };

  const handleSubmit = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/evaluate-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: id, answers })
      });
      const data = await res.json();
      if (data.results) {
        setEvaluationData(data);
        setIsSubmitted(true);
      } else {
        throw new Error(data.error || 'Failed to verify test answers');
      }
    } catch (err) {
      alert("Error evaluating test: " + err.message);
    }
    setIsEvaluating(false);
  };

  const handleLanguageSwitch = async (lang) => {
    if (lang === language) return;
    setLanguage(lang);
    
    if (lang === 'hi' && !translatedQuestions) {
      setIsTranslating(true);
      try {
        const res = await fetch('/api/translate-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questions, targetLanguage: 'Hindi' })
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

  const currentQuestions = language === 'hi' && translatedQuestions ? translatedQuestions : questions;

  if (isSubmitted && evaluationData) {
    return (
      <div className="container py-4 animate-fade-in">
        <div className="flex justify-between align-center mb-4">
          <h1 className="mb-4">Test Completed!</h1>
        </div>

        <div className="glass-card mb-4 text-center" style={{ padding: '2rem' }}>
          <h2 className="text-accent" style={{ fontSize: '3rem' }}>{evaluationData.score} / {evaluationData.total}</h2>
          <p className="text-muted mt-2">Your Score</p>
          <button className="btn-primary mt-4" onClick={() => router.push('/student-dashboard')}>Back to Dashboard</button>
        </div>

        <h3 className="mb-4">Answer Key & Explanations</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {evaluationData.results.map((q, idx) => {
            const isCorrect = q.isCorrect;
            const userAnswer = q.userAnswer;
            const actualCorrect = q.actualCorrect;
            
            // Try to match translated question if available
            const displayQText = currentQuestions[idx]?.question_text || q.question_text;

            return (
              <div key={idx} className="glass-card" style={{ borderLeft: `4px solid ${isCorrect ? '#00e676' : '#ff1744'}` }}>
                <h4 style={{ marginBottom: '1rem' }}>Q{idx + 1}. {displayQText}</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey, optIdx) => {
                    // Display text (might be translated) vs logic text
                    const displayOptText = currentQuestions[idx]?.[optKey] || q[optKey];
                    const originalOptText = q[optKey];
                    
                    const isUserSelection = userAnswer === originalOptText;
                    const isActualCorrect = actualCorrect === originalOptText;
                    
                    let bg = 'rgba(255,255,255,0.05)';
                    let border = '1px solid var(--glass-border)';
                    if (isActualCorrect) {
                      bg = 'rgba(0, 230, 118, 0.1)';
                      border = '1px solid #00e676';
                    } else if (isUserSelection && !isCorrect) {
                      bg = 'rgba(255, 23, 68, 0.1)';
                        border = '1px solid #ff1744';
                      }

                      return (
                        <div key={optKey} style={{ padding: '0.8rem 1rem', borderRadius: '8px', background: bg, border: border, display: 'flex', justifyContent: 'space-between' }}>
                          <span><strong style={{ color: isActualCorrect ? '#00e676' : 'var(--accent)', marginRight: '10px' }}>{String.fromCharCode(65 + optIdx)}.</strong> {optText}</span>
                          {isActualCorrect && <span style={{ color: '#00e676', fontWeight: 'bold', flexShrink: 0, marginLeft: '1rem' }}>✓ Correct</span>}
                          {isUserSelection && !isActualCorrect && <span style={{ color: '#ff1744', fontWeight: 'bold', flexShrink: 0, marginLeft: '1rem' }}>✗ Your Answer</span>}
                        </div>
                      )
                    })}
                  </div>

                  {q.explanation && (
                    <div style={{ padding: '1rem', background: 'rgba(0, 229, 255, 0.05)', borderRadius: '8px', border: '1px solid rgba(0, 229, 255, 0.2)' }}>
                      <strong className="text-accent">Solution / Explanation:</strong>
                      <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{q.explanation}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      </div>
    );
  }

  const q = currentQuestions[currentIdx];
  const originalQ = questions[currentIdx];

  return (
    <div className="container py-4">
        <div className="flex justify-between align-center mb-4">
        <h2>{test.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '8px', display: 'flex', gap: '0.2rem', border: '1px solid var(--glass-border)' }}>
            <button 
              onClick={() => handleLanguageSwitch('en')} 
              style={{ background: language === 'en' ? 'var(--primary-color)' : 'transparent', color: language === 'en' ? '#0a0a0a' : 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: language === 'en' ? 'bold' : 'normal', transition: 'all 0.3s' }}
            >
              English
            </button>
            <button 
              onClick={() => handleLanguageSwitch('hi')} 
              style={{ background: language === 'hi' ? 'var(--primary-color)' : 'transparent', color: language === 'hi' ? '#0a0a0a' : 'white', border: 'none', padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: language === 'hi' ? 'bold' : 'normal', transition: 'all 0.3s' }}
            >
              Hindi
            </button>
          </div>
          <span className="text-muted mobile-hide">Question {currentIdx + 1} of {questions.length}</span>
        </div>
      </div>

      {isTranslating ? (
        <div className="glass-card animate-fade-in mb-4 text-center py-5">
          <p className="text-accent" style={{ fontSize: '1.2rem' }}>अनुवाद किया जा रहा है... (Translating to Hindi...)</p>
          <div style={{ marginTop: '1rem', width: '30px', height: '30px', border: '3px solid var(--primary-color)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }}></div>
        </div>
      ) : (
        <div className="glass-card animate-fade-in mb-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', lineHeight: '1.5', margin: 0 }}>Q{currentIdx + 1}. {q.question_text}</h3>
          <button 
            onClick={() => handleBookmark(q.id)}
            title={bookmarkedQs.has(q.id) ? "Remove Bookmark" : "Save for Revision"}
            style={{ 
              background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', 
              color: bookmarkedQs.has(q.id) ? '#ffd700' : 'var(--text-muted)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {bookmarkedQs.has(q.id) ? '⭐' : '☆'}
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey, optIdx) => {
            const originalOptText = originalQ[optKey];
            const translatedOptText = q[optKey];
            return (
              <button 
                key={optKey} 
                onClick={() => handleSelect(originalOptText)}
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  textAlign: 'left', 
                  padding: '1rem', 
                  marginBottom: '0.5rem', 
                  background: answers[currentIdx] === originalOptText ? 'rgba(0, 229, 255, 0.1)' : 'rgba(255,255,255,0.05)', 
                  border: answers[currentIdx] === originalOptText ? '1px solid var(--primary-color)' : '1px solid var(--glass-border)', 
                  borderRadius: '8px', 
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: '0.2s',
                  fontSize: '1.1rem'
                }}
              >
                <strong style={{ color: 'var(--accent)', marginRight: '10px' }}>{String.fromCharCode(65 + optIdx)}.</strong> {translatedOptText}
              </button>
            )
          })}
        </div>
      </div>
      )}

      <div className="flex justify-between">
        <button 
          className="btn-outline" 
          disabled={currentIdx === 0} 
          onClick={() => setCurrentIdx(prev => prev - 1)}
        >
          Previous
        </button>
        
        {currentIdx === questions.length - 1 ? (
          <button className="btn-primary" onClick={handleSubmit}>Submit Test</button>
        ) : (
          <button className="btn-primary" onClick={() => setCurrentIdx(prev => prev + 1)}>Next</button>
        )}
      </div>
    </div>
  );
}
