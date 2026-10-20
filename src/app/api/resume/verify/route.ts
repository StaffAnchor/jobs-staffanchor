import { NextRequest, NextResponse } from "next/server";
import { crmCall, verifyPayment } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";

// After Razorpay Checkout succeeds: the signature proves the payment is real, then the CRM confirms the order and
// sends the details-form link.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { orderId?: string; paymentId?: string; signature?: string };
  if (!b.orderId || !b.paymentId || !b.signature) return NextResponse.json({ ok: false, error: "Missing payment details." }, { status: 400 });
  if (!verifyPayment(b.orderId, b.paymentId, b.signature)) return NextResponse.json({ ok: false, error: "Payment could not be verified." }, { status: 400 });
  const r = await crmCall<{ token?: string }>("/api/internal/resume/finalize", { orderId: b.orderId, paymentId: b.paymentId });
  if (!r.json.ok || !r.json.token) return NextResponse.json({ ok: false, error: r.json.error ?? "Couldn't confirm the order." }, { status: 502 });
  return NextResponse.json({ ok: true, intakeUrl: `/resume/intake/${r.json.token}` });
}
