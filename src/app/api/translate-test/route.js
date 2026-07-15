import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { questions, targetLanguage } = await req.json();
    const langCode = targetLanguage.toLowerCase().startsWith('hi') ? 'hi' : 'en';

    if (langCode === 'en') {
      return NextResponse.json({ translatedQuestions: questions });
    }

    const keysToTranslate = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
    const allStrings = [];
    
    questions.forEach(q => {
      keysToTranslate.forEach(key => {
        allStrings.push(q[key] || " ");
      });
    });

    const DELIMITER = ' ~|~ ';
    const joinedText = allStrings.join(DELIMITER);

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'q=' + encodeURIComponent(joinedText)
    });

    if (!res.ok) {
      throw new Error("Google Translate returned status " + res.status);
    }

    const data = await res.json();
    const translatedJoinedText = data[0].map(x => x[0]).join('');
    
    // Split by the delimiter (Google might add spaces around it)
    const translatedArray = translatedJoinedText.split(/\s*~\|~\s*/);

    if (translatedArray.length < allStrings.length) {
      console.error("Mismatch: array lengths differ", translatedArray.length, allStrings.length);
      // Fallback: return original questions to prevent crashing the UI
      return NextResponse.json({ translatedQuestions: questions });
    }

    let strIdx = 0;
    const translatedQuestions = questions.map(q => {
      const translatedQ = { ...q };
      keysToTranslate.forEach(key => {
        if (q[key]) {
          translatedQ[key] = translatedArray[strIdx]?.trim() || q[key];
        }
        strIdx++;
      });
      return translatedQ;
    });

    return NextResponse.json({ translatedQuestions });

  } catch (error) {
    console.error("Translation Error:", error);
    return NextResponse.json({ error: error.message || "Failed to translate test" }, { status: 500 });
  }
}
