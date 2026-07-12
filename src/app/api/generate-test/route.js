import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const { topic, questionCount } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert educational test generator. Generate ${questionCount} multiple choice questions about "${topic}".
Return ONLY a valid JSON array of objects. Do not include markdown blocks like \`\`\`json.
Each object must have exactly these keys: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer".
The "correct_answer" MUST be the exact full text of the correct option (not just A/B/C/D).`;

    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: systemPrompt,
    });
    
    let aiResponse = "";
    if (interaction.output_text) {
      aiResponse = interaction.output_text;
    } else if (interaction.steps) {
      const outputStep = interaction.steps.find(s => s.type === 'model_output');
      if (outputStep && outputStep.content && outputStep.content.length > 0) {
        aiResponse = outputStep.content[0].text;
      }
    }

    if (!aiResponse) throw new Error("AI returned empty response");

    // Clean up markdown blocks if the AI disobeyed
    aiResponse = aiResponse.replace(/```json/gi, "").replace(/```/g, "").trim();

    let questions;
    try {
      questions = JSON.parse(aiResponse);
    } catch (e) {
      console.error("Failed to parse JSON:", aiResponse);
      throw new Error("Failed to parse AI JSON response");
    }

    return NextResponse.json({ questions });

  } catch (error) {
    console.error("AI Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
