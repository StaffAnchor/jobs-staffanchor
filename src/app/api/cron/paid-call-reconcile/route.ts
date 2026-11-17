import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { settlePaidCall } from "@/lib/paid-call-settle";

export const runtime = "nodejs";

// Daily catch-up: any ₹199 order still "created" after 15 minutes is checked with Razorpay. If a captured payment exists,
// the call is marked paid. Covers a missed browser confirmation and a missed webhook alike.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET isn't configured." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!keyId || !keySecret || !serviceKey) return NextResponse.json({ error: "Not configured." }, { status: 503 });

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey);
  const from = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const to = new Date(Date.now() - 15 * 60_000).toISOString();
  const { data: orders } = await admin.from("paid_call_orders").select("razorpay_order_id").eq("status", "created").gte("created_at", from).lte("created_at", to).limit(100);

  const auth = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  const results: { order: string; action: string }[] = [];
  for (const o of (orders ?? []) as { razorpay_order_id: string }[]) {
    const res = await fetch(`https://api.razorpay.com/v1/orders/${o.razorpay_order_id}/payments`, { headers: { Authorization: auth } });
    if (!res.ok) {
      results.push({ order: o.razorpay_order_id, action: "razorpay lookup failed" });
      continue;
    }
    const j = (await res.json().catch(() => ({}))) as { items?: { id: string; status: string; amount: number }[] };
    const paid = (j.items ?? []).find((x) => x.status === "captured");
    if (!paid) continue;
    results.push({ order: o.razorpay_order_id, action: await settlePaidCall(admin, o.razorpay_order_id, paid.id, paid.amount) });
  }
  return NextResponse.json({ checked: orders?.length ?? 0, results });
}
