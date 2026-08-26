import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const NVIDIA_KEY = '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';
const BYNARA_KEY = 'sk-nry-N9x2vinWSSErTHlfxxHd5nzXpTS_vUvq1mKThFcbUS4';

export async function POST(req) {
  try {
    const { topic, questionCount = 1, language = 'Hindi', imageUrl } = await req.json();

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required." }, { status: 400 });
    }

    const count = parseInt(questionCount, 10) || 1;

    const systemPrompt = "You are an expert exam question paper maker for Indian scholarship exams (NMMS Class 8th MAT & Science/Maths).\n" +
      "Create exactly " + count + " MCQ in " + language + " for topic: \"" + topic + "\".\n" +
      "Output strictly JSON array only: [{\"question_text\":\"...\",\"option_a\":\"...\",\"option_b\":\"...\",\"option_c\":\"...\",\"option_d\":\"...\",\"correct_answer\":\"...\",\"explanation\":\"...\"}].";

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

    // 1. Try NVIDIA Vision Model with 8s timeout to stay well under any Vercel limits
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

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
          max_tokens: Math.min(800, Math.max(260, count * 260))
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
          max_tokens: Math.min(800, Math.max(260, count * 260))
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

    // Clean JSON formatting
    let cleanJson = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) {
      cleanJson = match[0];
    }

    let questions = [];
    try {
      questions = JSON.parse(cleanJson);
    } catch (parseErr) {
      const singleMatch = cleanJson.match(/\{[\s\S]*\}/);
      if (singleMatch) {
        try {
          const singleQ = JSON.parse(singleMatch[0]);
          questions = [singleQ];
        } catch (e2) {}
      }
      if (questions.length === 0) {
        throw new Error("Could not parse questions from AI response.");
      }
    }

    // Normalize keys
    questions = questions.map(q => ({
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
