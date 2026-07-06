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

// ---- CTC dropdown (LPA, in whole-lakh increments 0-120, plus a 120L+ ceiling) ----
export type CtcOption = { value: number | null; label: string };

export const ctcOptions: CtcOption[] = [
  ...Array.from({ length: 121 }, (_, i) => ({ value: i, label: i === 0 ? "0 LPA" : `${i} LPA` })),
  { value: 121, label: "120L+" }, // sentinel: stored as 121 to distinguish from an exact 120
];

// ---- Experience dropdown (Fresher + 1-40 years, plus a 40+ ceiling) ----
export type ExperienceOption = { value: number; label: string };

export const experienceOptions: ExperienceOption[] = [
  { value: 0, label: "Fresher" },
  ...Array.from({ length: 40 }, (_, i) => {
    const years = i + 1;
    return { value: years, label: years === 1 ? "1 year" : `${years} years` };
  }),
  { value: 41, label: "40+ years" },
];

// ---- Skill suggestions, keyed by sub-domain, so the form feels tailored rather than generic ----
export const skillSuggestionsBySubDomain: Record<string, string[]> = {
  "SaaS Sales": [
    "Salesforce",
    "HubSpot",
    "Cold Calling",
    "Solution Selling",
    "MEDDIC",
    "Demoing",
    "Negotiation",
    "LinkedIn Sales Navigator",
    "Outbound Prospecting",
    "Pipeline Management",
  ],
  "Enterprise Sales (Non-SaaS)": [
    "Account-Based Selling",
    "Stakeholder Management",
    "RFP Response",
    "Contract Negotiation",
    "Solution Selling",
    "C-Suite Selling",
    "Salesforce",
    "Relationship Management",
  ],
  "Government / Institutional Sales": [
    "Tendering",
    "GeM Portal",
    "RFP Response",
    "Compliance",
    "Relationship Management",
    "Public Procurement",
    "Contract Negotiation",
  ],
  "Inside Sales (B2B)": [
    "Cold Calling",
    "Lead Qualification",
    "CRM (Salesforce/HubSpot)",
    "Email Outreach",
    "Objection Handling",
    "Pipeline Management",
    "Discovery Calls",
  ],
  "Channel / Partner / Distribution Sales": [
    "Channel Management",
    "Distributor Relationships",
    "Partner Enablement",
    "Negotiation",
    "Territory Planning",
    "Forecasting",
  ],
  "Healthcare / Pharma Sales": [
    "Medical Detailing",
    "Doctor Relationship Management",
    "Product Knowledge",
    "Territory Management",
    "Compliance",
    "Key Account Management",
  ],
  "Inside Sales (B2C)": [
    "Cold Calling",
    "Objection Handling",
    "CRM",
    "Upselling",
    "Target Achievement",
    "Customer Counselling",
  ],
  EdTech: [
    "Consultative Selling",
    "Counselling",
    "Cold Calling",
    "CRM (LeadSquared)",
    "Objection Handling",
    "Target Achievement",
  ],
  "BFSI (Fintech / Finance / Loan / Insurance)": [
    "IRDAI Certification",
    "Cross-Selling",
    "Bancassurance",
    "Loan Sourcing",
    "Financial Advisory",
    "Compliance",
  ],
  "Retail Sales": [
    "Customer Service",
    "Upselling",
    "Visual Merchandising",
    "Inventory Awareness",
    "Target Achievement",
    "POS Systems",
  ],
  "Real Estate": [
    "Site Visits",
    "CRM",
    "Local Market Knowledge",
    "Negotiation",
    "Lead Conversion",
    "Client Relationship Management",
  ],
  "Other Consumer Sales": ["Customer Service", "Negotiation", "Target Achievement", "CRM", "Upselling"],
  Marketing: ["Content Strategy", "Campaign Management", "SEO/SEM", "Analytics", "Brand Management"],
  Operations: ["Process Improvement", "Vendor Management", "SOPs", "Cross-functional Coordination"],
  "Customer Success": ["Account Management", "Onboarding", "Retention Strategy", "Upselling", "CRM"],
  Other: [],
};

export function skillSuggestionsFor(subDomain: string | null): string[] {
  if (!subDomain) return [];
  return skillSuggestionsBySubDomain[subDomain] ?? [];
}
