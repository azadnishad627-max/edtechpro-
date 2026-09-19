import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { questionId, selectedOption } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: 'Missing questionId' }, { status: 400 });
    }

    const { data: question, error } = await supabase
      .from('questions')
      .select('id, correct_answer, option_a, option_b, option_c, option_d')
      .eq('id', questionId)
      .single();

    if (error || !question) {
      return NextResponse.json({ isCorrect: false });
    }

    let actualCorrect = (question.correct_answer || '').trim();
    const rawUpper = actualCorrect.toUpperCase();

    if (rawUpper === 'A' || rawUpper === '(A)' || rawUpper === 'OPTION A') actualCorrect = question.option_a || '';
    else if (rawUpper === 'B' || rawUpper === '(B)' || rawUpper === 'OPTION B') actualCorrect = question.option_b || '';
    else if (rawUpper === 'C' || rawUpper === '(C)' || rawUpper === 'OPTION C') actualCorrect = question.option_c || '';
    else if (rawUpper === 'D' || rawUpper === '(D)' || rawUpper === 'OPTION D') actualCorrect = question.option_d || '';

    const cleanStr = (s) => (s || '').toString().replace(/^[\s(\[]*([A-Da-d]|[0-9]+)[\s)\]:.-]+/, '').trim().toLowerCase();

    const uTrim = (selectedOption || '').toString().trim();
    const aTrim = actualCorrect.trim();
    let isCorrect = false;

    if (uTrim && aTrim) {
      if (uTrim.toLowerCase() === aTrim.toLowerCase()) {
        isCorrect = true;
      } else if (cleanStr(uTrim) === cleanStr(aTrim) && cleanStr(uTrim).length > 0) {
        isCorrect = true;
      }
    }

    return NextResponse.json({
      isCorrect,
      actualCorrect
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
