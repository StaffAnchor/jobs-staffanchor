import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { crmCall } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// The candidate's optional photo for their CV: kept in private storage and linked to their form by the CRM. A photo can be
// replaced or removed any time.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("token") ?? "");
  if (!form) return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 400 });
  const check = await crmCall("/api/internal/cv-brief/info", { token });
  if (!check.json.ok) return NextResponse.json({ ok: false, error: "This link isn't valid." }, { status: 404 });

  if (form.get("remove") === "1") {
    const r = await crmCall("/api/internal/cv-brief/photo", { token, photoPath: null });
    return r.json.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ ok: false, error: "Couldn't remove it." }, { status: 502 });
  }

  const file = form.get("photo");
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ ok: false, error: "Choose a photo first." }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ ok: false, error: "That photo is over 4 MB." }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ ok: false, error: "Please use a JPG, PNG or WebP photo." }, { status: 400 });
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "Uploads aren't available right now." }, { status: 503 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  const path = `cvbrief/${token}/photo-${Date.now()}.${ext}`;
  const { error } = await db.storage.from("resume-orders").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) return NextResponse.json({ ok: false, error: "Couldn't upload the photo. Please try again." }, { status: 500 });
  const r = await crmCall("/api/internal/cv-brief/photo", { token, photoPath: path });
  if (!r.json.ok) return NextResponse.json({ ok: false, error: "Couldn't save the photo." }, { status: 502 });
  const { data } = await db.storage.from("resume-orders").createSignedUrl(path, 3600);
  return NextResponse.json({ ok: true, url: data?.signedUrl ?? null });
}
