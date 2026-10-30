import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { dueDate } from "@/lib/paid-call";

export const runtime = "nodejs";

// Confirms the payment server-side, then marks the application as a paid recruiter call with its deadline.
export async function POST(req: NextRequest) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keySecret || !serviceKey) return NextResponse.json({ error: "Payment isn't set up yet." }, { status: 503 });

  const b = (await req.json().catch(() => ({}))) as { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
  if (!b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature) return NextResponse.json({ error: "Missing payment details." }, { status: 400 });

  const expected = crypto.createHmac("sha256", keySecret).update(`${b.razorpay_order_id}|${b.razorpay_payment_id}`).digest("hex");
  const a = Buffer.from(expected);
  const c = Buffer.from(b.razorpay_signature);
  if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) return NextResponse.json({ error: "Payment signature didn't match." }, { status: 400 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const { data: order } = await admin.from("paid_call_orders").select("id, status, link_id").eq("razorpay_order_id", b.razorpay_order_id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (order.status === "paid") return NextResponse.json({ ok: true });

  const now = new Date();
  await admin.from("paid_call_orders").update({ status: "paid", razorpay_payment_id: b.razorpay_payment_id, paid_at: now.toISOString() }).eq("id", order.id);
  if (order.link_id) {
    await admin
      .from("candidate_mandate_links")
      .update({ call_paid_at: now.toISOString(), call_due_at: dueDate(now).toISOString() })
      .eq("id", order.link_id)
      .is("call_paid_at", null);
  }
  return NextResponse.json({ ok: true });
}
