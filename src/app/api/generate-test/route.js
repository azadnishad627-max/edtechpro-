import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

const NVIDIA_KEY = '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';
const BYNARA_KEY = 'sk-nry-N9x2vinWSSErTHlfxxHd5nzXpTS_vUvq1mKThFcbUS4';

export async function POST(req) {
  try {
    const { topic, questionCount = 5, language = 'Hindi', imageUrl } = await req.json();

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required for generating questions." }, { status: 400 });
    }

    const count = parseInt(questionCount, 10) || 5;

    const systemPrompt = `You are a master question paper maker for Indian competitive & scholarship exams, specially NMMS (National Means Cum-Merit Scholarship) Class 8th MAT (Mental Ability Test) and Science/Maths.
Generate exactly ${count} multiple choice questions (MCQs) for the topic: "${topic}".
The questions, options, and step-by-step reasoning solutions MUST be written in ${language}.
Return ONLY a valid JSON array of objects. Do NOT include markdown code blocks like \`\`\`json or explanatory chat text.
Each object must have these exact keys:
- "question_text": The complete question in ${language}.
- "option_a": Option A text.
- "option_b": Option B text.
- "option_c": Option C text.
- "option_d": Option D text.
- "correct_answer": The exact full text of the correct option (e.g. value of option_a, option_b, option_c, or option_d).
- "explanation": Step-by-step reasoning logic explaining how to solve it in ${language}.`;

    // Construct user content (support both text and image if provided)
    let userMessageContent = `Generate ${count} high quality exam MCQs for "${topic}" in ${language}. Output JSON array only.`;

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
    let lastError = null;

    // --- ATTEMPT 1: NVIDIA Vision Model ---
    try {
      const nvRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NVIDIA_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta/llama-3.2-11b-vision-instruct',
          messages: messages,
          temperature: 0.5,
          max_tokens: 4096
        })
      });

      if (nvRes.ok) {
        const nvData = await nvRes.json();
        rawOutput = nvData.choices?.[0]?.message?.content || "";
      } else {
        const errText = await nvRes.text();
        console.error("NVIDIA API returned error:", nvRes.status, errText);
        lastError = new Error(`NVIDIA HTTP ${nvRes.status}: ${errText}`);
      }
    } catch (e) {
      console.error("NVIDIA call failed:", e.message);
      lastError = e;
    }

    // --- ATTEMPT 2: Fallback to Bynara Qwen 3.8 27B if NVIDIA fails ---
    if (!rawOutput) {
      try {
        console.log("Using Bynara Qwen3.8-27b as fallback...");
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
              { role: "user", content: `Generate ${count} questions on ${topic} in ${language}. Output JSON array only.` }
            ],
            temperature: 0.5,
            max_tokens: 4096
          })
        });

        if (byRes.ok) {
          const byData = await byRes.json();
          rawOutput = byData.choices?.[0]?.message?.content || "";
        } else {
          const errText = await byRes.text();
          throw new Error(`Bynara fallback failed (${byRes.status}): ${errText}`);
        }
      } catch (fbErr) {
        console.error("Fallback error:", fbErr.message);
        throw new Error(lastError?.message || fbErr.message);
      }
    }

    if (!rawOutput) {
      throw new Error("AI returned empty response.");
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
      console.error("Failed to parse JSON:", cleanJson);
      throw new Error(`Invalid JSON returned by AI: ${cleanJson.substring(0, 120)}...`);
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("AI did not return a valid list of questions.");
    }

    return NextResponse.json({ questions, count: questions.length });

  } catch (err) {
    console.error("Generate Test Route Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
