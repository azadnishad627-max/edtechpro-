import { NextResponse } from 'next/server';
import { getSmartDiagramForQuestion } from '../../../lib/diagramGenerator';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';


const KIRA_KEY = process.env.KIRA_API_KEY || process.env.BYNARA_KEY;

function extractQuestionsFromAI(rawOutput) {
  let clean = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();

  // 1. Try JSON Array [ { ... } ]
  const arrayMatch = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      const parsed = JSON.parse(arrayMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }

  // 2. Try Single JSON Object { ... }
  const objMatch = clean.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]);
      if (parsed && (parsed.question_text || parsed.question)) return [parsed];
    } catch (e) {}
  }

  // 3. Bulletproof Regex Fallback (even if JSON is truncated or has trailing text)
  const qText = (clean.match(/"question_text"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || [])[1] ||
                (clean.match(/"question"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || [])[1];
  
  const optA = (clean.match(/"option_a"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || [])[1] || "A";
  const optB = (clean.match(/"option_b"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || [])[1] || "B";
  const optC = (clean.match(/"option_c"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || [])[1] || "C";
  const optD = (clean.match(/"option_d"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || [])[1] || "D";
  const ans = (clean.match(/"correct_answer"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || [])[1] || optA;
  const exp = (clean.match(/"explanation"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/i) || [])[1] || "";

  if (qText) {
    return [{
      question_text: qText.replace(/\\"/g, '"'),
      option_a: optA.replace(/\\"/g, '"'),
      option_b: optB.replace(/\\"/g, '"'),
      option_c: optC.replace(/\\"/g, '"'),
      option_d: optD.replace(/\\"/g, '"'),
      correct_answer: ans.replace(/\\"/g, '"'),
      explanation: exp.replace(/\\"/g, '"')
    }];
  }

  return [];
}

export async function POST(req) {
  try {
    const { topic, questionCount = 1, language = 'Hindi', imageUrl } = await req.json();

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const count = parseInt(questionCount, 10) || 1;

    const systemPrompt = `You are an expert exam paper maker for the official National Means-cum-Merit Scholarship (NMMS Class 8th MAT - Mental Ability Test in ${language}).
Create exactly ${count} multiple choice questions (MCQs) for the topic: "${topic}".

Format and Style instructions:
1. For visual / diagram reasoning topics (e.g. आकृति श्रृंखला/Figure Series, आकृति सादृश्यता/Analogy, अपूर्ण आकृति/Pattern Completion, ज्यामितीय वेन आरेख/Venn Diagram, लुप्त संख्या/Missing Number in Shapes, जल/दर्पण प्रतिबिंब/Water Reflection, संख्याओं का स्तूप/Number Pyramid, पासा/Dice):
   - Include standard official question instructions (e.g., "सूचना : प्रश्न आकृति को देखकर प्रश्न चिन्ह (?) के स्थान पर आने वाली सही उत्तर आकृति चुनिए।", or "सूचना : दी गई वेन आकृति में आयत, त्रिभुज और वृत्त को देखकर सही विकल्प चुनिए।", or "सूचना : नीचे दी गई संख्याओं का विशिष्ट स्तूप देखकर लुप्त पद ज्ञात कीजिए।").
   - Ensure options (A, B, C, D) are clearly labeled and match the standard official answer pattern.
2. The language MUST strictly be ${language}.
3. Return ONLY a valid JSON array of objects with keys: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation".`;

    const userMessageContent = `Create ${count} official NMMS MAT Class 8th MCQ in ${language} for topic "${topic}". Return JSON array only.`;

    let messages = [
      { role: "system", content: systemPrompt }
    ];

    if (imageUrl) {
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: userMessageContent }
        ]
      });
    } else {
      messages.push({
        role: "user",
        content: userMessageContent
      });
    }

    let rawOutput = "";

    try {
      const kiraRes = await fetch('https://kiraai.vn/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KIRA_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-v4-flash-free', // Kira API Model
          messages: messages,
          temperature: 0.2,
          max_tokens: Math.min(1200, Math.max(500, count * 500))
        })
      });
      
      if (!kiraRes.ok) {
        const errText = await kiraRes.text();
        throw new Error("AI generation failed: " + errText.substring(0, 100));
      }
      
      const kiraData = await kiraRes.json();
      rawOutput = kiraData.choices?.[0]?.message?.content || "";

      if (!rawOutput) {
        throw new Error("AI returned empty response.");
      }
    } catch(e) {
      throw new Error(e.message);
    }

    const rawQuestions = extractQuestionsFromAI(rawOutput);

    if (!rawQuestions || rawQuestions.length === 0) {
      console.error("Failed to parse AI output:", rawOutput);
      throw new Error("Could not parse questions from AI response.");
    }

    // Normalize keys & attach diagrams for reasoning/diagram questions
    const questions = rawQuestions.map(q => {
      let finalImg = q.image_url || q.image || null;
      if (!finalImg) {
        finalImg = getSmartDiagramForQuestion(topic, q.question_text || q.question || '');
      }

      return {
        question_text: q.question_text || q.question || "N/A",
        option_a: q.option_a || (q.options ? q.options[0] : "A"),
        option_b: q.option_b || (q.options ? q.options[1] : "B"),
        option_c: q.option_c || (q.options ? q.options[2] : "C"),
        option_d: q.option_d || (q.options ? q.options[3] : "D"),
        correct_answer: q.correct_answer || q.answer || q.option_a || "Option A",
        explanation: q.explanation || q.solution || "",
        image_url: finalImg || null
      };
    });

    return NextResponse.json({ questions, count: questions.length });

  } catch (err) {
    console.error("Generate Test Route Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
