import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const { message } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'paste_your_gemini_api_key_here') {
      return NextResponse.json({
        reply: "I am running in demo mode. Please set your GEMINI_API_KEY in the .env.local file to activate me!"
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = "You are an expert educational AI mentor. Help students understand concepts clearly and guide them instead of just giving direct answers. Keep answers relatively concise and friendly.";
    const fullPrompt = `${systemPrompt}\n\nStudent asks: ${message}`;

    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: fullPrompt,
    });
    
    if (interaction.output_text) {
      return NextResponse.json({ reply: interaction.output_text });
    } else if (interaction.steps) {
      const outputStep = interaction.steps.find(s => s.type === 'model_output');
      if (outputStep && outputStep.content && outputStep.content.length > 0) {
        return NextResponse.json({ reply: outputStep.content[0].text });
      }
    }
    
    return NextResponse.json({ reply: "I'm having trouble thinking right now. Please try again later." });

  } catch (error) {
    console.error("SDK Error:", error);
    return NextResponse.json({ reply: `API Error: ${error.message}` });
  }
}
