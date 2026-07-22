const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pqqewpzolmwotfxtuzqg.supabase.co', 'sb_publishable_RoSz_DbmDZ5TVXmOpqxIOA_Ik3NfMu6');

async function test() {
    const { data: tests } = await supabase.from('tests').select('*').order('created_at', { ascending: false }).limit(1);
    if(tests.length > 0) {
        const testId = tests[0].id;
        const { data: qs } = await supabase.from('questions').select('*').eq('test_id', testId).limit(2);
        console.log(JSON.stringify(qs, null, 2));
    }
}
test();
