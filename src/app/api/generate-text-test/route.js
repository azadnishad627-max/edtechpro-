import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const NVIDIA_KEY = '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';
const BYNARA_KEY = 'sk-nry-N9x2vinWSSErTHlfxxHd5nzXpTS_vUvq1mKThFcbUS4';

export async function POST(req) {
  try {
    const { rawText, questionCount = 5, language = 'Hindi' } = await req.json();

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const count = parseInt(questionCount, 10) || 5;

    const systemPrompt = "You are an expert exam question paper maker.\n" +
      "Extract or generate exactly " + count + " multiple choice questions (MCQs) based strictly on the provided text.\n" +
      "The questions, options, and explanations MUST be written in " + language + ".\n" +
      "Return ONLY a valid JSON array of objects without markdown formatting or codeblocks.\n" +
      "Each object must have exactly these keys: 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'.\n" +
      "The 'correct_answer' MUST be the exact full text of the correct option.\n" +
      "The 'explanation' MUST be a detailed step-by-step reason explaining the solution.";

    let rawOutput = "";

    try {
      const nvRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${NVIDIA_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: 'meta/llama-3.2-11b-vision-instruct',
          messages: [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": "Here is the text:\n\n" + rawText }
          ],
          temperature: 0.5,
          max_tokens: 4096
        })
      });

      if (nvRes.ok) {
        const data = await nvRes.json();
        rawOutput = data.choices?.[0]?.message?.content || "";
      }
    } catch (e) {
      console.error("NVIDIA text-test error:", e.message);
    }

    if (!rawOutput) {
      const byRes = await fetch('https://router.bynara.id/v1/chat/completions', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${BYNARA_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: 'qwen3.8-27b',
          messages: [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": "Here is the text:\n\n" + rawText }
          ],
          temperature: 0.5,
          max_tokens: 4096
        })
      });
      if (byRes.ok) {
        const data = await byRes.json();
        rawOutput = data.choices?.[0]?.message?.content || "";
      }
    }

    if (!rawOutput) throw new Error("AI returned empty response");

    let cleanJson = rawOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    const match = cleanJson.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (match) cleanJson = match[0];

    const questions = JSON.parse(cleanJson);
    return NextResponse.json({ questions });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
