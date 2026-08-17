// Shared pricing table for the Priority Applicant feature -- a candidate
// buys a pack of credits, each credit flags one application (new or
// already-submitted) as priority for the recruiter. Kept in one place so
// the product page, the apply-flow upsell, and the order-creation route
// can't drift out of sync on price.
export type PriorityPack = {
  tier: 1 | 2 | 3;
  label: string;
  credits: number;
  amountPaise: number;
  amountRupees: number;
};

export const PRIORITY_PACKS: PriorityPack[] = [
  { tier: 1, label: "1 Job", credits: 1, amountPaise: 7900, amountRupees: 79 },
  { tier: 2, label: "2 Jobs", credits: 2, amountPaise: 9900, amountRupees: 99 },
  { tier: 3, label: "3 Jobs", credits: 3, amountPaise: 11900, amountRupees: 119 },
];

export function getPackByTier(tier: number): PriorityPack | undefined {
  return PRIORITY_PACKS.find((p) => p.tier === tier);
}

// Credits expire 90 days after purchase -- bounded liability instead of an
// indefinitely-open prepaid balance, matches how similar credit-pack
// products (interview prep, resume review) typically work.
export const PRIORITY_CREDIT_VALIDITY_DAYS = 90;
