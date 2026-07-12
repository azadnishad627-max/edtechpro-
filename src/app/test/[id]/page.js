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

  useEffect(() => {
    async function fetchTest() {
      if (!id) return;
      const { data: testData } = await supabase.from('tests').select('*').eq('id', id).single();
      if (testData) setTest(testData);

      const { data: qData } = await supabase.from('questions').select('*').eq('test_id', id);
      if (qData) setQuestions(qData);
    }
    fetchTest();
  }, [id]);

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
    <div className="container py-4">
      <div className="flex justify-between align-center mb-4">
        <h2>{test.title}</h2>
        <span className="text-muted">Question {currentIdx + 1} of {questions.length}</span>
      </div>

      <div className="glass-card animate-fade-in mb-4">
        <h3 className="mb-4" style={{ fontSize: '1.25rem', lineHeight: '1.5' }}>{q.question_text}</h3>
        
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
  );
}
