import { NextRequest, NextResponse } from "next/server";
import { crmCall, verifyPayment } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";

// Called by the booking page after Razorpay Checkout succeeds. The signature proves the payment is real; only then
// is the CRM asked to confirm the booking.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { bookingId?: string; orderId?: string; paymentId?: string; signature?: string };
  if (!b.bookingId || !b.orderId || !b.paymentId || !b.signature) return NextResponse.json({ ok: false, error: "Missing payment details." }, { status: 400 });
  if (!verifyPayment(b.orderId, b.paymentId, b.signature)) return NextResponse.json({ ok: false, error: "Payment could not be verified." }, { status: 400 });
  const r = await crmCall<{ start?: string; meetLink?: string | null }>("/api/internal/pro/finalize", { bookingId: b.bookingId, orderId: b.orderId, paymentId: b.paymentId });
  if (!r.json.ok) return NextResponse.json({ ok: false, error: r.json.error ?? "Couldn't confirm the booking." }, { status: 502 });
  return NextResponse.json({ ok: true, start: r.json.start, meetLink: r.json.meetLink ?? null });
}
