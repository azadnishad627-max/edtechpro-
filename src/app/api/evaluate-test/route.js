import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function POST(req) {
  try {
    const { testId, answers } = await req.json();

    if (!testId || !answers) {
      return NextResponse.json({ error: 'Missing testId or answers' }, { status: 400 });
    }

    // Fetch full questions from the database including correct_answer and explanation
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('test_id', testId)
      .order('id', { ascending: true }); // Ensure ordering matches client side if they were ordered (client didn't order explicitly, so let's just fetch them)

    if (error) {
      throw error;
    }

    let score = 0;
    const evaluatedResults = questions.map((q) => {
      let actualCorrect = (q.correct_answer || '').trim();
      if (actualCorrect.toUpperCase() === 'A') actualCorrect = q.option_a;
      else if (actualCorrect.toUpperCase() === 'B') actualCorrect = q.option_b;
      else if (actualCorrect.toUpperCase() === 'C') actualCorrect = q.option_c;
      else if (actualCorrect.toUpperCase() === 'D') actualCorrect = q.option_d;

      const userAnswer = answers[q.id] || null;
      const isCorrect = userAnswer === actualCorrect;
      
      if (isCorrect) {
        score++;
      }

      return {
        question_id: q.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        userAnswer,
        actualCorrect,
        isCorrect,
        explanation: q.explanation
      };
    });

    return NextResponse.json({
      score,
      total: questions.length,
      results: evaluatedResults
    });

  } catch (err) {
    console.error('Error evaluating test:', err);
    return NextResponse.json({ error: 'Failed to evaluate test' }, { status: 500 });
  }
}
