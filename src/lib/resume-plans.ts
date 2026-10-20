// Resume Writing plans for display. The price depends on years of experience only. The CRM works out the plan again
// from the years when the order is placed, so what is shown here can never set the price.
export type PlanKey = "early" | "mid" | "senior";

export const PLANS: Record<PlanKey, { label: string; band: string; price: number; revisions: number; finalDelivery: string }> = {
  early: { label: "Early Stage", band: "0-5 years", price: 1199, revisions: 1, finalDelivery: "about 5 working days" },
  mid: { label: "Mid Level", band: "6-12 years", price: 1799, revisions: 1, finalDelivery: "about 5 working days" },
  senior: { label: "Senior / CXO", band: "13+ years", price: 2499, revisions: 2, finalDelivery: "about 7 working days" },
};

export const planForYears = (years: number): PlanKey => (years <= 5 ? "early" : years <= 12 ? "mid" : "senior");
