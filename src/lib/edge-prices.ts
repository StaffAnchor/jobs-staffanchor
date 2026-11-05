// The Edge prices shown in promotions around the site. The booking pages and the CRM hold the real prices; these only
// have to agree with them. Change them together with the CRM (src/lib/resume-orders/core.ts) and the pro_services table.
export const MOCK_INTERVIEW_RUPEES = 1999;
// The mock interview can be booked for 60 minutes or 90, so it is shown as a "from" price.
export const MOCK_INTERVIEW_FROM = `from ₹${MOCK_INTERVIEW_RUPEES.toLocaleString("en-IN")}`;
export const RESUME_FROM_RUPEES = 1199;
export const COMBO_FROM_RUPEES = 1758;
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
