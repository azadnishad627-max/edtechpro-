import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";

export async function POST(req) {
  try {
    const { message, imageBase64, mimeType } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'paste_your_gemini_api_key_here') {
      return NextResponse.json({
        reply: "I am running in demo mode. Please set your GEMINI_API_KEY in the .env.local file to activate me!"
      });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = "You are an expert educational AI mentor and an advanced homework solver. Your goal is to help students understand concepts clearly. If the student uploads an image of a question, scan it, extract the problem, and provide a 100% correct, step-by-step solution. Be encouraging and clear.";
    
    const inputContent = [];
    inputContent.push({ type: 'text', text: `${systemPrompt}\n\nStudent says: ${message || ''}` });
    
    if (imageBase64) {
      inputContent.push({ type: 'text', text: "\n[Attached Image for analysis]" });
      inputContent.push({
        type: 'image',
        data: imageBase64.split(',')[1] || imageBase64,
        mime_type: mimeType || 'image/jpeg'
      });
    }

    const interaction = await ai.interactions.create({
      model: "gemini-3.5-flash",
      input: inputContent,
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
