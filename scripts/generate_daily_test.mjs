import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
try { const dotenv = await import('dotenv'); dotenv.config({ path: '.env.local' }); } catch(e) {}


// 1. Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: fetch.bind(globalThis) },
  realtime: { transport: WebSocket }
});

// 2. Initialize AI API
const KIRA_KEY = process.env.KIRA_API_KEY || process.env.KIRA || process.env.BYNARA_KEY;
if (!KIRA_KEY) {
  console.error("Missing KIRA_API_KEY.");
  process.exit(1);
}

const AI_MODEL = 'deepseek-v4-flash-free'; 
// Using the free tier model from Bynara

// 3. Logic: Determine Day and Topic
const now = new Date();
const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

const schedule = {
  1: { subject: 'Science', qCount: 50, isReasoning: false }, // Mon
  2: { subject: 'History', qCount: 50, isReasoning: false }, // Tue
  3: { subject: 'Geography', qCount: 50, isReasoning: false }, // Wed
  4: { subject: 'Mental Ability (MAT)', qCount: 50, isReasoning: true }, // Thu
  5: { subject: 'Math', qCount: 50, isReasoning: false }, // Fri
  6: { subject: 'Combined Mega Test (Science, MAT, Math, History, Geography)', qCount: 180, isReasoning: false }, // Sat
  0: { subject: 'Combined Mega Test (Science, MAT, Math, History, Geography)', qCount: 180, isReasoning: false }  // Sun
};

const todayPlan = schedule[dayOfWeek];
console.log(`[Auto-Test] Today is day ${dayOfWeek}. Topic: ${todayPlan.subject}. Total Questions: ${todayPlan.qCount}`);

// Helper to generate a batch of questions
async function generateBatch(topic, count) {
  console.log(`Generating batch of ${count} questions for ${topic}...`);
  const seed = Math.random().toString(36).substring(7); // Random seed to prevent repetition
  const systemPrompt = `You are a master question paper maker for Indian competitive & scholarship exams, specially NMMS (National Means Cum-Merit Scholarship) Class 8th.
IMPORTANT: Generate COMPLETELY NEW and UNIQUE questions. Do not repeat standard examples. (Randomization Seed: ${seed})
Generate exactly ${count} multiple choice questions (MCQs) for the topic: "${topic}".
The questions, options, and step-by-step reasoning solutions MUST be written in Hindi.
Return ONLY a valid JSON array of objects. Do NOT include markdown code blocks like \`\`\`json or explanatory chat text.
Each object must have these exact keys:
- "question_text": The complete question in Hindi.
- "option_a": Option A text.
- "option_b": Option B text.
- "option_c": Option C text.
- "option_d": Option D text.
- "correct_answer": The exact full text of the correct option (e.g. value of option_a, option_b, option_c, or option_d).
- "explanation": Step-by-step reasoning logic explaining how to solve it in Hindi.`;

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
          { role: "user", content: `Generate ${count} high quality exam MCQs for "${topic}" in Hindi. Output JSON array only.` }
        ],
        temperature: 0.7,
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      let content = data.choices[0].message.content.trim();
      if (content.startsWith('```json')) content = content.substring(7);
      if (content.startsWith('```')) content = content.substring(3);
      if (content.endsWith('```')) content = content.substring(0, content.length - 3);
      
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error(`Error generating batch: ${error.message}`);
  }
  return [];
}

async function run() {
  // 1. Get Batch ID (NMMS preferred)
  const { data: batches } = await supabase.from('batches').select('id, title');
  if (!batches || batches.length === 0) {
    console.error("No batches found in Supabase.");
    process.exit(1);
  }
  let targetBatch = batches.find(b => b.title.toLowerCase().includes('nmms'));
  if (!targetBatch) targetBatch = batches[0];
  console.log(`Selected Batch: ${targetBatch.title} (${targetBatch.id})`);

  // 2. Generate questions in chunks of 10
  const BATCH_SIZE = 10;
  let allQuestions = [];
  

  let retryCount = 0; while (allQuestions.length < todayPlan.qCount && retryCount < 50) {
    const remaining = todayPlan.qCount - allQuestions.length;
    const toGenerate = Math.min(BATCH_SIZE, remaining);
    
    // For combined tests, we can alternate topics if we wanted, but the LLM will mix them if we pass the combined topic string.
    const q = await generateBatch(todayPlan.subject, toGenerate);
    if (q.length > 0) {
      allQuestions = allQuestions.concat(q);
      console.log(`Progress: ${allQuestions.length} / ${todayPlan.qCount} questions generated.`);
    } else {
      console.log("Failed to generate batch. Retrying...");
      retryCount++; // Prevent infinite loops
    }
    // Small delay to avoid API rate limits
    await new Promise(r => setTimeout(r, 2000));
  }

  // 3. Find and Delete previous auto-generated test
  // Auto-tests will have a specific title prefix so we can find them
  const testTitle = `${todayPlan.isReasoning ? '[REASONING] ' : ''}Daily Auto Test (${now.toLocaleDateString()})`;
  
  const { data: oldTests } = await supabase.from('tests')
    .select('id, title')
    .eq('batch_id', targetBatch.id)
    .ilike('title', '%Daily Auto Test%');

  if (oldTests && oldTests.length > 0) {
    console.log(`Found ${oldTests.length} old auto-test(s). Deleting...`);
    for (const ot of oldTests) {
      await supabase.from('tests').delete().eq('id', ot.id);
    }
  }

  // 4. Create New Test
  const { data: newTest, error: testError } = await supabase.from('tests').insert([{
    batch_id: targetBatch.id,
    title: testTitle,
    duration_mins: todayPlan.qCount === 180 ? 180 : 60,
    total_questions: allQuestions.length,
    start_time: now.toISOString()
  }]).select().single();

  if (testError || !newTest) {
    console.error("Failed to insert test:", testError);
    process.exit(1);
  }

  console.log(`Created new test: ${newTest.title} with ID ${newTest.id}`);

  // 5. Insert Questions
  const formattedQuestions = allQuestions.map(q => ({
    test_id: newTest.id,
    question_text: q.question_text || '',
    option_a: q.option_a || '',
    option_b: q.option_b || '',
    option_c: q.option_c || '',
    option_d: q.option_d || '',
    correct_answer: q.correct_answer || '',
    explanation: q.explanation || ''
  }));

  const { error: qError } = await supabase.from('questions').insert(formattedQuestions);
  if (qError) {
    console.error("Failed to insert questions:", qError);
  } else {
    console.log("Successfully inserted all questions!");
  }

  console.log("Auto-Test Generation Completed Successfully!");
  process.exit(0);
}

run();
