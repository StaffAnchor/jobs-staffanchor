import { NextRequest, NextResponse } from "next/server";
import { crmCall, verifyWebhook } from "@/lib/pro-sessions";

export const dynamic = "force-dynamic";

// Razorpay's own confirmation, for when the visitor closes the tab right after paying. Needs RAZORPAY_WEBHOOK_SECRET.
// Payments that are not Pro Sessions bookings (for example Priority Applicant) are simply ignored.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-razorpay-signature") ?? "")) return NextResponse.json({ ok: false }, { status: 401 });
  const evt = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  if (evt.event !== "payment.captured" && evt.event !== "order.paid") return NextResponse.json({ ok: true });
  const pay = evt.payload?.payment?.entity;
  if (pay?.order_id && pay.id) await crmCall("/api/internal/pro/finalize", { orderId: pay.order_id, paymentId: pay.id });
  return NextResponse.json({ ok: true });
}
