"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import Script from 'next/script';

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

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement({
          pageLanguage: 'en',
          includedLanguages: 'en,hi',
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
      }
    };
  }, []);

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

  const handleLanguageSwitch = (lang) => {
    setLanguage(lang);
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    } else {
      console.warn("Google Translate widget not ready yet");
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

  const q = questions[currentIdx];

  return (
    <>
      <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="lazyOnload" />
      <div id="google_translate_element" style={{ display: 'none' }}></div>
      <div className="container py-4">
        <div className="flex justify-between align-center mb-4">
          <h2>{test.title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem', borderRadius: '8px', display: 'flex', gap: '0.2rem', border: '1px solid var(--glass-border)' }}>
            <button 
              onClick={() => handleLanguageSwitch('en')} 
              style={{ padding: '0.4rem 1rem', background: language === 'en' ? 'var(--primary-color)' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem', fontWeight: language === 'en' ? 'bold' : 'normal' }}
            >
              English
            </button>
            <button 
              onClick={() => handleLanguageSwitch('hi')} 
              style={{ padding: '0.4rem 1rem', background: language === 'hi' ? 'var(--primary-color)' : 'transparent', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer', transition: '0.2s', fontSize: '0.9rem', fontWeight: language === 'hi' ? 'bold' : 'normal' }}
            >
              हिंदी
            </button>
          </div>
          <span className="text-muted mobile-hide">Question {currentIdx + 1} of {questions.length}</span>
        </div>
      </div>

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
    </>
  );
}
