import { supabase } from "@/lib/supabaseClient";

export async function getResumeSignedUrl(resumeFileUrl: string): Promise<string | null> {
  const cleanPath = resumeFileUrl.replace(/^resumes\//, "");
  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(cleanPath, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}
