import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { botToken, chatId, question } = await req.json();
    
    // question has { question_text, option_a, option_b, option_c, option_d, correct_answer, explanation }
    const options = [question.option_a, question.option_b, question.option_c, question.option_d];
    
    let correctIndex = -1;
    for (let i = 0; i < options.length; i++) {
        // use includes or exact match, AI sometimes includes letters
        if (options[i] === question.correct_answer || options[i].includes(question.correct_answer)) {
            correctIndex = i;
            break;
        }
    }
    
    if (correctIndex === -1) {
       correctIndex = 0; // fallback just in case AI messes up the format
    }
    
    const payload = {
      chat_id: chatId,
      question: question.question_text,
      options: JSON.stringify(options),
      type: "quiz",
      correct_option_id: correctIndex,
      explanation: question.explanation || ""
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
