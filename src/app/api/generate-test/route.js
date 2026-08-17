import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';
export const maxDuration = 60;

const API_CONFIGS = [
  {
    key: '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',
    model: 'nvidia/ising-calibration-1.5-31b'
  },
  {
    key: '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',
    model: 'google/gemma-4-31b-it'
  },
  {
    key: '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',
    model: 'nvidia/nemotron-3.5-lightning-30b-a3b'
  }
];

export async function POST(req) {
  try {
    const { topic, questionCount, language = 'English' } = await req.json();

    const systemPrompt = `You are an expert educational test generator. Generate exactly ${questionCount} multiple choice questions about "${topic}".
The questions, options, and explanations MUST be written in ${language}.
Return ONLY a valid JSON array of objects. Do not include markdown blocks like \`\`\`json.
Each object must have exactly these keys: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation".
The "correct_answer" MUST be the exact full text of the correct option (not just A/B/C/D).
The "explanation" MUST be a detailed step-by-step solution or reason explaining how to arrive at the correct answer.
Make sure the JSON output is perfectly formatted and valid.`;

    let completion = null;
    let lastError = null;

    for (const config of API_CONFIGS) {
      try {
        const openai = new OpenAI({
          apiKey: config.key,
          baseURL: 'https://integrate.api.nvidia.com/v1',
        });
        
        completion = await openai.chat.completions.create({
          model: config.model,
          messages: [
            {"role": "system", "content": systemPrompt},
            {"role": "user", "content": `Generate ${questionCount} questions on ${topic} in ${language}.`}
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 16384
        });
        
        break; // Success! Break the fallback loop
      } catch (err) {
        console.error(`Error with model ${config.model}:`, err.message);
        lastError = err;
      }
    }
    
    if (!completion) {
      throw new Error(`All fallback APIs failed. Last error: ${lastError?.message}`);
    }

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
      throw new Error(`Failed to parse AI JSON response. AI output snippet: ${aiResponse.substring(0, 100)}...`);
    }

    return NextResponse.json({ questions });
    
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
