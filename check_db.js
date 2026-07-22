const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
let NEXT_PUBLIC_SUPABASE_URL = '';
let NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
for (let line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) NEXT_PUBLIC_SUPABASE_URL = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) NEXT_PUBLIC_SUPABASE_ANON_KEY = line.split('=')[1].trim();
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase.from('test_attempts').select('*');
  console.log("Error:", error);
  console.log("Data:", data);
}
check();
