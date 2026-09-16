const { createClient } = require("@supabase/supabase-js");


console.log("Student Supabase URL:", process.env.STUDENT_SUPABASE_URL);
console.log(
    "Student Secret Key Loaded:",
    !!process.env.STUDENT_SUPABASE_SECRET_KEY
);
console.log(
    "Student Supabase URL:",
    process.env.STUDENT_SUPABASE_URL
);

console.log(
    "Student key prefix:",
    process.env.STUDENT_SUPABASE_SECRET_KEY?.substring(0, 10)
);

const studentSupabase = createClient(
    process.env.STUDENT_SUPABASE_URL,
    process.env.STUDENT_SUPABASE_SECRET_KEY
);

module.exports = studentSupabase;