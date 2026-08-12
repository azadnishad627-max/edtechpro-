import { NextResponse } from 'next/server';
import OpenAI from 'openai';
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

    const apiKey = process.env.NVIDIA_API_KEY || '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';
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 401 });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const systemPrompt = `You are an expert educational test generator. The user has provided text extracted from a PDF containing questions and answers.
Your task is to extract exactly ${questionCount} multiple choice questions from this text.
  Return ONLY a valid JSON array of objects. Do not include markdown blocks like \`\`\`json.
  Each object must have exactly these keys: "question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation".
  The "correct_answer" MUST be the exact full text of the correct option (not just A/B/C/D).
  The "explanation" MUST be a detailed step-by-step solution or reason explaining how to arrive at the correct answer.
  If the PDF doesn't contain exactly ${questionCount} questions, extract as many as you can up to that number.`;

    const userPrompt = `Here is the text extracted from the PDF:\n====================\n${extractedText}\n====================`;

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
    console.error("PDF Gen Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
