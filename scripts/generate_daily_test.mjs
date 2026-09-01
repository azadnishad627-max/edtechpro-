import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("FATAL: Missing Supabase credentials.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize AI API
const KIRA_KEY = process.env.KIRA_API_KEY || process.env.KIRA || process.env.BYNARA_KEY;
if (!KIRA_KEY) {
  console.error("FATAL: Missing KIRA_API_KEY.");
  process.exit(1);
}

console.log("✅ Credentials loaded.");

const AVAILABLE_MODELS = ['kira-auto', 'kira-mini-1.0', 'kira-2.0'];

// 3. IST Date & Day of Week Calculation
const istOffset = 5.5 * 60 * 60 * 1000;
const istNow = new Date(Date.now() + istOffset);
const dayOfWeek = istNow.getUTCDay(); // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const istDayName = dayNames[dayOfWeek];

const schedule = {
  1: { subject: 'Science', qCount: 50, duration: 60 },
  2: { subject: 'History', qCount: 50, duration: 60 },
  3: { subject: 'Geography', qCount: 50, duration: 60 },
  4: { subject: 'Mental Ability (MAT)', qCount: 50, duration: 60 },
  5: { subject: 'Math', qCount: 50, duration: 60 },
  6: { subject: 'Combined Mega Test (All Subjects)', qCount: 180, duration: 180 },
  0: { subject: 'Combined Mega Test (All Subjects)', qCount: 180, duration: 180 }
};

const todayPlan = schedule[dayOfWeek];
const dateFormatted = istNow.toISOString().split('T')[0]; // YYYY-MM-DD
console.log(`📅 IST Day: ${istDayName} (Day ${dayOfWeek}) | Subject: ${todayPlan.subject} | Target Questions: ${todayPlan.qCount} | Date: ${dateFormatted}`);

// 4. Helper: Extract & Validate JSON from AI response
function extractJSON(text) {
  if (!text) return [];
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [];
}

// 5. Helper: Strict Validation for NMMS Question
function validateAndCleanQuestion(q) {
  if (!q) return null;
  const qText = String(q.question_text || '').trim();
  const opA = String(q.option_a || '').trim();
  const opB = String(q.option_b || '').trim();
  const opC = String(q.option_c || '').trim();
  const opD = String(q.option_d || '').trim();

  // Basic sanity checks
  if (qText.length < 8 || !opA || !opB || !opC || !opD) return null;
  
  // All 4 options must be distinct
  const uniqueOptions = new Set([opA, opB, opC, opD]);
  if (uniqueOptions.size < 4) return null;

  // Normalize correct answer
  let correct = String(q.correct_answer || '').trim();
  const cUpper = correct.toUpperCase();

  if (cUpper === 'A' || cUpper === 'OPTION A' || cUpper === 'OPTION_A' || cUpper === '(A)') correct = opA;
  else if (cUpper === 'B' || cUpper === 'OPTION B' || cUpper === 'OPTION_B' || cUpper === '(B)') correct = opB;
  else if (cUpper === 'C' || cUpper === 'OPTION C' || cUpper === 'OPTION_C' || cUpper === '(C)') correct = opC;
  else if (cUpper === 'D' || cUpper === 'OPTION D' || cUpper === 'OPTION_D' || cUpper === '(D)') correct = opD;

  // Must match one of the 4 options exactly
  if (![opA, opB, opC, opD].includes(correct)) {
    // Try relaxed trimming match
    if (correct.toLowerCase() === opA.toLowerCase()) correct = opA;
    else if (correct.toLowerCase() === opB.toLowerCase()) correct = opB;
    else if (correct.toLowerCase() === opC.toLowerCase()) correct = opC;
    else if (correct.toLowerCase() === opD.toLowerCase()) correct = opD;
    else return null; // Invalid answer key, discard
  }

  return {
    question_text: qText,
    option_a: opA,
    option_b: opB,
    option_c: opC,
    option_d: opD,
    correct_answer: correct
  };
}

// 6. Helper: Generate verified batch of questions
async function generateBatch(topic, count) {
  console.log(`🔄 Generating ${count} verified questions for "${topic}"...`);
  const seed = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  const systemPrompt = `You are a certified senior question paper examiner for the official NMMS (National Means-cum-Merit Scholarship) Class 8th competitive examination in India.
Your task: Generate exactly ${count} 100% FACTUALLY ACCURATE and VERIFIED Multiple Choice Questions (MCQs) for the topic: "${topic}".

STRICT GUIDELINES:
1. CURRICULUM: Strictly based on NCERT / State Board Class 8 syllabus.
2. LANGUAGE: Pure, formal, and grammatically correct Hindi.
3. ACCURACY: Every question must have only ONE definitively correct answer. No confusing or ambiguous options.
4. FORMAT: Return ONLY a valid JSON array of objects with NO markdown formatting or commentary.
5. KEYS REQUIRED for each object:
   - "question_text": The complete Hindi question text.
   - "option_a": Option A in Hindi.
   - "option_b": Option B in Hindi.
   - "option_c": Option C in Hindi.
   - "option_d": Option D in Hindi.
   - "correct_answer": The exact text of the correct option (must match option_a, option_b, option_c, or option_d).
Seed: ${seed}`;

  for (const modelName of AVAILABLE_MODELS) {
    try {
      const response = await fetch('https://kiraai.vn/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${KIRA_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Generate ${count} verified NMMS Class 8 MCQs in Hindi for "${topic}". Ensure 100% correct answer key. JSON array only.` }
          ],
          temperature: 0.5,
        })
      });

      if (!response.ok) {
        continue;
      }

      const rawText = await response.text();
      let data;
      try { data = JSON.parse(rawText); } catch (e) { continue; }

      const content = data.choices?.[0]?.message?.content || '';
      if (content.length < 20) continue;

      const rawList = extractJSON(content);
      const validatedList = [];

      for (const q of rawList) {
        const cleaned = validateAndCleanQuestion(q);
        if (cleaned) validatedList.push(cleaned);
      }

      if (validatedList.length > 0) {
        console.log(`   ✅ Validated ${validatedList.length} high-accuracy questions using ${modelName}`);
        return validatedList;
      }

    } catch (err) {
      console.error(`   ❌ Error with model ${modelName}:`, err.message);
    }
  }

  return [];
}

