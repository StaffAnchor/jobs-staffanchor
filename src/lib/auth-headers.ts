import { supabase } from "@/lib/supabaseClient";

// Headers for calls to our own API routes. A signed-in candidate sends their
// session token so the server can verify who they are (and let them update
// their own profile); anonymous visitors send nothing extra.
export async function authHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...extra };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // Fall back to anonymous.
  }
  return headers;
}
