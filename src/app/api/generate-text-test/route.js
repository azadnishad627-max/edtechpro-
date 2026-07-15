import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const { rawText, questionCount } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
    }

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert educational test generator. The user has provided raw text containing questions and an answer key.
Your task is to extract exactly ${questionCount} multiple choice questions from this text.
Return ONLY a valid JSON array of objects. Do not include markdown blocks like \`\`\`json.
Each object must have exactly these keys: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation".
The "correct_answer" MUST be the exact full text of the correct option (not just A/B/C/D).
The "explanation" MUST be a detailed step-by-step solution or reason explaining how to arrive at the correct answer.
If the text doesn't contain exactly ${questionCount} questions, extract as many as you can up to that number.

Here is the raw text:
====================
${rawText}
====================`;

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
    console.error("Text Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
