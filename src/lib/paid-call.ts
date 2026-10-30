// The two ways to apply: free (we call only if the profile matches) or ₹199 (a recruiter calls within 3 working days
// whether or not the role is a match, refunded if we miss that). One place for the price, the deadline and the wording.
export const PAID_CALL_RUPEES = 199;
export const PAID_CALL_PAISE = PAID_CALL_RUPEES * 100;
export const PAID_CALL_WORKING_DAYS = 3;

export const COPY = {
  freeTitle: "Apply free",
  freeLine: "We'll call you if your profile matches this role.",
  paidTitle: `Apply + recruiter call · ₹${PAID_CALL_RUPEES}`,
  paidCardTitle: "Apply + recruiter call",
  paidPrice: `₹${PAID_CALL_RUPEES}`,
  paidLine: `A recruiter calls you within ${PAID_CALL_WORKING_DAYS} working days, match or not.`,
  refundLine: `No call within ${PAID_CALL_WORKING_DAYS} working days? Full refund. A profile discussion, not a job guarantee.`,
  whyLabel: `Why ₹${PAID_CALL_RUPEES}?`,
  whyLine: `₹${PAID_CALL_RUPEES} (GST included) pays for a recruiter's time on a one-to-one profile call, and keeps these calls for people who are serious about this role or future ones.`,
  listFree: "Apply free",
  listPaid: `Apply + call ₹${PAID_CALL_RUPEES}`,
  listLine: "Free: we call if you match · Paid: a guaranteed call",
  doneFree: "Application received. If your profile matches, a recruiter will call you. If it doesn't, we'll keep your profile for future roles.",
  donePaid: `Payment received. A recruiter will call you within ${PAID_CALL_WORKING_DAYS} working days to discuss your profile, whether or not it matches this role.`,
  cardTitle: "Want a guaranteed call?",
  cardButton: "Book my call",
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
