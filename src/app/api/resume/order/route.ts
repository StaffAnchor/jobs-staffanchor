import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder, crmCall, proConfigured } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";

// Records the order in the CRM at the price for the person's years of experience, then opens a Razorpay order for
// exactly that amount. Nothing is confirmed until the payment signature is verified in /api/resume/verify.
export async function POST(req: NextRequest) {
  if (!proConfigured()) return NextResponse.json({ ok: false, error: "Ordering isn't switched on yet. Please check back soon." }, { status: 503 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof b.website === "string" && b.website.trim()) return NextResponse.json({ ok: true }); // honeypot
  if (b.consent !== true) return NextResponse.json({ ok: false, error: "Please accept the terms and privacy policy." }, { status: 400 });

  const hold = await crmCall<{ orderRef?: string; amountInr?: number; title?: string }>("/api/internal/resume/hold", {
    experienceYears: b.experienceYears, name: b.name, email: b.email, phone: b.phone, src: b.src,
  });
  if (!hold.json.ok || !hold.json.orderRef || !hold.json.amountInr) {
    return NextResponse.json({ ok: false, error: hold.json.error ?? "Couldn't start your order. Please try again." }, { status: hold.status >= 400 ? hold.status : 502 });
  }
  const order = await createRazorpayOrder(hold.json.amountInr, hold.json.orderRef, { resume_order: hold.json.orderRef });
  if (!order) {
    await crmCall("/api/internal/resume/attach-order", { orderRef: hold.json.orderRef, failed: true });
    return NextResponse.json({ ok: false, error: "Couldn't start the payment. Please try again." }, { status: 502 });
  }
  await crmCall("/api/internal/resume/attach-order", { orderRef: hold.json.orderRef, orderId: order.id });
  return NextResponse.json({ ok: true, orderId: order.id, amountPaise: hold.json.amountInr * 100, keyId: process.env.RAZORPAY_KEY_ID, title: hold.json.title });
}
