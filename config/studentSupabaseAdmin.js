const { createClient } = require("@supabase/supabase-js");

const studentSupabaseAdmin = createClient(
    process.env.STUDENT_SUPABASE_URL,
    process.env.STUDENT_SUPABASE_SECRET_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    }
);

module.exports = studentSupabaseAdmin;