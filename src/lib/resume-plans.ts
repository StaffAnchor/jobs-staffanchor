// Resume Writing plans for display. The price depends on years of experience only. The CRM works the plan out again
// from the years when the order is placed, so what is shown here can never set the price.
export type PlanKey = "early" | "mid" | "senior";

export const PLANS: Record<PlanKey, { label: string; band: string; price: number; revisions: number; finalDelivery: string }> = {
  early: { label: "Early Stage", band: "0-5 years", price: 2000, revisions: 1, finalDelivery: "about 5 working days" },
  mid: { label: "Mid Level", band: "6-12 years", price: 3000, revisions: 1, finalDelivery: "about 5 working days" },
  senior: { label: "Senior / CXO", band: "13+ years", price: 4000, revisions: 2, finalDelivery: "about 7 working days" },
};

export const planForYears = (years: number): PlanKey => (years <= 5 ? "early" : years <= 12 ? "mid" : "senior");

// Interview Preparation + Job Strategy: one 1:1 session, 60 or 90 minutes, priced by experience band and length.
// Display only; the CRM works the price out again when the time is held.
export type SessionMinutes = 60 | 90;
export const SESSION_PRICE: Record<PlanKey, Record<SessionMinutes, number>> = {
  early: { 60: 2000, 90: 3000 },
  mid: { 60: 3000, 90: 4500 },
  senior: { 60: 5000, 90: 7500 },
};
export const sessionPriceFor = (years: number, minutes: number) => SESSION_PRICE[planForYears(years)][minutes === 90 ? 90 : 60];

// Interview Preparation + Job Strategy + Resume Rebuild: the session plus Resume Writing for the band, less 20%.
export function comboFor(years: number, minutes: number = 60) {
  const plan = planForYears(years);
  const session = SESSION_PRICE[plan][minutes === 90 ? 90 : 60];
  const resume = PLANS[plan].price;
  const subtotal = session + resume;
  const total = Math.round((subtotal * 80) / 100);
  return { plan, session, resume, subtotal, discount: subtotal - total, total };
}
