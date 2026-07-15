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
  const [score, setScore] = useState(0);
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

      const { data: qData } = await supabase.from('questions').select('*').eq('test_id', id);
      if (qData) setQuestions(qData);

      const sData = localStorage.getItem('studentInfo');
      if (sData) {
        const student = JSON.parse(sData);
        setStudentInfo(student);
        // Fetch existing bookmarks for this student in this test (or generally)
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
      // Remove bookmark
      const { error } = await supabase.from('bookmarks').delete().eq('student_id', studentInfo.id).eq('question_id', questionId);
      if (!error) {
        const newSet = new Set(bookmarkedQs);
        newSet.delete(questionId);
        setBookmarkedQs(newSet);
      }
    } else {
      // Add bookmark
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

  const handleSubmit = () => {
    let s = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) s++;
    });
    setScore(s);
    setIsSubmitted(true);
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

  if (isSubmitted) {
    return (
      <div className="container py-4 text-center animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '60vh', justifyContent: 'center' }}>
        <h1 className="mb-4">Test Completed!</h1>
        <div className="glass-card mb-4" style={{ padding: '3rem' }}>
          <h2 className="text-accent" style={{ fontSize: '3rem' }}>{score} / {questions.length}</h2>
          <p className="text-muted mt-2">Your Score</p>
        </div>
        <button className="btn-primary" onClick={() => router.push('/student-dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const currentQuestions = language === 'hi' && translatedQuestions ? translatedQuestions : questions;
  const q = currentQuestions[currentIdx];

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
          <h3 style={{ fontSize: '1.25rem', lineHeight: '1.5', margin: 0 }}>{q.question_text}</h3>
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
          {['option_a', 'option_b', 'option_c', 'option_d'].map((optKey, idx) => {
            const val = q[optKey];
            const isSelected = answers[currentIdx] === val;
            return (
              <button 
                key={optKey} 
                onClick={() => handleSelect(val)}
                style={{ 
                  textAlign: 'left', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  border: isSelected ? '2px solid var(--accent)' : '1px solid var(--glass-border)',
                  background: isSelected ? 'rgba(0, 229, 255, 0.1)' : 'var(--bg-dark)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <strong style={{ color: 'var(--accent)', marginRight: '10px' }}>{String.fromCharCode(65 + idx)}.</strong> {val}
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
