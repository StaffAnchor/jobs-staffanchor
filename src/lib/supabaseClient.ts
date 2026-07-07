import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qdbxrspvnglbrvzfqhhg.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "sb_publishable_ZeMpC0wNCzhnQV5ElaqoqQ_PXE6XzHN";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Candidates now have a real logged-in session (magic-link candidate
    // portal), so we persist and auto-refresh it. The quick-apply / public
    // apply flows never relied on persistSession and are unaffected.
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
