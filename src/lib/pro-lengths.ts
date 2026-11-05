// A longer length some sessions can be booked for, priced in proportion. The CRM works out the real price when the time is held;
// these numbers only decide what the booking page shows.
export const LONG_LENGTH: Record<string, { minutes: number; priceInr: number }> = {
  "mock-interview": { minutes: 90, priceInr: 2999 },
};
