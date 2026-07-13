import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { message, imageBase64, mimeType } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'paste_your_gemini_api_key_here') {
      return NextResponse.json({
        reply: "I am running in demo mode. Please set your GEMINI_API_KEY in the .env.local file to activate me!"
      });
    }

    const systemInstruction = {
      role: "user",
      parts: [
        { text: "You are an expert educational AI mentor and an advanced homework solver. Your goal is to help students understand concepts clearly. If the student uploads an image of a question, scan it, extract the problem, and provide a 100% correct, step-by-step solution. Be encouraging and clear." }
      ]
    };

    const userParts = [];
    if (message) {
      userParts.push({ text: message });
    } else if (imageBase64) {
      userParts.push({ text: "Please solve the question in this image step by step." });
    }

    if (imageBase64) {
      userParts.push({
        inlineData: {
          data: imageBase64.split(',')[1] || imageBase64,
          mimeType: mimeType || 'image/jpeg'
        }
      });
    }

    const requestBody = {
      contents: [
        systemInstruction,
        { role: "user", parts: userParts }
      ],
      generationConfig: {
        temperature: 0.2
      }
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return NextResponse.json({ reply: `AI Error: ${data.error?.message || 'Failed to generate response'}` });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (replyText) {
      return NextResponse.json({ reply: replyText });
    }
    
    return NextResponse.json({ reply: "I'm having trouble thinking right now. Please try again later." });

  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ reply: `Server Error: ${error.message}` });
  }
}
