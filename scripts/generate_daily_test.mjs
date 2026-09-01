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

const AI_MODEL = 'kira-auto';

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
const dateStr = now.toISOString().split('T')[0]; // e.g. 2026-09-01
console.log(`📅 Day: ${dayOfWeek} | Subject: ${todayPlan.subject} | Questions: ${todayPlan.qCount} | Date: ${dateStr}`);

// 4. Helper: Extract JSON from AI response
function extractJSON(text) {
  if (!text) return [];
  // Remove markdown code blocks
  let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  // Try to find JSON array
  const match = clean.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      console.error("JSON parse error:", e.message);
    }
  }
  // Fallback: try parsing the whole thing
  try {
    const parsed = JSON.parse(clean);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.error("Fallback JSON parse error:", e.message);
  }
  return [];
}

// 5. Helper: Generate a batch of questions
async function generateBatch(topic, count) {
  console.log(`🔄 Generating ${count} questions for "${topic}"...`);
  const seed = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);

  const systemPrompt = `You are a master question paper maker for NMMS (National Means Cum-Merit Scholarship) Class 8th Indian exam.
Generate exactly ${count} MCQs for: "${topic}".
ALL content MUST be in Hindi language.
Return ONLY a raw JSON array (NO markdown, NO code blocks, NO extra text).
Each object MUST have these keys:
"question_text", "option_a", "option_b", "option_c", "option_d", "correct_answer", "explanation"
The "correct_answer" must be the exact text of one of the four options.
Unique seed: ${seed}`;

  try {
    const response = await fetch('https://kiraai.vn/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIRA_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${count} unique NMMS MCQs for "${topic}" in Hindi. Return raw JSON array only, no markdown.` }
        ],
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ API Error ${response.status}: ${errText.substring(0, 200)}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log(`📝 AI response length: ${content.length} chars`);

    if (content.length < 10) {
      console.error("❌ AI returned very short/empty response");
      return [];
    }

    const questions = extractJSON(content);
    console.log(`✅ Parsed ${questions.length} questions from this batch`);
    return questions;

  } catch (error) {
    console.error(`❌ Fetch error: ${error.message}`);
    return [];
  }
}

// 6. Main
async function run() {
  // Get Batch
  const { data: batches, error: batchErr } = await supabase.from('batches').select('id, title');
  if (batchErr) { console.error("Batch fetch error:", batchErr); process.exit(1); }
  if (!batches || batches.length === 0) { console.error("No batches found."); process.exit(1); }

  let targetBatch = batches.find(b => b.title.toLowerCase().includes('nmms'));
  if (!targetBatch) targetBatch = batches[0];
  console.log(`🎯 Batch: ${targetBatch.title} (${targetBatch.id})`);

  // Generate questions in batches of 10
  const BATCH_SIZE = 10;
  let allQuestions = [];
  let failures = 0;
  const MAX_FAILURES = 10;

  // For combined mega test, cycle through subjects
  const megaSubjects = ['Science', 'History', 'Geography', 'Mental Ability (MAT)', 'Math'];

  while (allQuestions.length < todayPlan.qCount && failures < MAX_FAILURES) {
    const remaining = todayPlan.qCount - allQuestions.length;
    const batchCount = Math.min(BATCH_SIZE, remaining);

    // For mega test, pick a subject based on current count
    let currentTopic = todayPlan.subject;
    if (todayPlan.qCount === 180) {
      const subjectIndex = Math.floor(allQuestions.length / 36) % megaSubjects.length;
      currentTopic = megaSubjects[subjectIndex];
    }

    const questions = await generateBatch(currentTopic, batchCount);

    if (questions.length > 0) {
      allQuestions = allQuestions.concat(questions);
      console.log(`📊 Progress: ${allQuestions.length}/${todayPlan.qCount}`);
      failures = 0; // Reset failure counter on success
    } else {
      failures++;
      console.log(`⚠️ Batch failed (${failures}/${MAX_FAILURES}). Retrying in 3s...`);
    }

    // Delay between batches
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log(`\n🏁 Generation complete: ${allQuestions.length} questions total`);

  if (allQuestions.length === 0) {
    console.error("FATAL: 0 questions generated. Aborting.");
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
      // Delete questions first, then test
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
  console.log(`✅ Test created: "${newTest.title}" (ID: ${newTest.id})`);

  // Insert questions in chunks of 50 to avoid payload limits
  const CHUNK = 50;
  let inserted = 0;
  for (let i = 0; i < allQuestions.length; i += CHUNK) {
    const chunk = allQuestions.slice(i, i + CHUNK).map(q => ({
      test_id: newTest.id,
      question_text: q.question_text || 'प्रश्न उपलब्ध नहीं',
      option_a: q.option_a || 'विकल्प A',
      option_b: q.option_b || 'विकल्प B',
      option_c: q.option_c || 'विकल्प C',
      option_d: q.option_d || 'विकल्प D',
      correct_answer: q.correct_answer || q.option_a || '',
      explanation: q.explanation || ''
    }));

    const { error: qError } = await supabase.from('questions').insert(chunk);
    if (qError) {
      console.error(`❌ Question insert error (batch ${i}):`, qError);
    } else {
      inserted += chunk.length;
      console.log(`📥 Inserted ${inserted}/${allQuestions.length} questions`);
    }
  }

  // Update total_questions to actual count
  await supabase.from('tests').update({ total_questions: inserted }).eq('id', newTest.id);

  console.log(`\n🎉 AUTO-TEST COMPLETE!`);
  console.log(`   Title: ${testTitle}`);
  console.log(`   Questions: ${inserted}`);
  console.log(`   Batch: ${targetBatch.title}`);
  process.exit(0);
}

run().catch(err => {
  console.error("UNHANDLED ERROR:", err);
  process.exit(1);
});
