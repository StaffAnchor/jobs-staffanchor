import crypto from "crypto";

// Pro Sessions booking, payment side. The visitor picks a time and pays here, on jobs.staffanchor.com, using the same
// Razorpay account as Priority Applicant. The CRM holds the calendar and the bookings; it is called privately with a
// shared secret (PRO_INTERNAL_SECRET) so only this site can hold a time and confirm a booking.

export const CRM = "https://clients.staffanchor.com";

export async function crmCall<T = Record<string, unknown>>(path: string, body: unknown): Promise<{ status: number; json: T & { ok?: boolean; error?: string } }> {
  const res = await fetch(`${CRM}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-pro-secret": process.env.PRO_INTERNAL_SECRET ?? "" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({ ok: false, error: "The booking service didn't answer." }))) as T & { ok?: boolean; error?: string };
  return { status: res.status, json };
}

export const proConfigured = () => !!(process.env.PRO_INTERNAL_SECRET && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

export async function createRazorpayOrder(amountInr: number, receipt: string, notes: Record<string, string>): Promise<{ id: string } | null> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountInr * 100, currency: "INR", receipt: receipt.slice(0, 40), notes }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as { id: string };
}

const safeEqual = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export function verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  return safeEqual(crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex"), signature);
}

export function verifyWebhook(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEqual(crypto.createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}
