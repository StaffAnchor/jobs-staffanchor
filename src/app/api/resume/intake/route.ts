import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { crmCall } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const FIELDS = ["currentRole", "currentCompany", "experience", "targetRole", "targetIndustry", "linkedin", "achievements", "other"];
const OK_TYPES = new Set(["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

// The details form: saves the answers in the CRM and keeps the uploaded resume in private storage.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 400 });
  const token = String(form.get("token") ?? "");
  const info = await crmCall("/api/internal/resume/intake-info", { token });
  if (!info.json.ok) return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 404 });

  const answers: Record<string, string> = {};
  for (const k of FIELDS) answers[k] = String(form.get(k) ?? "").slice(0, 4000);
  if (!answers.currentRole.trim() || !answers.targetRole.trim() || !answers.achievements.trim()) {
    return NextResponse.json({ ok: false, error: "Please fill in your current role, target role and key achievements." }, { status: 400 });
  }

  let cvPath: string | null = null;
  const file = form.get("cv");
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ ok: false, error: "The resume file is over 5 MB." }, { status: 400 });
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();
    if (!OK_TYPES.has(file.type) && !["pdf", "doc", "docx"].includes(ext)) return NextResponse.json({ ok: false, error: "Please upload a PDF or Word file." }, { status: 400 });
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return NextResponse.json({ ok: false, error: "Uploads aren't available right now." }, { status: 503 });
    const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
    const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
    cvPath = `${token}/${Date.now()}-${safe}`;
    const { error } = await db.storage.from("resume-orders").upload(cvPath, Buffer.from(await file.arrayBuffer()), { contentType: file.type || "application/octet-stream" });
    if (error) return NextResponse.json({ ok: false, error: "Couldn't upload the resume. Please try again." }, { status: 500 });
  }

  const r = await crmCall("/api/internal/resume/intake", { token, answers, cvPath });
  if (!r.json.ok) return NextResponse.json({ ok: false, error: r.json.error ?? "Couldn't save your details." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
