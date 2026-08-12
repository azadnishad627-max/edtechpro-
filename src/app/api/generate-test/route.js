import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge'; // Use Edge Runtime to increase timeout limit on Hobby
export const maxDuration = 60; // Has no effect on hobby edge, but good for pro

export async function POST(req) {
  try {
    const { topic, questionCount, language = 'English' } = await req.json();
    const apiKey = process.env.NVIDIA_API_KEY || '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';

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const systemPrompt = `You are an expert educational test generator. Generate exactly ${questionCount} multiple choice questions about "${topic}".
The questions, options, and explanations MUST be written in ${language}.
Return ONLY a valid JSON array of objects. Do not include markdown blocks like \`\`\`json.
Each object must have exactly these keys: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation".
The "correct_answer" MUST be the exact full text of the correct option (not just A/B/C/D).
The "explanation" MUST be a detailed step-by-step solution or reason explaining how to arrive at the correct answer.
Make sure the JSON output is perfectly formatted and valid.`;

    const completion = await openai.chat.completions.create({
      model: "nvidia/nemotron-3.5-lightning-30b-a3b",
      messages: [
        {"role": "system", "content": systemPrompt},
        {"role": "user", "content": `Generate ${questionCount} questions on ${topic} in ${language}.`}
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: 16384,
      extra_body: {
        chat_template_kwargs: { "enable_thinking": false }
      }
    });
    
    let aiResponse = completion.choices[0]?.message?.content || "";

    if (!aiResponse) throw new Error("AI returned empty response");

    // Clean up markdown blocks if the AI disobeyed
    aiResponse = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();
    // Sometimes it includes reasoning output if enable_thinking was somehow on, but we didn't enable it for json.
    
    // Attempt to extract json array if there is conversational text
    const jsonMatch = aiResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      aiResponse = jsonMatch[0];
    }

    let questions;
    try {
      questions = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Failed to parse JSON:", aiResponse);
      throw new Error(`Failed to parse AI JSON response. AI output snippet: ${aiResponse.substring(0, 100)}...`);
    }

    return NextResponse.json({ questions });

  } catch (error) {
    console.error("AI Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
