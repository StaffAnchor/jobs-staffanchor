import type { SupabaseClient } from "@supabase/supabase-js";
import { PROFILE_CALL_MANDATE_ID, PAID_CALL_PAISE, dueDate } from "@/lib/paid-call";

// The one place a ₹199 recruiter-call payment becomes "paid". Three things can call it, and any of them may arrive first:
// the candidate's browser (/api/paid-call/verify), Razorpay's own message to us (/api/paid-call/webhook), and the daily
// catch-up (/api/cron/paid-call-reconcile). Running it twice for the same payment changes nothing the second time.
export type SettleResult = "paid" | "already_paid" | "order_not_found" | "amount_mismatch";

export async function settlePaidCall(admin: SupabaseClient, razorpayOrderId: string, razorpayPaymentId: string, amountPaise?: number): Promise<SettleResult> {
  const { data: order } = await admin.from("paid_call_orders").select("id, status, link_id, candidate_id, mandate_id, amount_paise").eq("razorpay_order_id", razorpayOrderId).maybeSingle();
  if (!order) return "order_not_found";
  if (order.status === "paid" || order.status === "refunded") return "already_paid";
  if (typeof amountPaise === "number" && amountPaise !== (order.amount_paise ?? PAID_CALL_PAISE)) return "amount_mismatch";

  const now = new Date();
  await admin.from("paid_call_orders").update({ status: "paid", razorpay_payment_id: razorpayPaymentId, paid_at: now.toISOString() }).eq("id", order.id);
  // A call for future roles gets its link only now that it is paid, so unpaid attempts leave nothing behind in the CRM.
  let linkId = order.link_id as string | null;
  if (!linkId && order.mandate_id === PROFILE_CALL_MANDATE_ID && order.candidate_id) {
    const { data: existing } = await admin.from("candidate_mandate_links").select("id").eq("candidate_id", order.candidate_id).eq("mandate_id", PROFILE_CALL_MANDATE_ID).maybeSingle();
    if (existing) linkId = existing.id as string;
    else {
      const { data: made } = await admin.from("candidate_mandate_links").insert({ candidate_id: order.candidate_id, mandate_id: PROFILE_CALL_MANDATE_ID }).select("id").maybeSingle();
      linkId = (made?.id as string | undefined) ?? null;
    }
    if (linkId) await admin.from("paid_call_orders").update({ link_id: linkId }).eq("id", order.id);
  }
  if (linkId) {
    await admin
      .from("candidate_mandate_links")
      .update({ call_paid_at: now.toISOString(), call_due_at: dueDate(now).toISOString() })
      .eq("id", linkId)
      .is("call_paid_at", null);
  }
  return "paid";
}