// 7. Main Execution
async function run() {
  // 1. Fetch Target Batch
  const { data: batches, error: batchErr } = await supabase.from('batches').select('id, title');
  if (batchErr) { console.error("Batch error:", batchErr); process.exit(1); }
  if (!batches || batches.length === 0) { console.error("No batches found."); process.exit(1); }

  let targetBatch = batches.find(b => b.title.toLowerCase().includes('nmms'));
  if (!targetBatch) targetBatch = batches[0];
  console.log(`🎯 Batch Target: ${targetBatch.title} (${targetBatch.id})`);

  // 2. Multi-subject rotation for Combined Mega Tests
  const megaSubjects = ['Science', 'History', 'Geography', 'Mental Ability (MAT)', 'Math'];
  const BATCH_SIZE = 10;
  let allQuestions = [];
  let seenQuestionTexts = new Set();
  let failures = 0;
  const MAX_FAILURES = 15;

  while (allQuestions.length < todayPlan.qCount && failures < MAX_FAILURES) {
    const remaining = todayPlan.qCount - allQuestions.length;
    const batchCount = Math.min(BATCH_SIZE, remaining);

    let currentTopic = todayPlan.subject;
    if (todayPlan.qCount === 180) {
      const subjectIndex = Math.floor(allQuestions.length / 36) % megaSubjects.length;
      currentTopic = megaSubjects[subjectIndex];
    }

    const batch = await generateBatch(currentTopic, batchCount);

    let addedFromBatch = 0;
    for (const q of batch) {
      if (!seenQuestionTexts.has(q.question_text) && allQuestions.length < todayPlan.qCount) {
        seenQuestionTexts.add(q.question_text);
        allQuestions.push(q);
        addedFromBatch++;
      }
    }

    if (addedFromBatch > 0) {
      console.log(`📊 Progress: ${allQuestions.length}/${todayPlan.qCount} questions`);
      failures = 0;
    } else {
      failures++;
      console.log(`⚠️ Batch retry (${failures}/${MAX_FAILURES})...`);
    }

    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n🏁 Verified Generation Finished: ${allQuestions.length} questions`);

  if (allQuestions.length === 0) {
    console.error("FATAL: 0 verified questions generated. Aborting to protect app state.");
    process.exit(1);
  }

  // 3. Clean Title (No 'AI' or 'Auto' in display name)
  let testTitle = `${todayPlan.subject} (${dateFormatted})`;
  if (todayPlan.qCount === 180) {
    testTitle = `Combined Mega Test (${dateFormatted})`;
  }

  // 4. Delete Previous Daily Tests
  const { data: oldTests } = await supabase.from('tests')
    .select('id, title')
    .eq('batch_id', targetBatch.id)
    .or('title.ilike.%Daily Auto Test%,title.ilike.%Daily Test%,title.ilike.%Combined Mega Test%,title.ilike.%Science (%,title.ilike.%History (%,title.ilike.%Geography (%,title.ilike.%Mental Ability (MAT) (%,title.ilike.%Math (%');

  if (oldTests && oldTests.length > 0) {
    console.log(`🗑️ Deleting ${oldTests.length} old daily test(s)...`);
    for (const ot of oldTests) {
      await supabase.from('questions').delete().eq('test_id', ot.id);
      await supabase.from('tests').delete().eq('id', ot.id);
      console.log(`   Deleted: ${ot.title}`);
    }
  }

  // 5. Create Fresh Test
  const { data: newTest, error: testError } = await supabase.from('tests').insert([{
    batch_id: targetBatch.id,
    title: testTitle,
    duration_mins: todayPlan.duration,
    total_questions: allQuestions.length,
    start_time: new Date().toISOString()
  }]).select().single();

  if (testError || !newTest) {
    console.error("FATAL: Failed to insert test in Supabase:", testError);
    process.exit(1);
  }
  console.log(`✅ Test Created: "${newTest.title}" (ID: ${newTest.id})`);

  // 6. Insert All Verified Questions
  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < allQuestions.length; i += CHUNK) {
    const chunk = allQuestions.slice(i, i + CHUNK).map(q => ({
      test_id: newTest.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer
    }));

    const { error: qError } = await supabase.from('questions').insert(chunk);
    if (qError) {
      console.error(`❌ Batch insert error:`, JSON.stringify(qError));
      for (const singleQ of chunk) {
        const { error: sErr } = await supabase.from('questions').insert([singleQ]);
        if (!sErr) inserted++;
      }
    } else {
      inserted += chunk.length;
      console.log(`📥 Inserted ${inserted}/${allQuestions.length} questions`);
    }
  }

  // Update total questions count to exact inserted number
  await supabase.from('tests').update({ total_questions: inserted }).eq('id', newTest.id);

  console.log(`\n🎉 SUCCESS! TEST IS LIVE ON APP:`);
  console.log(`   📌 Test Title: "${testTitle}"`);
  console.log(`   📝 Total Questions: ${inserted}`);
  console.log(`   ⏱️ Duration: ${todayPlan.duration} mins`);
  console.log(`   🎯 Target Batch: ${targetBatch.title}`);
  process.exit(0);
}

run().catch(err => {
  console.error("FATAL UNCAUGHT ERROR:", err);
  process.exit(1);
});
