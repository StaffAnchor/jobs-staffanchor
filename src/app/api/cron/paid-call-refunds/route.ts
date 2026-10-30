import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Refunds ₹199 when a recruiter call was promised and nobody even tried to ring within the deadline. A logged call
// attempt of any outcome (reached, no answer, call later) counts as keeping the promise.
// Refunds only go out when PAID_CALL_AUTO_REFUND=1; otherwise this just reports what would be refunded.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET isn't configured." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keyId || !keySecret || !serviceKey) return NextResponse.json({ error: "Not configured." }, { status: 503 });
  const live = process.env.PAID_CALL_AUTO_REFUND === "1";

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { data: links } = await admin
    .from("candidate_mandate_links")
    .select("id, candidate_id, call_paid_at")
    .not("call_paid_at", "is", null)
    .is("call_refunded_at", null)
    .lt("call_due_at", new Date().toISOString())
    .limit(50);

  const results: { link: string; action: string }[] = [];
  for (const l of (links ?? []) as { id: string; candidate_id: string; call_paid_at: string }[]) {
    const { count } = await admin.from("call_log").select("id", { count: "exact", head: true }).eq("candidate_id", l.candidate_id).gte("created_at", l.call_paid_at);
    if ((count ?? 0) > 0) continue;
    const { data: order } = await admin.from("paid_call_orders").select("id, razorpay_payment_id, status").eq("link_id", l.id).eq("status", "paid").maybeSingle();
    if (!order?.razorpay_payment_id) continue;
    if (!live) {
      results.push({ link: l.id, action: "would refund" });
      continue;
    }
    const res = await fetch(`https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64") },
      body: JSON.stringify({ notes: { reason: "Recruiter call not made within the promised time" } }),
    });
    const j = (await res.json().catch(() => ({}))) as { id?: string };
    if (res.ok && j.id) {
      const at = new Date().toISOString();
      await admin.from("paid_call_orders").update({ status: "refunded", refunded_at: at, refund_id: j.id }).eq("id", order.id);
      await admin.from("candidate_mandate_links").update({ call_refunded_at: at }).eq("id", l.id);
      results.push({ link: l.id, action: "refunded" });
    } else {
      await admin.from("paid_call_orders").update({ status: "refund_failed" }).eq("id", order.id);
      results.push({ link: l.id, action: "refund failed" });
    }
  }
  return NextResponse.json({ live, results });
}
