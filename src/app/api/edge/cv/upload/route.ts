import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { crmCall } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const OK_EXT = new Set(["pdf", "docx", "doc"]);

// The candidate's current CV: kept in private storage, then read by the CRM to fill in their jobs. If reading fails the CV is
// still kept and they simply add their jobs by hand.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");
  const file = form?.get("cv");
  if (!form || !(file instanceof File) || file.size === 0) return NextResponse.json({ ok: false, error: "Choose a file first." }, { status: 400 });
  const check = await crmCall("/api/internal/cv-brief/info", { token });
  if (!check.json.ok) return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 404 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ ok: false, error: "That file is over 5 MB." }, { status: 400 });
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!OK_EXT.has(ext)) return NextResponse.json({ ok: false, error: "Please upload a PDF or Word file." }, { status: 400 });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "Uploads aren't available right now." }, { status: 503 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  const safe = file.name.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = `cvbrief/${token}/${Date.now()}-${safe}`;
  const { error } = await db.storage.from("resume-orders").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type || "application/octet-stream" });
  if (error) return NextResponse.json({ ok: false, error: "Couldn't upload the file. Please try again." }, { status: 500 });

  const r = await crmCall<{ jobs?: number; data?: unknown }>("/api/internal/cv-brief/read-cv", { token, cvPath: path, cvName: file.name });
  if (!r.json.ok) return NextResponse.json({ ok: true, read: false, message: r.json.error ?? "We couldn't read it automatically." });
  return NextResponse.json({ ok: true, read: true, jobs: r.json.jobs ?? 0, data: r.json.data });
}
