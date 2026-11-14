// The 1:1 sessions with Gagan that can be booked for 60 or 90 minutes. The price depends on years of experience and length
// (see resume-plans.ts); the CRM works out the real price when the time is held, so these only decide what the page shows.
export const FLEX_SLUGS = new Set(["mock-interview", "job-search-strategy"]);
export const SESSION_LENGTHS = [60, 90] as const;
