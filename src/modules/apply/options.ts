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

export const nonSalesSubDomains = [
  "Marketing",
  "Operations",
  "Human Resources (HR)",
  "Finance & Accounts",
  "Customer Success",
  "Information Technology (IT)",
  "Product Management",
  "Business Development / Strategy",
  "Supply Chain & Procurement",
  "Legal & Compliance",
  "Administration",
  "Design (UI/UX/Graphic)",
  "Data & Analytics",
  "Other",
];

export const roleLevelOptions = [
  "IC – Sales Development",
  "IC – Account Executive",
  "IC",
  "Manager",
  "Senior Manager",
  "Director",
  "VP / Head",
];

// Legacy flat lists (kept for reference / backward compatibility) — superseded by
// the currency-aware deal size bands below.
export const dealSizeOptions = ["<5L", "5-25L", "25L-1Cr", "1Cr+"];
export const ticketSizeOptions = ["<1L", "1-5L", "5-25L", "25L+"];

// ---- Currency-aware deal size bands ----
// B2B deal sizes run much higher than B2C ticket sizes, so each gets its own ladder,
// and each is offered in both INR and USD since candidates may quote either.
export const currencyOptions = ["INR", "USD"] as const;
export type CurrencyValue = (typeof currencyOptions)[number];

export const dealSizeBandsB2B: Record<CurrencyValue, string[]> = {
  INR: [
    "<5L",
    "5L-10L",
    "10L-15L",
    "15L-20L",
    "20L-30L",
    "30L-50L",
    "50L-1Cr",
    "1Cr-5Cr",
    "5Cr-10Cr",
    "10Cr-20Cr",
    "20Cr-40Cr",
    "40Cr-75Cr",
    "75Cr+",
  ],
  USD: [
    "<$10K",
    "$10K-$25K",
    "$25K-$50K",
    "$50K-$100K",
    "$100K-$250K",
    "$250K-$500K",
    "$500K-$1M",
    "$1M-$5M",
    "$5M-$10M",
    "$10M+",
  ],
};

// B2C ticket sizes sit much lower than B2B deal sizes.
export const dealSizeBandsB2C: Record<CurrencyValue, string[]> = {
  INR: ["<10K", "10K-25K", "25K-50K", "50K-1L", "1L-2L", "2L-5L", "5L-10L", "10L-25L", "25L+"],
  USD: ["<$500", "$500-$1K", "$1K-$5K", "$5K-$10K", "$10K-$25K", "$25K-$50K", "$50K+"],
};

export function dealSizeBandsFor(category: CategoryValue | null, currency: CurrencyValue | ""): string[] {
  if (!currency) return [];
  if (category === "b2c_sales") return dealSizeBandsB2C[currency];
  return dealSizeBandsB2B[currency];
}

// ---- Role type / team size ----
export const roleTypeOptions = ["Individual Contributor (IC)", "Leading a Team"] as const;

export const teamSizeOptions = [
  "1-5",
  "6-10",
  "11-20",
  "21-30",
  "31-40",
  "41-50",
  "51-75",
  "76-100",
  "101-150",
  "151-200",
  "201-300",
  "301-400",
  "401-500",
  "501-750",
  "751-1000",
  "1000+",
];

// ---- Inside Sales specific fields ----
export const insideSalesSubDomains = ["Inside Sales (B2B)", "Inside Sales (B2C)"];

export const ahtOptions = [
  "<3 mins",
  "3-5 mins",
  "5-8 mins",
  "8-12 mins",
  "12-20 mins",
  "20+ mins",
];

export const dailyCallTargetOptions = [
  "<20",
  "20-40",
  "40-60",
  "60-80",
  "80-100",
  "100-150",
  "150+",
];

export const dailyTalkTimeOptions = [
  "<1 hour",
  "1-2 hours",
  "2-3 hours",
  "3-4 hours",
  "4-5 hours",
  "5+ hours",
];

export const leadSourceOptions = [
  "Inbound",
  "Outbound",
  "Social Media Campaigns",
  "Contact Us / Website Forms",
  "Influencer Leads",
  "Referrals",
  "Paid Ads",
  "Events / Field",
  "Partner / Channel",
];

// ---- Industries (multi-select, so profiles are searchable by industry) ----
export const industryOptions = [
  "SaaS / IT Products",
  "IT Services / Consulting",
  "BFSI (Banking / Fintech / Insurance)",
  "Real Estate",
  "Healthcare / Pharma",
  "EdTech",
  "Retail / E-commerce",
  "FMCG / Consumer Goods",
  "Manufacturing / Industrial",
  "Telecom",
  "Media / Entertainment",
  "Travel / Hospitality",
  "Logistics / Supply Chain",
  "Automotive",
  "Energy / Utilities",
  "Government / Public Sector",
  "NBFC",
  "Insurance",
  "Consulting",
  "Agriculture / Agritech",
  "Other",
];
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

// ---- Master skills list, for typeahead search across ALL domains (not just the
// suggested chips for the candidate's own sub-domain) — "type 's' and relevant
// skills should show up" regardless of specialization. Deduplicated union of every
// sub-domain's suggestions plus general/cross-functional skills.
export const masterSkillsList: string[] = Array.from(
  new Set([
    ...Object.values(skillSuggestionsBySubDomain).flat(),
    "Salesforce",
    "HubSpot",
    "Zoho CRM",
    "LeadSquared",
    "Freshsales",
    "Pipedrive",
    "MS Dynamics 365",
    "SAP CRM",
    "Oracle Sales Cloud",
    "Outreach.io",
    "Apollo.io",
    "LinkedIn Sales Navigator",
    "ZoomInfo",
    "Gong",
    "Clari",
    "MEDDIC",
    "MEDDPICC",
    "SPIN Selling",
    "Challenger Sale",
    "Sandler",
    "Solution Selling",
    "Consultative Selling",
    "Negotiation",
    "Cold Calling",
    "Cold Emailing",
    "Prospecting",
    "Lead Qualification",
    "Discovery Calls",
    "Demoing",
    "Objection Handling",
    "Pipeline Management",
    "Forecasting",
    "Territory Planning",
    "Account Management",
    "Key Account Management",
    "Upselling",
    "Cross-Selling",
    "Renewals Management",
    "Channel Management",
    "Partner Enablement",
    "Contract Negotiation",
    "RFP Response",
    "Tendering",
    "Stakeholder Management",
    "C-Suite Selling",
    "Team Management",
    "Sales Coaching",
    "Sales Enablement",
    "Sales Operations",
    "Data Analysis",
    "Excel (Advanced)",
    "PowerPoint / Presentation Skills",
    "Communication Skills",
    "Public Speaking",
    "Marketing",
    "Digital Marketing",
    "SEO",
    "SEM",
    "Content Strategy",
    "Social Media Marketing",
    "Campaign Management",
    "Brand Management",
    "Product Management",
    "Product Marketing",
    "Project Management",
    "Process Improvement",
    "Vendor Management",
    "SOPs",
    "Recruitment",
    "HR Operations",
    "Payroll",
    "Performance Management",
    "Financial Analysis",
    "Budgeting",
    "Accounting",
    "Taxation",
    "Compliance",
    "Data Analytics",
    "SQL",
    "Power BI",
    "Tableau",
  ])
).sort((a, b) => a.localeCompare(b));

export function searchSkills(query: string, exclude: string[] = [], limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return masterSkillsList
    .filter((skill) => skill.toLowerCase().includes(q) && !exclude.includes(skill))
    .slice(0, limit);
}
