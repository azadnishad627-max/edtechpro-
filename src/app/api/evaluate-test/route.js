import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { testId, answers, student_id } = await req.json();

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
    const cleanStr = (s) => (s || '').toString().replace(/^[\s(\[]*([A-Da-d]|[0-9]+)[\s)\]:.-]+/, '').trim().toLowerCase();

    const evaluatedResults = questions.map((q) => {
      let actualCorrect = (q.correct_answer || '').trim();
      const rawAnsUpper = actualCorrect.toUpperCase();
      
      if (rawAnsUpper === 'A' || rawAnsUpper === '(A)' || rawAnsUpper === 'A)') actualCorrect = q.option_a || '';
      else if (rawAnsUpper === 'B' || rawAnsUpper === '(B)' || rawAnsUpper === 'B)') actualCorrect = q.option_b || '';
      else if (rawAnsUpper === 'C' || rawAnsUpper === '(C)' || rawAnsUpper === 'C)') actualCorrect = q.option_c || '';
      else if (rawAnsUpper === 'D' || rawAnsUpper === '(D)' || rawAnsUpper === 'D)') actualCorrect = q.option_d || '';

      const userAnswer = answers[q.id] || null;
      let isCorrect = false;

      if (userAnswer && actualCorrect) {
        const uTrim = userAnswer.toString().trim();
        const aTrim = actualCorrect.toString().trim();
        const uUpper = uTrim.toUpperCase();

        if (uTrim.toLowerCase() === aTrim.toLowerCase()) {
          isCorrect = true;
        } else if (uUpper === 'A' && (aTrim === q.option_a || cleanStr(aTrim) === cleanStr(q.option_a))) {
          isCorrect = true;
        } else if (uUpper === 'B' && (aTrim === q.option_b || cleanStr(aTrim) === cleanStr(q.option_b))) {
          isCorrect = true;
        } else if (uUpper === 'C' && (aTrim === q.option_c || cleanStr(aTrim) === cleanStr(q.option_c))) {
          isCorrect = true;
        } else if (uUpper === 'D' && (aTrim === q.option_d || cleanStr(aTrim) === cleanStr(q.option_d))) {
          isCorrect = true;
        } else if (cleanStr(uTrim) === cleanStr(aTrim) && cleanStr(uTrim).length > 0) {
          isCorrect = true;
        }
      }
      
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

    if (student_id) {
      const { error: insertError } = await supabase.from('test_attempts').insert([{
        student_id,
        test_id: testId,
        score,
        total_questions: questions.length
      }]);
      if (insertError) {
        console.error('Error saving test attempt:', insertError);
      }
    }

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
