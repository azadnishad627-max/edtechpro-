import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { botToken, chatId, question } = await req.json();
    
    // Telegram Limits: Question max 300 chars, Options max 100 chars, Explanation max 200 chars.
    let questionText = question.question_text || "Question";
    if (questionText.length > 300) questionText = questionText.substring(0, 297) + "...";
    
    let explanationText = question.explanation || "";
    if (explanationText.length > 200) explanationText = explanationText.substring(0, 197) + "...";

    // question has { question_text, option_a, option_b, option_c, option_d, correct_answer, explanation }
    let rawOptions = [question.option_a, question.option_b, question.option_c, question.option_d];
    
    // Filter out null/undefined/empty string options
    rawOptions = rawOptions.filter(opt => opt && opt.trim() !== "");
    
    // Fallback if less than 2 options (Telegram requires at least 2)
    if (rawOptions.length === 0) rawOptions = ["Option A", "Option B"];
    if (rawOptions.length === 1) rawOptions.push("Option B");
    
    let correctIndex = -1;
    for (let i = 0; i < rawOptions.length; i++) {
        if (rawOptions[i] === question.correct_answer || rawOptions[i].includes(question.correct_answer)) {
            correctIndex = i;
            break;
        }
    }
    
    if (correctIndex === -1) {
       correctIndex = 0; // fallback just in case AI messes up the format
    }
    
    // Truncate options AFTER finding the correct index, so the match doesn't break
    const options = rawOptions.map(opt => {
        let text = opt || "Empty Option";
        if (text.length > 100) text = text.substring(0, 97) + "...";
        return text;
    });
    
    const payload = {
      chat_id: chatId,
      question: questionText,
      options: JSON.stringify(options),
      type: "quiz",
      correct_option_id: correctIndex,
      explanation: explanationText
    };

    const url = `https://api.telegram.org/bot${botToken}/sendPoll`;
    const res = await fetch(url, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (!data.ok) throw new Error(data.description);
    
    return NextResponse.json({ success: true, result: data.result });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
