/**
 * Turns whatever a person types or pastes into the 10-digit Indian mobile number the forms store.
 *
 * The forms show a fixed "+91" beside the box, so people naturally paste "+91 98765 43210", "919876543210"
 * or "09876543210". Keeping only the first ten digits of those silently saves a different, wrong number
 * (9198765432). This drops the country code or the leading 0 first, then keeps ten digits.
 */
export function indianMobileFromInput(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (/^\s*(\+|00)\s*91/.test(raw) && d.length > 10) d = d.replace(/^(00)?91/, "");
  else if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d.slice(0, 10);
}
