import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { botToken, chatId, question } = await req.json();
    
    // Clean and sanitize chatId (handles @username, numeric -100..., or https://t.me/username URLs)
    let cleanChatId = String(chatId || '').trim();
    cleanChatId = cleanChatId.replace(/[./\s]+$/, ''); // remove trailing dot/slashes/spaces
    cleanChatId = cleanChatId.replace(/^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\//i, '@');
    if (!cleanChatId.startsWith('@') && !cleanChatId.startsWith('-') && isNaN(Number(cleanChatId)) && cleanChatId.length > 0) {
      cleanChatId = '@' + cleanChatId;
    }

    // Telegram Limits: Question max 300 chars, Options max 100 chars, Explanation max 200 chars.
    let questionText = question.question_text || "Question";
    if (questionText.length > 300) questionText = questionText.substring(0, 297) + "...";
    
    let explanationText = question.explanation || "";
    if (explanationText.length > 200) explanationText = explanationText.substring(0, 197) + "...";

    // Build options array from the 4 options
    let rawOptions = [question.option_a, question.option_b, question.option_c, question.option_d];
    
    // Track original positions so we know which index maps to which letter
    // This is critical: if an option is empty and gets filtered out, the indices shift
    let optionMap = []; // [{originalIndex: 0, text: "..."}, ...]
    for (let i = 0; i < rawOptions.length; i++) {
      if (rawOptions[i] && rawOptions[i].trim() !== "") {
        optionMap.push({ originalIndex: i, text: rawOptions[i] });
      }
    }
    
    // Fallback if less than 2 options (Telegram requires at least 2)
    if (optionMap.length === 0) optionMap = [{ originalIndex: 0, text: "Option A" }, { originalIndex: 1, text: "Option B" }];
    if (optionMap.length === 1) optionMap.push({ originalIndex: 1, text: "Option B" });
    
    // === ANSWER KEY VERIFICATION ===
    // Priority 1: correct_option_id (0-3) - Most trustworthy source
    // Priority 2: correct_letter ('A','B','C','D') - Map letter to original index
    // We NEVER do fuzzy string matching which caused wrong answers before
    
    let targetOriginalIndex = -1; // The original 0-3 index (A=0, B=1, C=2, D=3)
    
    // 1. Use correct_option_id if it is a valid number
    if (typeof question.correct_option_id === 'number' && question.correct_option_id >= 0 && question.correct_option_id <= 3) {
      targetOriginalIndex = question.correct_option_id;
    }
    
    // 2. Fallback: use correct_letter if correct_option_id was not set
    if (targetOriginalIndex === -1 && question.correct_letter) {
      const letUpper = String(question.correct_letter).trim().toUpperCase();
      if (letUpper === 'A') targetOriginalIndex = 0;
      else if (letUpper === 'B') targetOriginalIndex = 1;
      else if (letUpper === 'C') targetOriginalIndex = 2;
      else if (letUpper === 'D') targetOriginalIndex = 3;
    }
    
    // 3. Last resort: try to extract letter from correct_answer string like "(B)" or "B"
    if (targetOriginalIndex === -1 && question.correct_answer) {
      const ca = String(question.correct_answer).trim().toUpperCase();
      const letterMatch = ca.match(/^[\s(\[]*([A-D])[\s)\].:;,\-]*/);
      if (letterMatch) {
        const letter = letterMatch[1];
        if (letter === 'A') targetOriginalIndex = 0;
        else if (letter === 'B') targetOriginalIndex = 1;
        else if (letter === 'C') targetOriginalIndex = 2;
        else if (letter === 'D') targetOriginalIndex = 3;
      }
    }
    
    // Default fallback to 0 (Option A) if nothing resolved
    if (targetOriginalIndex === -1) {
      targetOriginalIndex = 0;
    }
    
    // Now find the ACTUAL index in the filtered optionMap array
    // This handles the case where empty options were removed and indices shifted
    let correctIndex = 0; // Default to first option
    for (let i = 0; i < optionMap.length; i++) {
      if (optionMap[i].originalIndex === targetOriginalIndex) {
        correctIndex = i;
        break;
      }
    }
    
    // Truncate options for Telegram (max 100 chars each)
    const options = optionMap.map(opt => {
      let text = opt.text || "Empty Option";
      if (text.length > 100) text = text.substring(0, 97) + "...";
      return text;
    });
    
    // Add verification info to explanation
    const letterNames = ['A', 'B', 'C', 'D'];
    const verifiedLetter = letterNames[targetOriginalIndex] || '?';
    const verifiedExplanation = explanationText 
      ? `\u2705 Ans: (${verifiedLetter}) | ${explanationText}`
      : `\u2705 Correct Answer: (${verifiedLetter})`;
    
    const finalExplanation = verifiedExplanation.length > 200 
      ? verifiedExplanation.substring(0, 197) + "..." 
      : verifiedExplanation;
    
    const payload = {
      chat_id: cleanChatId,
      question: questionText,
      options: JSON.stringify(options),
      type: "quiz",
      correct_option_id: correctIndex,
      explanation: finalExplanation,
      is_anonymous: true
    };

    const url = `https://api.telegram.org/bot${botToken}/sendPoll`;
    const res = await fetch(url, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (!data.ok) throw new Error(data.description);
    
    return NextResponse.json({ 
      success: true, 
      result: data.result,
      debug: {
        verified_correct_letter: verifiedLetter,
        correct_option_id_sent: correctIndex,
        total_options: options.length
      }
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
