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

    // 1. Direct correct_option_id passed (0, 1, 2, 3)
    if (typeof question.correct_option_id === 'number' && question.correct_option_id >= 0 && question.correct_option_id < rawOptions.length) {
      correctIndex = question.correct_option_id;
    }

    // 2. Letter check (A, B, C, D)
    if (correctIndex === -1 && question.correct_letter) {
      const letUpper = String(question.correct_letter).trim().toUpperCase();
      if (letUpper === 'A' && rawOptions.length > 0) correctIndex = 0;
      else if (letUpper === 'B' && rawOptions.length > 1) correctIndex = 1;
      else if (letUpper === 'C' && rawOptions.length > 2) correctIndex = 2;
      else if (letUpper === 'D' && rawOptions.length > 3) correctIndex = 3;
    }

    // 3. Check correct_answer string
    if (correctIndex === -1 && question.correct_answer) {
      const ca = String(question.correct_answer).trim();
      const caUpper = ca.toUpperCase();
      
      // If correct_answer is just "A", "B", "C", "D" or "(A)", "(B)", etc.
      if ((caUpper === 'A' || caUpper === '(A)' || caUpper === 'A)' || caUpper === 'OPTION A') && rawOptions.length > 0) correctIndex = 0;
      else if ((caUpper === 'B' || caUpper === '(B)' || caUpper === 'B)' || caUpper === 'OPTION B') && rawOptions.length > 1) correctIndex = 1;
      else if ((caUpper === 'C' || caUpper === '(C)' || caUpper === 'C)' || caUpper === 'OPTION C') && rawOptions.length > 2) correctIndex = 2;
      else if ((caUpper === 'D' || caUpper === '(D)' || caUpper === 'D)' || caUpper === 'OPTION D') && rawOptions.length > 3) correctIndex = 3;
      
      if (correctIndex === -1) {
        // Exact match with raw option
        for (let i = 0; i < rawOptions.length; i++) {
          if (rawOptions[i].trim() === ca) {
            correctIndex = i;
            break;
          }
        }
      }

      if (correctIndex === -1) {
        // Clean prefixes like "A) ", "(A) ", "A. " from both sides and compare
        const cleanStr = (s) => s.replace(/^[\s(\[]*([A-Da-d]|[0-9]+)[\s)\]:.-]+/, '').trim().toLowerCase();
        const cleanCa = cleanStr(ca);
        if (cleanCa.length > 0) {
          for (let i = 0; i < rawOptions.length; i++) {
            const cleanOpt = cleanStr(rawOptions[i]);
            if (cleanOpt === cleanCa || (cleanCa.length > 3 && cleanOpt.includes(cleanCa)) || (cleanOpt.length > 3 && cleanCa.includes(cleanOpt))) {
              correctIndex = i;
              break;
            }
          }
        }
      }
    }

    if (correctIndex === -1 || correctIndex >= rawOptions.length) {
      correctIndex = 0; // fallback if completely unresolvable
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
