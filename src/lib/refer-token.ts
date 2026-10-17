import crypto from "crypto";

// The link in the "who is the best seller you know?" email is signed for one person and one purpose, so it can only be
// used to send a referral from that person. Same signature the CRM makes when it sends the email.
export const referToken = (candidateId: string) =>
  crypto.createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY ?? "unset").update(`refer:${candidateId}`).digest("hex").slice(0, 32);

export function verifyRefer(candidateId: string, token: string): boolean {
  const a = Buffer.from(referToken(candidateId));
  const b = Buffer.from(token);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
