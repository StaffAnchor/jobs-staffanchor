// The two ways to apply: free (we call only if the profile matches) or ₹99 (a recruiter calls within 3 working days
// whether or not the role is a match, refunded if we miss that). One place for the price, the deadline and the wording.
export const PAID_CALL_RUPEES = 99;
export const PAID_CALL_PAISE = PAID_CALL_RUPEES * 100;
export const PAID_CALL_WORKING_DAYS = 3;

export const COPY = {
  freeTitle: "Apply free",
  freeLine: "We'll call you only if your profile matches this role.",
  paidTitle: `Apply and get a recruiter call · ₹${PAID_CALL_RUPEES}`,
  paidLine: `A 15-minute call within ${PAID_CALL_WORKING_DAYS} working days, even if this role isn't a match. Also helps with future roles. Not a job guarantee.`,
  refundLine: `Money back if we don't call within ${PAID_CALL_WORKING_DAYS} working days.`,
  listFree: "Apply free",
  listPaid: `Apply + call ₹${PAID_CALL_RUPEES}`,
  listLine: `Free: we call only if you match · ₹${PAID_CALL_RUPEES}: recruiter call within ${PAID_CALL_WORKING_DAYS} working days`,
  doneFree: "Application received. If your profile matches, a recruiter will call you. If it doesn't, you won't hear from us for this role, but we'll keep your profile for future roles.",
  donePaid: `Payment received. A recruiter will call you within ${PAID_CALL_WORKING_DAYS} working days to discuss your profile, whether or not it matches this role.`,
};

// The end of the Nth working day (Mon to Fri) after `from`, in Indian time.
export function dueDate(from: Date, workingDays = PAID_CALL_WORKING_DAYS): Date {
  const IST = 5.5 * 3600_000;
  const d = new Date(from.getTime() + IST);
  let left = workingDays;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) left -= 1;
  }
  d.setUTCHours(23, 59, 0, 0);
  return new Date(d.getTime() - IST);
}
