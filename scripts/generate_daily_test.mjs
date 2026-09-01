import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("FATAL: Missing Supabase credentials.");
  console.error("SUPABASE_URL:", supabaseUrl ? "SET" : "MISSING");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseKey ? "SET" : "MISSING");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Initialize AI API
const KIRA_KEY = process.env.KIRA_API_KEY || process.env.KIRA || process.env.BYNARA_KEY;
if (!KIRA_KEY) {
  console.error("FATAL: Missing KIRA_API_KEY.");
  process.exit(1);
}

console.log("✅ All credentials loaded successfully.");

const AVAILABLE_MODELS = ['kira-auto', 'kira-mini-1.0', 'kira-2.0'];

// 3. Day & Topic Schedule
const now = new Date();
const dayOfWeek = now.getUTCDay(); // Use UTC since GitHub Actions runs in UTC

const schedule = {
  1: { subject: 'Science', qCount: 50 },
  2: { subject: 'History', qCount: 50 },
  3: { subject: 'Geography', qCount: 50 },
  4: { subject: 'Mental Ability (MAT)', qCount: 50 },
  5: { subject: 'Math', qCount: 50 },
  6: { subject: 'Combined Mega Test', qCount: 180 },
  0: { subject: 'Combined Mega Test', qCount: 180 }
};

const todayPlan = schedule[dayOfWeek];
const dateStr = now.toISOString().split('T')[0];
console.log(`📅 Day: ${dayOfWeek} | Subject: ${todayPlan.subject} | Questions: ${todayPlan.qCount} | Date: ${dateStr}`);

// 4. Helper: Extract JSON from AI response
function extractJSON(text) {
  if (!text) return [];
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error("JSON parse error:", e.message);
    }
  }
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // console.error("Fallback parse error:", e.message);
  }
  return [];
}

// 5. Helper: Generate a batch of questions with multi-model fallback
async function generateBatch(topic, count) {
  console.log(`🔄 Generating ${count} questions for "${topic}"...`);
  const seed = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  const systemPrompt = `You are an expert exam paper maker for NMMS (National Means Cum-Merit Scholarship) Class 8th exam.
Generate exactly ${count} Multiple Choice Questions (MCQs) for the topic: "${topic}".
ALL content MUST be strictly in Hindi language.
Return ONLY a valid raw JSON array of objects. Do NOT wrap in markdown or backticks.
Each object must have these exact fields:
- "question_text": Question in Hindi
- "option_a": Option A text
- "option_b": Option B text
- "option_c": Option C text
- "option_d": Option D text
- "correct_answer": Exact text of the correct option (must match one of option_a/b/c/d)
- "explanation": Short reasoning in Hindi
Seed: ${seed}`;

  for (const modelName of AVAILABLE_MODELS) {
    try {
      console.log(`   Trying model: ${modelName}...`);
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
            { role: "user", content: `Generate ${count} NMMS Class 8 MCQs in Hindi for "${topic}". Output JSON array only.` }
          ],
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`   ⚠️ Model ${modelName} returned status ${response.status}: ${errText.substring(0, 100)}`);
        continue; // try next model
      }

      const rawText = await response.text();
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (pe) {
        console.warn(`   ⚠️ Model ${modelName} returned non-JSON response (${rawText.substring(0, 80)}...)`);
        continue;
      }

      const content = data.choices?.[0]?.message?.content || '';
      if (content.length < 20) {
        console.warn(`   ⚠️ Model ${modelName} returned empty response content`);
        continue;
      }

      const questions = extractJSON(content);
      if (questions.length > 0) {
        console.log(`   ✅ Successfully parsed ${questions.length} questions using ${modelName}`);
        return questions;
      } else {
        console.warn(`   ⚠️ Failed to parse JSON array from ${modelName} output`);
      }

    } catch (err) {
      console.error(`   ❌ Error with model ${modelName}:`, err.message);
    }
  }

  return [];
}

