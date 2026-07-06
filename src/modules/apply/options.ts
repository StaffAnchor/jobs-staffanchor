// Options used by the public candidate intake wizard (no-login "Apply" flow).
// Sub-domain lists mirror the taxonomy used on the StaffAnchor marketing site
// and in the seeded Supabase demo data, so recruiter-side filtering lines up.

export const categoryOptions = [
  { value: "b2b_sales", label: "B2B Sales" },
  { value: "b2c_sales", label: "B2C Sales" },
  { value: "non_sales", label: "Non-Sales / Other" },
] as const;

export type CategoryValue = (typeof categoryOptions)[number]["value"];

export const b2bSubDomains = [
  "SaaS Sales",
  "Enterprise Sales (Non-SaaS)",
  "Government / Institutional Sales",
  "Inside Sales (B2B)",
  "Channel / Partner / Distribution Sales",
  "Healthcare / Pharma Sales",
];

export const b2cSubDomains = [
  "Inside Sales (B2C)",
  "EdTech",
  "BFSI (Fintech / Finance / Loan / Insurance)",
  "Retail Sales",
  "Real Estate",
  "Other Consumer Sales",
];

export const nonSalesSubDomains = ["Marketing", "Operations", "Customer Success", "Other"];

export const roleLevelOptions = [
  "IC – Sales Development",
  "IC – Account Executive",
  "IC",
  "Manager",
  "Senior Manager",
  "Director",
  "VP / Head",
];

export const dealSizeOptions = ["<5L", "5-25L", "25L-1Cr", "1Cr+"];
export const ticketSizeOptions = ["<1L", "1-5L", "5-25L", "25L+"];
export const defaultNoticePeriods = ["Immediate", "15 days", "30 days", "60 days", "90+ days"];

export const salesCycleOptions = [
  "Same day",
  "<1 week",
  "1-4 weeks",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "12+ months",
];

export const sellingStyleOptions = ["Hunter", "Farmer", "Hybrid"];

export const salesMotionOptions = [
  "Outbound-Hunting",
  "Inbound",
  "Account-based",
  "Channel-led",
  "Field / On-ground",
];

export const customerSegmentOptions = ["SMB", "Mid-Market", "Enterprise", "MNC", "Startup", "Government"];

export const funnelStageOptions = ["Acquisition", "Full-funnel", "Retention / Upsell"];

export const workModeOptions = ["Onsite", "Hybrid", "Remote"];
export const relocationOptions = ["Yes", "No", "Maybe"];

export const highestQualificationOptions = [
  "High School",
  "Diploma",
  "Bachelor's Degree",
  "Master's Degree / MBA",
  "Other",
];

export const employmentStatusOptions = [
  "Employed",
  "Serving Notice",
  "Freelancing",
  "Between Jobs",
  "First Job Seeker",
];

export function subDomainsForCategory(category: CategoryValue | null): string[] {
  if (category === "b2b_sales") return b2bSubDomains;
  if (category === "b2c_sales") return b2cSubDomains;
  if (category === "non_sales") return nonSalesSubDomains;
  return [];
}
