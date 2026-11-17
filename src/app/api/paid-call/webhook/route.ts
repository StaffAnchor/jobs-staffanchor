import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { settlePaidCall } from "@/lib/paid-call-settle";

export const runtime = "nodejs";

// Razorpay tells us directly when a payment is captured, so a ₹199 payment is recorded even if the candidate closed the
// tab or switched to their UPI app before the browser could confirm it. Set RAZORPAY_WEBHOOK_SECRET to the secret typed
// in the Razorpay dashboard (Settings, Webhooks) for events payment.captured and order.paid.
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey) return NextResponse.json({ error: "Webhook isn't set up yet." }, { status: 503 });

  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(expected);
  const c = Buffer.from(sig);
  if (a.length !== c.length || !crypto.timingSafeEqual(a, c)) return NextResponse.json({ error: "Bad signature." }, { status: 400 });

  let evt: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } } } };
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad body." }, { status: 400 });
  }
  if (evt.event !== "payment.captured" && evt.event !== "order.paid") return NextResponse.json({ ok: true, ignored: evt.event ?? null });

  const p = evt.payload?.payment?.entity;
  if (!p?.id || !p.order_id || p.status !== "captured") return NextResponse.json({ ok: true, ignored: "not captured" });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const result = await settlePaidCall(admin, p.order_id, p.id, p.amount);
  // Orders that belong to other products (resume, Edge bookings) share this Razorpay account: not ours, nothing to do.
  if (result === "amount_mismatch") console.error("Razorpay webhook: amount mismatch for", p.order_id);
  return NextResponse.json({ ok: true, result });
}
