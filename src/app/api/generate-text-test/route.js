import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
  try {
    const { rawText, questionCount } = await req.json();
    const apiKey = process.env.NVIDIA_API_KEY || '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';

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
    }

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const systemPrompt = `You are an expert educational test generator. The user has provided raw text containing questions and an answer key.
Your task is to extract exactly ${questionCount} multiple choice questions from this text.
Return ONLY a valid JSON array of objects. Do not include markdown blocks like \`\`\`json.
Each object must have exactly these keys: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation".
The "correct_answer" MUST be the exact full text of the correct option (not just A/B/C/D).
The "explanation" MUST be a detailed step-by-step solution or reason explaining how to arrive at the correct answer.
If the text doesn't contain exactly ${questionCount} questions, extract as many as you can up to that number.`;

    const userPrompt = `Here is the raw text:\n====================\n${rawText}\n====================`;

    const completion = await openai.chat.completions.create({
      model: "nvidia/nemotron-3.5-lightning-30b-a3b",
      messages: [
        {"role": "system", "content": systemPrompt},
        {"role": "user", "content": userPrompt}
      ],
      temperature: 0.3,
      top_p: 0.95,
      max_tokens: 16384,
    });
    
    let aiResponse = completion.choices[0]?.message?.content || "";

    if (!aiResponse) throw new Error("AI returned empty response");

    // Clean up markdown blocks if the AI disobeyed
    aiResponse = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();

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
      throw new Error("Failed to parse AI JSON response");
    }

    return NextResponse.json({ questions });

  } catch (error) {
    console.error("Text Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
