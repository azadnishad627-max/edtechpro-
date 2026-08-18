import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = "edge";

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
    const { rawText, questionCount, language = 'English' } = await req.json();

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const systemPrompt = `You are an expert educational test generator. The user has provided raw text extracted from a PDF.
Your task is to extract or generate exactly ${questionCount} multiple choice questions based STRICTLY and ONLY on the provided text. Do NOT invent general knowledge questions outside the text.
The questions, options, and explanations MUST be written in ${language}.
Return ONLY a valid JSON array of objects. Do not include markdown blocks like \`\`\`json.
Each object must have exactly these keys: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation".
The "correct_answer" MUST be the exact full text of the correct option (not just A/B/C/D).
The "explanation" MUST be a detailed step-by-step solution or reason explaining how to arrive at the correct answer based on the text.`;

    let aiResponse = "";
    let lastError = null;

    for (const config of API_CONFIGS) {
      try {
        const payload = {
          model: config.model,
          messages: [
            {"role": "system", "content": systemPrompt},
            {"role": "user", "content": `Here is the raw text:\n\n${rawText}`}
          ],
          temperature: 0.7,
          top_p: 0.95,
          max_tokens: 16384
        };

        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${config.key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
           const errText = await res.text();
           throw new Error(`API Error: ${res.status} ${errText}`);
        }

        const data = await res.json();
        aiResponse = data.choices?.[0]?.message?.content || "";
        if (aiResponse) break; // Success! Break the fallback loop
      } catch (err) {
        console.error(`Error with model ${config.model}:`, err.message);
        lastError = err;
      }
    }
    
    if (!aiResponse) {
      throw new Error(`All fallback APIs failed. Last error: ${lastError?.message}`);
    }

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
      if (!Array.isArray(questions)) {
         if (questions.questions && Array.isArray(questions.questions)) {
             questions = questions.questions;
         } else if (questions.data && Array.isArray(questions.data)) {
             questions = questions.data;
         } else {
             questions = [questions]; // Wrap it in an array if it returned a single question object
         }
      }
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
