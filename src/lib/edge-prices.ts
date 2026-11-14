// The Edge prices shown in promotions around the site. The booking pages and the CRM hold the real prices; these only
// have to agree with them. Change them together with the CRM (src/lib/resume-orders/core.ts) and the pro_services table.
export const MOCK_INTERVIEW_RUPEES = 2000;
// Interview Preparation + Job Strategy depends on experience and length (60 or 90 minutes), so it is shown as a "from" price.
export const MOCK_INTERVIEW_FROM = `from ₹${MOCK_INTERVIEW_RUPEES.toLocaleString("en-IN")}`;
export const RESUME_FROM_RUPEES = 2000;
export const COMBO_FROM_RUPEES = 3200;
export const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
