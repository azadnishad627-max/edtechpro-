import { NextResponse } from 'next/server';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';


const KIRA_KEY = process.env.KIRA_API_KEY || process.env.BYNARA_KEY;

export async function POST(req) {
  try {
      const kiraRes = await fetch('https://kiraai.vn/api/v1/chat/completions', {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${KIRA_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: 'kira-auto',
          messages: [
            { "role": "system", "content": systemPrompt },
            { "role": "user", "content": "Here is the text:\n\n" + rawText }
          ],
          temperature: 0.2,
          max_tokens: Math.min(1500, count * 500)
        })
      });

      if (!kiraRes.ok) {
        const errText = await kiraRes.text();
        throw new Error("AI generation failed: " + errText.substring(0, 100));
      }
      
      const kiraData = await kiraRes.json();
      rawOutput = kiraData.choices?.[0]?.message?.content || "";

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
