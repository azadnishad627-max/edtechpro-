const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let NEXT_PUBLIC_SUPABASE_URL = '', NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
env.split('\n').forEach(line => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) NEXT_PUBLIC_SUPABASE_URL = line.split('=')[1].trim();
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) NEXT_PUBLIC_SUPABASE_ANON_KEY = line.split('=')[1].trim();
});
const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function clean() {
  const { error } = await supabase.from('test_attempts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  console.log("Delete error:", error);
}
clean();
