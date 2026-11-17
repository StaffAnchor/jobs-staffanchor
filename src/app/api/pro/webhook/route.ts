import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { crmCall, verifyWebhook } from "@/lib/pro-sessions";
import { settlePaidCall } from "@/lib/paid-call-settle";

export const dynamic = "force-dynamic";

// Razorpay's own confirmation, for when the visitor closes the tab right after paying. Needs RAZORPAY_WEBHOOK_SECRET.
// A third kind, the ₹199 recruiter call, is recorded here too. Payments that are none of these (for example Priority Applicant) are simply ignored.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("x-razorpay-signature") ?? "")) return NextResponse.json({ ok: false }, { status: 401 });
  const evt = JSON.parse(raw) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number } } } };
  if (evt.event !== "payment.captured" && evt.event !== "order.paid") return NextResponse.json({ ok: true });
  const pay = evt.payload?.payment?.entity;
  if (pay?.order_id && pay.id) {
    // The order belongs to either a session booking or a resume order; the CRM answers 400 to the one it does not know.
    const s = await crmCall("/api/internal/pro/finalize", { orderId: pay.order_id, paymentId: pay.id });
    if (!s.json.ok) {
      const r = await crmCall("/api/internal/resume/finalize", { orderId: pay.order_id, paymentId: pay.id });
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!r.json.ok && serviceKey) {
        const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
        await settlePaidCall(admin, pay.order_id, pay.id, pay.amount);
      }
    }
  }
  return NextResponse.json({ ok: true });
}
