import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const NVIDIA_KEY = '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';
const BYNARA_KEY = 'sk-nry-N9x2vinWSSErTHlfxxHd5nzXpTS_vUvq1mKThFcbUS4';

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

    const systemPrompt = "You are an expert exam question paper maker for Indian scholarship exams (NMMS Class 8th MAT & Science/Maths).\n" +
      "Create exactly " + count + " multiple choice questions in " + language + " for topic: \"" + topic + "\".\n" +
      "Return ONLY a JSON array of objects with keys: \"question_text\", \"option_a\", \"option_b\", \"option_c\", \"option_d\", \"correct_answer\", \"explanation\".";

    const userMessageContent = "Create " + count + " MCQ for " + topic + " in " + language + ". Output JSON array only.";

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

    // 1. Try NVIDIA Vision Model
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 14000);

      const nvRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta/llama-3.2-11b-vision-instruct',
          messages: messages,
          temperature: 0.2,
          max_tokens: Math.min(1200, Math.max(500, count * 500))
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (nvRes.ok) {
        const nvData = await nvRes.json();
        rawOutput = nvData.choices?.[0]?.message?.content || "";
      }
    } catch (e) {
      console.warn("NVIDIA attempt timed out or failed, using Bynara fallback:", e.message);
    }

    // 2. Fallback to Bynara Qwen3.8-27b if NVIDIA fails or times out
    if (!rawOutput) {
      const byRes = await fetch('https://router.bynara.id/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BYNARA_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen3.8-27b',
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessageContent }
          ],
          temperature: 0.3,
          max_tokens: Math.min(1200, Math.max(500, count * 500))
        })
      });

      if (byRes.ok) {
        const byData = await byRes.json();
        rawOutput = byData.choices?.[0]?.message?.content || "";
      } else {
        const errText = await byRes.text();
        throw new Error("AI generation failed (" + byRes.status + "): " + errText.substring(0, 100));
      }
    }

    if (!rawOutput) {
      throw new Error("AI returned empty response. Please try again.");
    }

    const rawQuestions = extractQuestionsFromAI(rawOutput);

    if (!rawQuestions || rawQuestions.length === 0) {
      console.error("Failed to parse AI output:", rawOutput);
      throw new Error("Could not parse questions from AI response.");
    }

    // Normalize keys
    const questions = rawQuestions.map(q => ({
      question_text: q.question_text || q.question || "N/A",
      option_a: q.option_a || (q.options ? q.options[0] : "A"),
      option_b: q.option_b || (q.options ? q.options[1] : "B"),
      option_c: q.option_c || (q.options ? q.options[2] : "C"),
      option_d: q.option_d || (q.options ? q.options[3] : "D"),
      correct_answer: q.correct_answer || q.answer || q.option_a || "Option A",
      explanation: q.explanation || q.solution || ""
    }));

    return NextResponse.json({ questions, count: questions.length });

  } catch (err) {
    console.error("Generate Test Route Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
