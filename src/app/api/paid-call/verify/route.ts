import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { settlePaidCall } from "@/lib/paid-call-settle";

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
  const result = await settlePaidCall(admin, b.razorpay_order_id, b.razorpay_payment_id);
  if (result === "order_not_found") return NextResponse.json({ error: "Order not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
