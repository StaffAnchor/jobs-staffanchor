import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrder, crmCall, proConfigured } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";

// Holds the chosen time (CRM), then opens a Razorpay order for the price the CRM returns. Nothing is confirmed
// until the payment signature is verified in /api/pro/verify.
export async function POST(req: NextRequest) {
  if (!proConfigured()) return NextResponse.json({ ok: false, error: "Booking isn't switched on yet. Please check back soon." }, { status: 503 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof b.website === "string" && b.website.trim()) return NextResponse.json({ ok: true }); // honeypot
  if (b.consent !== true) return NextResponse.json({ ok: false, error: "Please accept the terms and privacy policy." }, { status: 400 });

  const hold = await crmCall<{ bookingId?: string; amountInr?: number; title?: string }>("/api/internal/pro/hold", {
    service: b.service, slotStart: b.slotStart, name: b.name, email: b.email, phone: b.phone, targetRole: b.targetRole, notes: b.notes, src: b.src,
  });
  if (!hold.json.ok || !hold.json.bookingId || !hold.json.amountInr) {
    return NextResponse.json({ ok: false, error: hold.json.error ?? "Couldn't hold that time. Please try again." }, { status: hold.status >= 400 ? hold.status : 502 });
  }
  const order = await createRazorpayOrder(hold.json.amountInr, hold.json.bookingId, { booking_id: hold.json.bookingId, service: String(b.service) });
  if (!order) {
    await crmCall("/api/internal/pro/attach-order", { bookingId: hold.json.bookingId, failed: true });
    return NextResponse.json({ ok: false, error: "Couldn't start the payment. Please try again." }, { status: 502 });
  }
  await crmCall("/api/internal/pro/attach-order", { bookingId: hold.json.bookingId, orderId: order.id });
  return NextResponse.json({ ok: true, bookingId: hold.json.bookingId, orderId: order.id, amountPaise: hold.json.amountInr * 100, keyId: process.env.RAZORPAY_KEY_ID, title: hold.json.title });
}