// 6. Main Runner
async function run() {
  // Get Batch
  const { data: batches, error: batchErr } = await supabase.from('batches').select('id, title');
  if (batchErr) { console.error("Batch fetch error:", batchErr); process.exit(1); }
  if (!batches || batches.length === 0) { console.error("No batches found."); process.exit(1); }

  let targetBatch = batches.find(b => b.title.toLowerCase().includes('nmms'));
  if (!targetBatch) targetBatch = batches[0];
  console.log(`🎯 Batch: ${targetBatch.title} (${targetBatch.id})`);

  const BATCH_SIZE = 10;
  let allQuestions = [];
  let failures = 0;
  const MAX_FAILURES = 15;

  const megaSubjects = ['Science', 'History', 'Geography', 'Mental Ability (MAT)', 'Math'];

  while (allQuestions.length < todayPlan.qCount && failures < MAX_FAILURES) {
    const remaining = todayPlan.qCount - allQuestions.length;
    const batchCount = Math.min(BATCH_SIZE, remaining);

    let currentTopic = todayPlan.subject;
    if (todayPlan.qCount === 180) {
      const subjectIndex = Math.floor(allQuestions.length / 36) % megaSubjects.length;
      currentTopic = megaSubjects[subjectIndex];
    }

    const questions = await generateBatch(currentTopic, batchCount);

    if (questions.length > 0) {
      allQuestions = allQuestions.concat(questions);
      console.log(`📊 Progress: ${allQuestions.length}/${todayPlan.qCount}`);
      failures = 0;
    } else {
      failures++;
      console.log(`⚠️ Batch failed (${failures}/${MAX_FAILURES}). Retrying in 4s...`);
    }

    await new Promise(r => setTimeout(r, 4000));
  }

  console.log(`\n🏁 Generation complete: ${allQuestions.length} questions total`);

  if (allQuestions.length === 0) {
    console.error("FATAL: 0 questions generated. Aborting to avoid creating empty test.");
    process.exit(1);
  }

  // Delete old auto-tests FIRST
  const { data: oldTests } = await supabase.from('tests')
    .select('id, title')
    .eq('batch_id', targetBatch.id)
    .ilike('title', '%Daily Auto Test%');

  if (oldTests && oldTests.length > 0) {
    console.log(`🗑️ Deleting ${oldTests.length} old auto-test(s)...`);
    for (const ot of oldTests) {
      await supabase.from('questions').delete().eq('test_id', ot.id);
      await supabase.from('tests').delete().eq('id', ot.id);
      console.log(`  Deleted: ${ot.title}`);
    }
  }

  // Create new test
  const testTitle = `${todayPlan.subject} - Daily Auto Test (${dateStr})`;
  const { data: newTest, error: testError } = await supabase.from('tests').insert([{
    batch_id: targetBatch.id,
    title: testTitle,
    duration_mins: todayPlan.qCount === 180 ? 180 : 60,
    total_questions: allQuestions.length,
    start_time: now.toISOString()
  }]).select().single();

  if (testError || !newTest) {
    console.error("FATAL: Failed to create test:", testError);
    process.exit(1);
  }
  console.log(`✅ Test created in Supabase: "${newTest.title}" (ID: ${newTest.id})`);

  // Insert questions in chunks
  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < allQuestions.length; i += CHUNK) {
    const chunk = allQuestions.slice(i, i + CHUNK).map(q => {
      let correct = q.correct_answer || '';
      if (!correct || (![q.option_a, q.option_b, q.option_c, q.option_d].includes(correct))) {
        // Fallback matching if AI returned 'A', 'B', 'C', 'D'
        const cUpper = String(correct).trim().toUpperCase();
        if (cUpper === 'A' || cUpper === 'OPTION_A' || cUpper === 'OPTION A') correct = q.option_a || '';
        else if (cUpper === 'B' || cUpper === 'OPTION_B' || cUpper === 'OPTION B') correct = q.option_b || '';
        else if (cUpper === 'C' || cUpper === 'OPTION_C' || cUpper === 'OPTION C') correct = q.option_c || '';
        else if (cUpper === 'D' || cUpper === 'OPTION_D' || cUpper === 'OPTION D') correct = q.option_d || '';
        else correct = q.option_a || '';
      }

      return {
        test_id: newTest.id,
        question_text: q.question_text || 'प्रश्न उपलब्ध नहीं',
        option_a: q.option_a || 'विकल्प A',
        option_b: q.option_b || 'विकल्प B',
        option_c: q.option_c || 'विकल्प C',
        option_d: q.option_d || 'विकल्प D',
        correct_answer: correct
      };
    });

    console.log(`📤 Inserting chunk of ${chunk.length} questions into DB...`);
    const { data: insertedData, error: qError } = await supabase.from('questions').insert(chunk).select('id');
    
    if (qError) {
      console.error(`❌ Question batch insert error:`, JSON.stringify(qError));
      // Fallback single inserts
      for (const singleQ of chunk) {
        const { error: singleErr } = await supabase.from('questions').insert([singleQ]);
        if (!singleErr) {
          inserted++;
        }
      }
    } else {
      inserted += chunk.length;
      console.log(`📥 Inserted ${inserted}/${allQuestions.length} questions`);
    }
  }

  await supabase.from('tests').update({ total_questions: inserted }).eq('id', newTest.id);

  console.log(`\n🎉 AUTO-TEST COMPLETE!`);
  console.log(`   Title: ${testTitle}`);
  console.log(`   Questions Inserted: ${inserted}`);
  console.log(`   Batch: ${targetBatch.title}`);
  process.exit(0);
}

run().catch(err => {
  console.error("UNHANDLED ERROR:", err);
  process.exit(1);
});
