import type { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FIRST_COOKIE, LAST_COOKIE, VISITOR_COOKIE, parseTouch } from "@/lib/attribution";

const read = (req: NextRequest, name: string) => {
  const v = req.cookies.get(name)?.value;
  return v ? decodeURIComponent(v) : null;
};

/**
 * Credits a registration or application to where the person came from. The candidate keeps their FIRST source for good
 * (never overwritten); each registration or application is also logged against the LAST source that brought them, so a
 * post gets credit for the actions it prompted. Best effort: never throws, never delays the response's outcome.
 */
export async function recordAcquisition(admin: SupabaseClient, req: NextRequest, a: { candidateId: string; mandateId?: string | null; isNewSignup: boolean }) {
  try {
    const first = parseTouch(read(req, FIRST_COOKIE));
    const last = parseTouch(read(req, LAST_COOKIE)) ?? first;
    const visitorId = read(req, VISITOR_COOKIE);
    const credit = first ?? { s: "direct", m: null, c: null, k: null, r: null, p: "/", at: Date.now() };
    // Only fills a blank: a candidate who already has a source keeps it.
    await admin
      .from("candidates")
      .update({ acquisition_source: credit.s, acquisition_medium: credit.m, acquisition_campaign: credit.c, acquisition_content: credit.k, acquired_at: new Date().toISOString() })
      .eq("id", a.candidateId)
      .is("acquisition_source", null);

    const t = last ?? credit;
    const base = { visitor_id: visitorId && /^[0-9a-f-]{20,40}$/i.test(visitorId) ? visitorId : null, source: t.s, medium: t.m, campaign: t.c, content: t.k, referrer_host: t.r, landing_path: t.p, candidate_id: a.candidateId, mandate_id: a.mandateId ?? null };
    const rows: Record<string, unknown>[] = [];
    if (a.isNewSignup) rows.push({ ...base, kind: "register" });
    if (a.mandateId) rows.push({ ...base, kind: "apply" });
    if (rows.length) await admin.from("traffic_events").insert(rows);
  } catch (err) {
    console.error("recordAcquisition failed", err);
  }
}
