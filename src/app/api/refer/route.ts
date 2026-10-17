import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyRefer } from "@/lib/refer-token";

export const runtime = "nodejs";

const DAILY_LIMIT = 10;

// A referral sent from the signed link in the "who is the best seller you know?" email. The link proves who is
// referring; nothing else is trusted. A recruiter task is created by the database when the referral is saved.
export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "This isn't set up yet." }, { status: 503 });
  const b = (await req.json().catch(() => ({}))) as { id?: unknown; t?: unknown; name?: unknown; email?: unknown; phone?: unknown; note?: unknown; m?: unknown };
  const id = typeof b.id === "string" ? b.id : "";
  const t = typeof b.t === "string" ? b.t : "";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !t || !verifyRefer(id, t)) return NextResponse.json({ error: "This link isn't valid." }, { status: 403 });
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase().slice(0, 200) : "";
  const phone = typeof b.phone === "string" ? b.phone.trim().slice(0, 20) : "";
  const note = typeof b.note === "string" ? b.note.trim().slice(0, 600) : "";
  if (!name || !/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) return NextResponse.json({ error: "Please add their name and a valid email." }, { status: 400 });

  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { data: referrer } = await admin.from("candidates").select("id, email").eq("id", id).maybeSingle();
  if (!referrer) return NextResponse.json({ error: "This link isn't valid." }, { status: 403 });
  if ((referrer.email ?? "").toLowerCase() === email) return NextResponse.json({ error: "That's your own email. Please add your friend's." }, { status: 400 });

  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count } = await admin.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_candidate_id", id).gte("created_at", since);
  if ((count ?? 0) >= DAILY_LIMIT) return NextResponse.json({ error: "That's plenty for today. You can send more tomorrow." }, { status: 429 });

  // The role this referral is for, when the link named one that is still open and real.
  let mandateId: string | null = null;
  const code = typeof b.m === "string" && /^[a-z0-9]{4,12}$/i.test(b.m) ? b.m.toLowerCase() : null;
  if (code) {
    const { data: mid } = await admin.rpc("resolve_job_code", { p_code: code });
    if (typeof mid === "string") {
      const { data: r } = await admin.from("mandates").select("status, is_archived, listing_kind").eq("id", mid).maybeSingle();
      if (r && r.status === "open" && !r.is_archived && r.listing_kind !== "pipeline") mandateId = mid;
    }
  }

  const { data: dup } = await admin.from("referrals").select("id").eq("referrer_candidate_id", id).ilike("referred_email", email).limit(1).maybeSingle();
  let referralId: string | null = dup?.id ?? null;
  if (!dup) {
    const { data: created, error } = await admin.from("referrals").insert({ referrer_candidate_id: id, referred_name: name, referred_email: email, referred_phone: phone || null, note: note || null, status: "referred" }).select("id").single();
    if (error) return NextResponse.json({ error: "Couldn't save that. Please try again." }, { status: 500 });
    referralId = created?.id ?? null;
  }
  // Tie the referral to the role it was for, so it reaches the right mandate.
  if (referralId && mandateId) {
    await admin.from("referral_mandates").upsert({ referral_id: referralId, mandate_id: mandateId }, { onConflict: "referral_id,mandate_id", ignoreDuplicates: true });
  }
  // The same answer whether or not they were already referred, so nothing about our records is revealed.
  return NextResponse.json({ ok: true });
}
