// The Edge prices shown in promotions around the site. The booking pages and the CRM hold the real prices; these only
// have to agree with them. Change them together with the CRM (src/lib/resume-orders/core.ts) and the pro_services table.
export const MOCK_INTERVIEW_RUPEES = 1999;
export const RESUME_FROM_RUPEES = 1199;
export const COMBO_FROM_RUPEES = 1758;
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
