import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import PDFParser from 'pdf2json';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf');
    const questionCount = formData.get('questionCount');
    
    if (!file) {
      return NextResponse.json({ error: "No PDF file uploaded" }, { status: 400 });
    }

    // Convert file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF using pdf2json
    const extractedText = await new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(this, 1); // 1 = raw text content
      pdfParser.on("pdfParser_dataError", errData => reject(new Error(errData.parserError)));
      pdfParser.on("pdfParser_dataReady", () => {
          resolve(pdfParser.getRawTextContent());
      });
      pdfParser.parseBuffer(buffer);
    });

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract any text from the PDF. Make sure it's not a scanned image." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are an expert educational test generator. The user has provided text extracted from a PDF containing questions and answers.
Your task is to extract exactly ${questionCount} multiple choice questions from this text.
Return ONLY a valid JSON array of objects. Do not include markdown blocks like \`\`\`json.
Each object must have exactly these keys: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer".
The "correct_answer" MUST be the exact full text of the correct option (not just A/B/C/D).
If the PDF doesn't contain exactly ${questionCount} questions, extract as many as you can up to that number.

Here is the text extracted from the PDF:
====================
${extractedText}
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
    console.error("PDF Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
