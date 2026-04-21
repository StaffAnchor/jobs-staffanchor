export const primarySalesCategoryOptions = ["B2B", "B2C", "BOTH"] as const;
export const relocationPreferenceOptions = ["YES", "NO", "MAYBE"] as const;
export const travelPreferenceOptions = ["LOW", "MEDIUM", "HIGH"] as const;
export const workModeOptions = ["ONSITE", "HYBRID", "REMOTE"] as const;
export const experienceRangeOptions = ["FRESHER", "LT_1", "Y1_2", "Y2_3", "Y3_5", "Y5_7", "Y7_10", "Y10_12", "Y12_15", "Y15_20", "GT_20"] as const;
export const experienceRangeOptionLabels = {
	FRESHER: "Fresher",
	LT_1: "Less than 1 year",
	Y1_2: "1-2 years",
	Y2_3: "2-3 years",
	Y3_5: "3-5 years",
	Y5_7: "5-7 years",
	Y7_10: "7-10 years",
	Y10_12: "10-12 years",
	Y12_15: "12-15 years",
	Y15_20: "15-20 years",
	GT_20: "20+ years",
} as const;
export const employmentStatusOptions = ["EMPLOYED", "SERVING_NOTICE", "FREELANCING", "BETWEEN_JOBS", "FIRST_JOB_SEEKER"] as const;
export const employmentStatusOptionLabels = {
  EMPLOYED: "Employed - Full-time",
  SERVING_NOTICE: "Serving Notice",
  FREELANCING: "Freelancing",
  BETWEEN_JOBS: "Between Jobs",
  FIRST_JOB_SEEKER: "First Job Seeker",
} as const;
export const quotaCurrencyOptions = ["INR", "USD"] as const;
export const largestTeamManagedOptions = ["NA", "ONE_TO_THREE", "FOUR_TO_TEN", "ELEVEN_TO_TWENTY_FIVE", "TWENTY_SIX_TO_FIFTY", "FIFTY_ONE_TO_ONE_HUNDRED", "ONE_HUNDRED_ONE_TO_TWO_HUNDRED", "TWO_HUNDRED_TO_FIVE_HUNDRED", "GT_FIVE_HUNDRED"] as const;
export const largestTeamManagedOptionLabels = {
  NA: "N/A",
  ONE_TO_THREE: "1-3",
  FOUR_TO_TEN: "4-10",
  ELEVEN_TO_TWENTY_FIVE: "11-25",
  TWENTY_SIX_TO_FIFTY: "26-50",
  FIFTY_ONE_TO_ONE_HUNDRED: "51-100",
  ONE_HUNDRED_ONE_TO_TWO_HUNDRED: "101-200",
  TWO_HUNDRED_TO_FIVE_HUNDRED: "200-500",
  GT_FIVE_HUNDRED: "500+",
} as const;
export const startupPreferenceOptions = ["YES_EXCITED", "YES_OPEN", "NEUTRAL", "PREFER_ESTABLISHED", "NO"] as const;
export const startupPreferenceOptionLabels = {
  YES_EXCITED: "Yes - Excited",
  YES_OPEN: "Yes - Open",
  NEUTRAL: "Neutral",
  PREFER_ESTABLISHED: "Prefer Established",
  NO: "No",
} as const;
export const jobSalesTypeOptions = ["B2B", "B2C", "BOTH"] as const;
export const reasonForLeavingOptions = ["BETTER_OPPORTUNITY", "COMPENSATION", "GROWTH", "RELOCATION", "LAYOFF", "PERSONAL", "STILL_EMPLOYED"] as const;
export const reasonForLeavingOptionLabels = {
  BETTER_OPPORTUNITY: "Better Opportunity",
  COMPENSATION: "Compensation",
  GROWTH: "Growth",
  RELOCATION: "Relocation",
  LAYOFF: "Layoff",
  PERSONAL: "Personal",
  STILL_EMPLOYED: "Still Employed",
} as const;
export const quotaAttainmentOptions = ["BELOW_50", "FROM_50_TO_75", "FROM_75_TO_90", "FROM_90_TO_100", "FROM_100_TO_110", "FROM_110_TO_125", "GT_125"] as const;
export const quotaAttainmentOptionLabels = {
  BELOW_50: "Below 50%",
  FROM_50_TO_75: "50–75%",
  FROM_75_TO_90: "75–90%",
  FROM_90_TO_100: "90–100%",
  FROM_100_TO_110: "100–110%",
  FROM_110_TO_125: "110–125%",
  GT_125: "125%+",
} as const;
export const quotaBasisOptions = ["REVENUE", "VOLUME", "NEW_ACCOUNTS", "ARR_MRR", "AUM", "POLICIES", "LOANS_DISBURSED"] as const;
export const quotaBasisOptionLabels = {
  REVENUE: "Revenue",
  VOLUME: "Volume",
  NEW_ACCOUNTS: "New Accounts",
  ARR_MRR: "ARR / MRR",
  AUM: "AUM",
  POLICIES: "Policies",
  LOANS_DISBURSED: "Loans Disbursed",
} as const;
export const dealSizeRangeOptions = ["SMALL", "MEDIUM", "LARGE", "ENTERPRISE"] as const;
export const salesCycleOptions = [
  "SAME_DAY",
  "LT_1_WEEK",
  "W1_TO_4_WEEKS",
  "M1_TO_3_MONTHS",
  "M3_TO_6_MONTHS",
  "M6_TO_12_MONTHS",
  "GT_12_MONTHS",
] as const;
export const salesCycleOptionLabels = {
  SAME_DAY: "Same day",
  LT_1_WEEK: "<1 week",
  W1_TO_4_WEEKS: "1-4 weeks",
  M1_TO_3_MONTHS: "1-3 months",
  M3_TO_6_MONTHS: "3-6 months",
  M6_TO_12_MONTHS: "6-12 months",
  GT_12_MONTHS: "12+ months",
} as const;
export const b2bCustomerSegmentOptions = ["SMB", "MID_MARKET", "ENTERPRISE", "MNC", "FORTUNE_500", "STARTUP", "CONGLOMERATE"] as const;
export const b2bCustomerSegmentOptionLabels = {
  SMB: "SMB",
  MID_MARKET: "Mid-Market",
  ENTERPRISE: "Enterprise",
  MNC: "MNC",
  FORTUNE_500: "Fortune 500",
  STARTUP: "Startup",
  CONGLOMERATE: "Conglomerate",
} as const;
export const offeringTypeOptions = ["SAAS", "SOFTWARE_LICENSE", "HARDWARE", "IT_SERVICES", "CONSULTING", "PLATFORM", "MANAGED_SERVICES", "COMBO", "OTHER"] as const;
export const offeringTypeOptionLabels = {
  SAAS: "SaaS",
  SOFTWARE_LICENSE: "Software License",
  HARDWARE: "Hardware",
  IT_SERVICES: "IT Services",
  CONSULTING: "Consulting",
  PLATFORM: "Platform",
  MANAGED_SERVICES: "Managed Services",
  COMBO: "Combo",
  OTHER: "Other",
} as const;
export const crmToolOptions = ["SALESFORCE", "HUBSPOT", "ZOHO", "LEADSQUARED", "FRESHSALES", "PIPEDRIVE", "MS_DYNAMICS", "SAP", "ORACLE", "NONE", "OTHER"] as const;
export const crmToolOptionLabels = {
  SALESFORCE: "Salesforce",
  HUBSPOT: "HubSpot",
  ZOHO: "Zoho",
  LEADSQUARED: "Leadsquared",
  FRESHSALES: "Freshsales",
  PIPEDRIVE: "Pipedrive",
  MS_DYNAMICS: "MS Dynamics",
  SAP: "SAP",
  ORACLE: "Oracle",
  NONE: "None",
  OTHER: "Other",
} as const;
export const crmSalesPlatformOptions = [
  "SALESFORCE",
  "HUBSPOT",
  "ZOHO_CRM",
  "LEADSQUARED",
  "FRESHSALES",
  "PIPEDRIVE",
  "MS_DYNAMICS_365",
  "SAP_CRM",
  "ORACLE_SALES_CLOUD",
  "OUTREACH_IO",
  "APOLLO_IO",
  "LINKEDIN_SALES_NAVIGATOR",
  "LUSHA",
  "ZOOMINFO",
  "KASPR",
  "GONG",
  "CHORUS",
  "CLARI",
  "TABLEAU",
  "POWER_BI",
  "EXCEL_ADVANCED",
  "GOOGLE_SHEETS",
  "NOTION_CRM_USAGE",
  "SLACK",
  "GEM_PORTAL",
] as const;
export const crmSalesPlatformOptionLabels = {
  SALESFORCE: "Salesforce",
  HUBSPOT: "HubSpot",
  ZOHO_CRM: "Zoho CRM",
  LEADSQUARED: "Leadsquared",
  FRESHSALES: "Freshsales",
  PIPEDRIVE: "Pipedrive",
  MS_DYNAMICS_365: "MS Dynamics 365",
  SAP_CRM: "SAP CRM",
  ORACLE_SALES_CLOUD: "Oracle Sales Cloud",
  OUTREACH_IO: "Outreach.io",
  APOLLO_IO: "Apollo.io",
  LINKEDIN_SALES_NAVIGATOR: "LinkedIn Sales Navigator",
  LUSHA: "Lusha",
  ZOOMINFO: "ZoomInfo",
  KASPR: "Kaspr",
  GONG: "Gong",
  CHORUS: "Chorus",
  CLARI: "Clari",
  TABLEAU: "Tableau",
  POWER_BI: "Power BI",
  EXCEL_ADVANCED: "Excel (Advanced)",
  GOOGLE_SHEETS: "Google Sheets",
  NOTION_CRM_USAGE: "Notion (CRM Usage)",
  SLACK: "Slack",
  GEM_PORTAL: "GeM Portal",
} as const;
export const salesMethodologyOptions = ["MEDDIC", "MEDDPICC", "SPIN_SELLING", "CHALLENGER", "SANDLER", "SOLUTION_SELLING", "CONSULTATIVE", "NONE"] as const;
export const salesMethodologyOptionLabels = {
  MEDDIC: "MEDDIC",
  MEDDPICC: "MEDDPICC",
  SPIN_SELLING: "SPIN Selling",
  CHALLENGER: "Challenger",
  SANDLER: "Sandler",
  SOLUTION_SELLING: "Solution Selling",
  CONSULTATIVE: "Consultative",
  NONE: "None",
} as const;
export const seniorSellingExperienceOptions = ["YES_REGULARLY", "OCCASIONALLY", "NO"] as const;
export const seniorSellingExperienceOptionLabels = {
  YES_REGULARLY: "Yes, regularly",
  OCCASIONALLY: "Occasionally",
  NO: "No",
} as const;
export const rfpExperienceOptions = ["YES_FREQUENTLY", "OCCASIONALLY", "NO"] as const;
export const rfpExperienceOptionLabels = {
  YES_FREQUENTLY: "Yes, frequently",
  OCCASIONALLY: "Occasionally",
  NO: "No",
} as const;
export const b2bPersonaOptions = ["CXO", "VP_DIRECTOR", "IT_MANAGER", "FINANCE", "HR", "PROCUREMENT", "OPERATIONS", "BUSINESS_OWNER"] as const;
export const b2bPersonaOptionLabels = {
  CXO: "CXO",
  VP_DIRECTOR: "VP-Director",
  IT_MANAGER: "IT Manager",
  FINANCE: "Finance",
  HR: "HR",
  PROCUREMENT: "Procurement",
  OPERATIONS: "Operations",
  BUSINESS_OWNER: "Business Owner",
} as const;
export const channelTypeOptions = ["DISTRIBUTORS", "DEALERS", "RESELLERS", "VARS", "SYSTEM_INTEGRATORS", "DSA", "FRANCHISE"] as const;
export const channelTypeOptionLabels = {
  DISTRIBUTORS: "Distributors",
  DEALERS: "Dealers",
  RESELLERS: "Resellers",
  VARS: "VARs",
  SYSTEM_INTEGRATORS: "System Integrators",
  DSA: "DSA",
  FRANCHISE: "Franchise",
} as const;
export const partnersManagedRangeOptions = ["ONE_TO_FIVE", "FIVE_TO_FIFTEEN", "FIFTEEN_TO_THIRTY", "THIRTY_TO_FIFTY", "FIFTY_TO_ONE_HUNDRED", "ONE_HUNDRED_TO_TWO_HUNDRED", "TWO_HUNDRED_PLUS"] as const;
export const partnersManagedRangeOptionLabels = {
  ONE_TO_FIVE: "1–5",
  FIVE_TO_FIFTEEN: "5–15",
  FIFTEEN_TO_THIRTY: "15–30",
  THIRTY_TO_FIFTY: "30–50",
  FIFTY_TO_ONE_HUNDRED: "50–100",
  ONE_HUNDRED_TO_TWO_HUNDRED: "100–200",
  TWO_HUNDRED_PLUS: "200+",
} as const;
export const govtSegmentOptions = ["CENTRAL_GOVT", "STATE_GOVT", "PSU", "MUNICIPAL", "DEFENCE", "RAILWAYS", "SMART_CITY"] as const;
export const govtSegmentOptionLabels = {
  CENTRAL_GOVT: "Central Govt",
  STATE_GOVT: "State Govt",
  PSU: "PSU",
  MUNICIPAL: "Municipal",
  DEFENCE: "Defence",
  RAILWAYS: "Railways",
  SMART_CITY: "Smart City",
} as const;
export const gemPortalOptions = ["YES_ACTIVE_SELLER", "OCCASIONALLY", "NO"] as const;
export const gemPortalOptionLabels = {
  YES_ACTIVE_SELLER: "Yes, active seller",
  OCCASIONALLY: "Occasionally",
  NO: "No",
} as const;
export const tenderExperienceOptions = ["YES_FREQUENTLY", "OCCASIONALLY", "NO"] as const;
export const tenderExperienceOptionLabels = {
  YES_FREQUENTLY: "Yes, frequently",
  OCCASIONALLY: "Occasionally",
  NO: "No",
} as const;
export const marketFocusOptions = ["US_ENTERPRISE", "US_MID_MARKET", "UK", "MIDDLE_EAST", "EUROPE", "SOUTHEAST_ASIA", "APAC"] as const;
export const marketFocusOptionLabels = {
  US_ENTERPRISE: "US Enterprise",
  US_MID_MARKET: "US Mid-Market",
  UK: "UK",
  MIDDLE_EAST: "Middle East",
  EUROPE: "Europe",
  SOUTHEAST_ASIA: "Southeast Asia",
  APAC: "APAC",
} as const;

export const b2cSalesChannelOptions = [
  "RETAIL",
  "COUNTER",
  "DOOR_TO_DOOR",
  "TELE_SALES_INBOUND",
  "TELE_SALES_OUTBOUND",
  "VIDEO",
  "WHATSAPP",
  "DSA",
  "BANCASSURANCE",
  "APP_BASED",
  "KIOSK",
  "EXHIBITIONS",
] as const;
export const b2cSalesChannelOptionLabels = {
  RETAIL: "Retail",
  COUNTER: "Counter",
  DOOR_TO_DOOR: "Door-to-Door",
  TELE_SALES_INBOUND: "Tele-Sales Inbound",
  TELE_SALES_OUTBOUND: "Tele-Sales Outbound",
  VIDEO: "Video",
  WHATSAPP: "WhatsApp",
  DSA: "DSA",
  BANCASSURANCE: "Bancassurance",
  APP_BASED: "App-based",
  KIOSK: "Kiosk",
  EXHIBITIONS: "Exhibitions",
} as const;

export const b2cProductServiceOptions = [
  "HOME_LOAN",
  "PERSONAL_LOAN",
  "VEHICLE_LOAN",
  "GOLD_LOAN",
  "LIFE_INSURANCE",
  "HEALTH_INSURANCE",
  "TERM",
  "ULIP",
  "MOTOR_INSURANCE",
  "MUTUAL_FUNDS",
  "CREDIT_CARDS",
  "CASA",
  "REAL_ESTATE",
  "EDTECH",
  "FMCG",
  "CONSUMER_DURABLES",
  "AUTOMOBILES",
  "LUXURY",
  "OTC_PHARMA",
] as const;
export const b2cProductServiceOptionLabels = {
  HOME_LOAN: "Home Loan",
  PERSONAL_LOAN: "Personal Loan",
  VEHICLE_LOAN: "Vehicle Loan",
  GOLD_LOAN: "Gold Loan",
  LIFE_INSURANCE: "Life Insurance",
  HEALTH_INSURANCE: "Health Insurance",
  TERM: "Term",
  ULIP: "ULIP",
  MOTOR_INSURANCE: "Motor Insurance",
  MUTUAL_FUNDS: "Mutual Funds",
  CREDIT_CARDS: "Credit Cards",
  CASA: "CASA",
  REAL_ESTATE: "Real Estate",
  EDTECH: "EdTech",
  FMCG: "FMCG",
  CONSUMER_DURABLES: "Consumer Durables",
  AUTOMOBILES: "Automobiles",
  LUXURY: "Luxury",
  OTC_PHARMA: "OTC Pharma",
} as const;

export const avgTicketSizeOptions = ["LT_5K", "FROM_5K_TO_25K", "FROM_25K_TO_1L", "FROM_1L_TO_5L", "FROM_5L_TO_25L", "FROM_25L_TO_1CR", "GT_1CR"] as const;
export const avgTicketSizeOptionLabels = {
  LT_5K: "<₹5K",
  FROM_5K_TO_25K: "₹5K–₹25K",
  FROM_25K_TO_1L: "₹25K–₹1L",
  FROM_1L_TO_5L: "₹1L–₹5L",
  FROM_5L_TO_25L: "₹5L–₹25L",
  FROM_25L_TO_1CR: "₹25L–₹1Cr",
  GT_1CR: "₹1Cr+",
} as const; 

export const b2cCustomerProfileOptions = ["MASS_MARKET", "URBAN_MIDDLE_CLASS", "HNI", "YOUTH_STUDENTS", "SENIOR_CITIZENS", "BUSINESS_OWNERS"] as const;
export const b2cCustomerProfileOptionLabels = {
  MASS_MARKET: "Mass Market",
  URBAN_MIDDLE_CLASS: "Urban Middle Class",
  HNI: "HNI",
  YOUTH_STUDENTS: "Youth/Students",
  SENIOR_CITIZENS: "Senior Citizens",
  BUSINESS_OWNERS: "Business Owners",
} as const;

export const teamSizeOptions = ["NA", "ONE_TO_FIVE", "SIX_TO_FIFTEEN", "SIXTEEN_TO_THIRTY", "THIRTY_ONE_TO_FIFTY", "FIFTY_ONE_TO_ONE_HUNDRED", "ONE_HUNDRED_ONE_TO_TWO_HUNDRED", "TWO_HUNDRED_TO_FIVE_HUNDRED", "GT_FIVE_HUNDRED"] as const;
export const teamSizeOptionLabels = {
  NA: "N/A",
  ONE_TO_FIVE: "1–5",
  SIX_TO_FIFTEEN: "6–15",
  SIXTEEN_TO_THIRTY: "16–30",
  THIRTY_ONE_TO_FIFTY: "31–50",
  FIFTY_ONE_TO_ONE_HUNDRED: "51–100",
  ONE_HUNDRED_ONE_TO_TWO_HUNDRED: "101–200",
  TWO_HUNDRED_TO_FIVE_HUNDRED: "200–500",
  GT_FIVE_HUNDRED: "500+",
} as const;

export const distributorManagedOptionLabels = {
  YES: "Yes, managed",
  NO: "No",
} as const;

export const beatPlanningOptionLabels = {
  YES: "Yes",
  NO: "No",
} as const;

export const binaryChoiceOptions = ["YES", "NO"] as const;
export const esopPreferenceOptions = ["YES_KEY_CRITERION", "YES_OPEN", "NEUTRAL", "NO"] as const;
export const esopPreferenceOptionLabels = {
  YES_KEY_CRITERION: "Yes, Key Criterion (accept lower fixed)",
  YES_OPEN: "Yes, Open",
  NEUTRAL: "Neutral",
  NO: "No",
} as const;
export const noticePeriodOptions = ["IMMEDIATE", "DAYS_15", "DAYS_30", "DAYS_45", "DAYS_60", "DAYS_90", "GT_DAYS_90", "NEGOTIABLE"] as const;
export const noticePeriodOptionLabels = {
  IMMEDIATE: "Immediately",
  DAYS_15: "15 days",
  DAYS_30: "30 days",
  DAYS_45: "45 days",
  DAYS_60: "60 days",
  DAYS_90: "90 days",
  GT_DAYS_90: ">90 days",
  NEGOTIABLE: "Negotiable",
} as const;
export const salaryFlexibilityOptions = ["FIXED", "SLIGHTLY_FLEXIBLE", "OPEN_FOR_RIGHT_ROLE", "VERY_FLEXIBLE_ESOP_GROWTH"] as const;
export const salaryFlexibilityOptionLabels = {
  FIXED: "Fixed",
  SLIGHTLY_FLEXIBLE: "Slightly flexible",
  OPEN_FOR_RIGHT_ROLE: "Open for right role",
  VERY_FLEXIBLE_ESOP_GROWTH: "Very flexible if ESOP/growth strong",
} as const;

export const roleLevelOptions = [
  "SALES_TRAINEE",
  "SALES_EXECUTIVE",
  "SENIOR_SALES_EXECUTIVE",
  "TEAM_LEAD_IC",
  "SENIOR_TEAM_LEAD_IC",
  "ASSISTANT_MANAGER",
  "DEPUTY_MANAGER",
  "MANAGER",
  "SENIOR_MANAGER",
  "AGM",
  "DGM",
  "GENERAL_MANAGER",
  "ASSOCIATE_DIRECTOR",
  "DIRECTOR",
  "SENIOR_DIRECTOR",
  "VICE_PRESIDENT",
  "SENIOR_VP",
  "EXECUTIVE_VP",
  "CRO",
  "CSO",
  "CBO",
  "CCO",
  "CEO_CO_FOUNDER",
  "PRESIDENT_SALES",
] as const;

export const roleLevelBandMap: Record<typeof roleLevelOptions[number], string> = {
  SALES_TRAINEE: "INDIVIDUAL_CONTRIBUTOR",
  SALES_EXECUTIVE: "INDIVIDUAL_CONTRIBUTOR",
  SENIOR_SALES_EXECUTIVE: "INDIVIDUAL_CONTRIBUTOR",
  TEAM_LEAD_IC: "INDIVIDUAL_CONTRIBUTOR",
  SENIOR_TEAM_LEAD_IC: "INDIVIDUAL_CONTRIBUTOR",
  ASSISTANT_MANAGER: "MANAGER",
  DEPUTY_MANAGER: "MANAGER",
  MANAGER: "MANAGER",
  SENIOR_MANAGER: "MANAGER",
  AGM: "MANAGER",
  DGM: "MANAGER",
  GENERAL_MANAGER: "DIRECTOR_VP",
  ASSOCIATE_DIRECTOR: "DIRECTOR_VP",
  DIRECTOR: "DIRECTOR_VP",
  SENIOR_DIRECTOR: "DIRECTOR_VP",
  VICE_PRESIDENT: "DIRECTOR_VP",
  SENIOR_VP: "DIRECTOR_VP",
  EXECUTIVE_VP: "DIRECTOR_VP",
  CRO: "CXO_FOUNDER",
  CSO: "CXO_FOUNDER",
  CBO: "CXO_FOUNDER",
  CCO: "CXO_FOUNDER",
  CEO_CO_FOUNDER: "CXO_FOUNDER",
  PRESIDENT_SALES: "CXO_FOUNDER",
};

export const roleLevelOptionLabels: Record<typeof roleLevelOptions[number], string> = {
  SALES_TRAINEE: "Sales Trainee / Graduate Trainee",
  SALES_EXECUTIVE: "Sales Executive / BDE",
  SENIOR_SALES_EXECUTIVE: "Senior Sales Executive",
  TEAM_LEAD_IC: "Team Lead (Playing Coach)",
  SENIOR_TEAM_LEAD_IC: "Senior Team Lead",
  ASSISTANT_MANAGER: "Assistant Manager (AM)",
  DEPUTY_MANAGER: "Deputy Manager (DM)",
  MANAGER: "Manager",
  SENIOR_MANAGER: "Senior Manager",
  AGM: "Assistant General Manager (AGM)",
  DGM: "Deputy General Manager (DGM)",
  GENERAL_MANAGER: "General Manager (GM)",
  ASSOCIATE_DIRECTOR: "Associate Director",
  DIRECTOR: "Director",
  SENIOR_DIRECTOR: "Senior Director",
  VICE_PRESIDENT: "Vice President (VP)",
  SENIOR_VP: "Senior VP (SVP)",
  EXECUTIVE_VP: "Executive VP (EVP)",
  CRO: "Chief Revenue Officer (CRO)",
  CSO: "Chief Sales Officer (CSO)",
  CBO: "Chief Business Officer (CBO)",
  CCO: "Chief Commercial Officer (CCO)",
  CEO_CO_FOUNDER: "CEO / Co-Founder (Sales-led)",
  PRESIDENT_SALES: "President (Sales)",
};

export const roleBandLabels: Record<string, string> = {
  INDIVIDUAL_CONTRIBUTOR: "Individual Contributor",
  MANAGER: "Manager Band",
  DIRECTOR_VP: "Director / VP Band",
  CXO_FOUNDER: "CXO / Founder Band",
} as const;

export const b2bSalesSubtypeOptions = [
  "CORPORATE_DIRECT_SALES",
  "INSIDE_SALES_B2B",
  "ENTERPRISE_SALES",
  "CHANNEL_PARTNER_SALES",
  "GOVERNMENT_PSU_SALES",
  "INTERNATIONAL_B2B",
  "PRE_SALES_SOLUTIONS_ENGINEERING",
  "SMB_STARTUP_SALES",
] as const;

export const b2bSalesSubtypeOptionLabels = {
  CORPORATE_DIRECT_SALES: "Corporate / Direct Sales",
  INSIDE_SALES_B2B: "Inside Sales (B2B)",
  ENTERPRISE_SALES: "Enterprise Sales",
  CHANNEL_PARTNER_SALES: "Channel / Partner Sales (SIs, VARs, Distributors)",
  GOVERNMENT_PSU_SALES: "Government & PSU Sales",
  INTERNATIONAL_B2B: "International B2B (Outbound from India)",
  PRE_SALES_SOLUTIONS_ENGINEERING: "Pre-Sales / Solutions Engineering",
  SMB_STARTUP_SALES: "SMB / Startup Sales",
} as const;

export const b2cSalesSubtypeOptions = [
  "FIELD_SALES",
  "INSIDE_SALES_TELE_SALES",
  "RETAIL_COUNTER_SALES",
  "FINANCIAL_PRODUCTS",
  "REAL_ESTATE_SALES",
  "EDTECH_COURSE_COUNSELLING",
  "DIGITAL_APP_SOCIAL_SELLING",
  "DSA_FRANCHISE_BROKER_SALES",
] as const;

export const b2cSalesSubtypeOptionLabels = {
  FIELD_SALES: "Field Sales (Door-to-Door / Territory)",
  INSIDE_SALES_TELE_SALES: "Inside Sales / Tele-Sales",
  RETAIL_COUNTER_SALES: "Retail / Counter Sales",
  FINANCIAL_PRODUCTS: "Financial Products (Loans, Insurance, MF)",
  REAL_ESTATE_SALES: "Real Estate Sales",
  EDTECH_COURSE_COUNSELLING: "EdTech / Course Counselling",
  DIGITAL_APP_SOCIAL_SELLING: "Digital / App / Social Selling",
  DSA_FRANCHISE_BROKER_SALES: "DSA / Franchise / Broker Sales",
} as const;

export const customerSegmentOptions = ["SMB", "MID_MARKET", "ENTERPRISE", "MNC", "GOVERNMENT_PSU", "RETAIL_CONSUMERS", "HNI"] as const;
export const customerSegmentOptionLabels = {
  SMB: "SMB",
  MID_MARKET: "Mid-Market",
  ENTERPRISE: "Enterprise",
  MNC: "MNC",
  GOVERNMENT_PSU: "Government / PSU",
  RETAIL_CONSUMERS: "Retail Consumers",
  HNI: "HNI",
} as const;

export const geographyCoveredOptions = ["CITY", "ZONAL", "STATE", "REGIONAL", "NATIONAL", "INTERNATIONAL"] as const;
export const geographyCoveredOptionLabels = {
  CITY: "City",
  ZONAL: "Zonal",
  STATE: "State",
  REGIONAL: "Regional",
  NATIONAL: "National",
  INTERNATIONAL: "International",
} as const;

export const marketSoldToOptions = ["INDIA_DOMESTIC", "US", "UK", "MIDDLE_EAST", "SOUTHEAST_ASIA", "EUROPE", "GLOBAL"] as const;
export const marketSoldToOptionLabels = {
  INDIA_DOMESTIC: "India Domestic",
  US: "US",
  UK: "UK",
  MIDDLE_EAST: "Middle East",
  SOUTHEAST_ASIA: "Southeast Asia",
  EUROPE: "Europe",
  GLOBAL: "Global",
} as const;

export const industryOptions = [
  "SAAS_CLOUD_SOFTWARE",
  "IT_INFRASTRUCTURE_HARDWARE",
  "CYBERSECURITY",
  "ERP_CRM_HRMS_SOFTWARE",
  "AI_ML_PRODUCTS",
  "DATA_ANALYTICS_PLATFORMS",
  "IT_SERVICES_CONSULTING",
  "SYSTEM_INTEGRATION",
  "TELECOM_NETWORKING",
  "SEMICONDUCTORS_ELECTRONICS",
  "IT_SECURITY",
  "LIFE_INSURANCE",
  "HEALTH_GENERAL_INSURANCE",
  "MUTUAL_FUNDS_WEALTH_MANAGEMENT",
  "BANKING_RETAIL",
  "BANKING_CORPORATE_SME",
  "NBFC_MICROFINANCE",
  "FINTECH_DIGITAL_PAYMENTS",
  "STOCK_BROKING_CAPITAL_MARKETS",
  "CREDIT_CARDS_LENDING",
  "REAL_ESTATE_FINANCE",
  "PHARMA_ETHICAL_RX",
  "PHARMA_OTC_CONSUMER",
  "MEDICAL_DEVICES_DIAGNOSTICS",
  "HOSPITAL_HEALTHCARE_SERVICES",
  "BIOTECH",
  "NUTRACEUTICALS_HEALTHTECH",
  "DENTAL_OPTICAL",
  "FMCG",
  "CONSUMER_DURABLES",
  "D2C_BRANDS",
  "FASHION_APPAREL",
  "LUXURY_PREMIUM_GOODS",
  "MODERN_TRADE_RETAIL_CHAINS",
  "QSR_FOOD_BEVERAGE",
  "BEAUTY_PERSONAL_CARE",
  "JEWELLERY",
  "INDUSTRIAL_EQUIPMENT_MACHINERY",
  "AUTOMOTIVE_AUTO_COMPONENTS",
  "CHEMICALS_SPECIALTY_CHEMICALS",
  "STEEL_METALS_MINING",
  "PACKAGING",
  "TEXTILES",
  "RENEWABLE_ENERGY_SOLAR",
  "OIL_GAS_ENERGY",
  "AGROCHEMICALS_SEEDS",
  "CONSTRUCTION_MATERIALS",
  "RESIDENTIAL_REAL_ESTATE",
  "COMMERCIAL_REAL_ESTATE",
  "CO_WORKING_MANAGED_SPACES",
  "INFRASTRUCTURE_EPC_PROJECTS",
  "SMART_CITY_PROJECTS",
  "EDTECH_TRAINING_SKILLING",
  "LOGISTICS_SUPPLY_CHAIN",
  "STAFFING_HR_TECH",
  "MEDIA_ADVERTISING_MARTECH",
  "TRAVEL_HOSPITALITY",
  "EVENTS_EXPERIENTIAL",
  "LEGAL_TECH_PROFESSIONAL_SERVICES",
  "GOVERNMENT_PUBLIC_SECTOR",
  "DEFENCE",
  "NON_PROFIT_SOCIAL_ENTERPRISE",
] as const;

export const industryOptionLabels = {
  SAAS_CLOUD_SOFTWARE: "SaaS / Cloud Software",
  IT_INFRASTRUCTURE_HARDWARE: "IT Infrastructure & Hardware",
  CYBERSECURITY: "Cybersecurity",
  ERP_CRM_HRMS_SOFTWARE: "ERP / CRM / HRMS Software",
  AI_ML_PRODUCTS: "AI / ML Products",
  DATA_ANALYTICS_PLATFORMS: "Data & Analytics Platforms",
  IT_SERVICES_CONSULTING: "IT Services & Consulting",
  SYSTEM_INTEGRATION: "System Integration",
  TELECOM_NETWORKING: "Telecom & Networking",
  SEMICONDUCTORS_ELECTRONICS: "Semiconductors / Electronics",
  IT_SECURITY: "IT Security",
  LIFE_INSURANCE: "Life Insurance",
  HEALTH_GENERAL_INSURANCE: "Health / General Insurance",
  MUTUAL_FUNDS_WEALTH_MANAGEMENT: "Mutual Funds / Wealth Management",
  BANKING_RETAIL: "Banking (Retail)",
  BANKING_CORPORATE_SME: "Banking (Corporate / SME)",
  NBFC_MICROFINANCE: "NBFC / Microfinance",
  FINTECH_DIGITAL_PAYMENTS: "Fintech / Digital Payments",
  STOCK_BROKING_CAPITAL_MARKETS: "Stock Broking / Capital Markets",
  CREDIT_CARDS_LENDING: "Credit Cards / Lending",
  REAL_ESTATE_FINANCE: "Real Estate Finance",
  PHARMA_ETHICAL_RX: "Pharma (Ethical / Rx)",
  PHARMA_OTC_CONSUMER: "Pharma (OTC / Consumer)",
  MEDICAL_DEVICES_DIAGNOSTICS: "Medical Devices & Diagnostics",
  HOSPITAL_HEALTHCARE_SERVICES: "Hospital & Healthcare Services",
  BIOTECH: "Biotech",
  NUTRACEUTICALS_HEALTHTECH: "Nutraceuticals & HealthTech",
  DENTAL_OPTICAL: "Dental / Optical",
  FMCG: "FMCG",
  CONSUMER_DURABLES: "Consumer Durables",
  D2C_BRANDS: "D2C Brands",
  FASHION_APPAREL: "Fashion & Apparel",
  LUXURY_PREMIUM_GOODS: "Luxury & Premium Goods",
  MODERN_TRADE_RETAIL_CHAINS: "Modern Trade / Retail Chains",
  QSR_FOOD_BEVERAGE: "QSR / Food & Beverage",
  BEAUTY_PERSONAL_CARE: "Beauty & Personal Care",
  JEWELLERY: "Jewellery",
  INDUSTRIAL_EQUIPMENT_MACHINERY: "Industrial Equipment & Machinery",
  AUTOMOTIVE_AUTO_COMPONENTS: "Automotive & Auto Components",
  CHEMICALS_SPECIALTY_CHEMICALS: "Chemicals & Specialty Chemicals",
  STEEL_METALS_MINING: "Steel / Metals / Mining",
  PACKAGING: "Packaging",
  TEXTILES: "Textiles",
  RENEWABLE_ENERGY_SOLAR: "Renewable Energy / Solar",
  OIL_GAS_ENERGY: "Oil & Gas / Energy",
  AGROCHEMICALS_SEEDS: "Agrochemicals / Seeds",
  CONSTRUCTION_MATERIALS: "Construction Materials",
  RESIDENTIAL_REAL_ESTATE: "Residential Real Estate",
  COMMERCIAL_REAL_ESTATE: "Commercial Real Estate",
  CO_WORKING_MANAGED_SPACES: "Co-working / Managed Spaces",
  INFRASTRUCTURE_EPC_PROJECTS: "Infrastructure / EPC Projects",
  SMART_CITY_PROJECTS: "Smart City Projects",
  EDTECH_TRAINING_SKILLING: "EdTech / Training & Skilling",
  LOGISTICS_SUPPLY_CHAIN: "Logistics & Supply Chain",
  STAFFING_HR_TECH: "Staffing / HR Tech",
  MEDIA_ADVERTISING_MARTECH: "Media / Advertising / MarTech",
  TRAVEL_HOSPITALITY: "Travel & Hospitality",
  EVENTS_EXPERIENTIAL: "Events & Experiential",
  LEGAL_TECH_PROFESSIONAL_SERVICES: "Legal Tech / Professional Services",
  GOVERNMENT_PUBLIC_SECTOR: "Government / Public Sector",
  DEFENCE: "Defence",
  NON_PROFIT_SOCIAL_ENTERPRISE: "Non-profit / Social Enterprise",
} as const;

export const industryOptionGroups = [
  {
    label: "Technology & Software",
    options: [
      "SAAS_CLOUD_SOFTWARE",
      "IT_INFRASTRUCTURE_HARDWARE",
      "CYBERSECURITY",
      "ERP_CRM_HRMS_SOFTWARE",
      "AI_ML_PRODUCTS",
      "DATA_ANALYTICS_PLATFORMS",
      "IT_SERVICES_CONSULTING",
      "SYSTEM_INTEGRATION",
      "TELECOM_NETWORKING",
      "SEMICONDUCTORS_ELECTRONICS",
      "IT_SECURITY",
    ],
  },
  {
    label: "BFSI",
    options: [
      "LIFE_INSURANCE",
      "HEALTH_GENERAL_INSURANCE",
      "MUTUAL_FUNDS_WEALTH_MANAGEMENT",
      "BANKING_RETAIL",
      "BANKING_CORPORATE_SME",
      "NBFC_MICROFINANCE",
      "FINTECH_DIGITAL_PAYMENTS",
      "STOCK_BROKING_CAPITAL_MARKETS",
      "CREDIT_CARDS_LENDING",
      "REAL_ESTATE_FINANCE",
    ],
  },
  {
    label: "Healthcare & Life Sciences",
    options: [
      "PHARMA_ETHICAL_RX",
      "PHARMA_OTC_CONSUMER",
      "MEDICAL_DEVICES_DIAGNOSTICS",
      "HOSPITAL_HEALTHCARE_SERVICES",
      "BIOTECH",
      "NUTRACEUTICALS_HEALTHTECH",
      "DENTAL_OPTICAL",
    ],
  },
  {
    label: "Consumer & Retail",
    options: [
      "FMCG",
      "CONSUMER_DURABLES",
      "D2C_BRANDS",
      "FASHION_APPAREL",
      "LUXURY_PREMIUM_GOODS",
      "MODERN_TRADE_RETAIL_CHAINS",
      "QSR_FOOD_BEVERAGE",
      "BEAUTY_PERSONAL_CARE",
      "JEWELLERY",
    ],
  },
  {
    label: "Industrial & Manufacturing",
    options: [
      "INDUSTRIAL_EQUIPMENT_MACHINERY",
      "AUTOMOTIVE_AUTO_COMPONENTS",
      "CHEMICALS_SPECIALTY_CHEMICALS",
      "STEEL_METALS_MINING",
      "PACKAGING",
      "TEXTILES",
      "RENEWABLE_ENERGY_SOLAR",
      "OIL_GAS_ENERGY",
      "AGROCHEMICALS_SEEDS",
      "CONSTRUCTION_MATERIALS",
    ],
  },
  {
    label: "Real Estate & Infrastructure",
    options: [
      "RESIDENTIAL_REAL_ESTATE",
      "COMMERCIAL_REAL_ESTATE",
      "CO_WORKING_MANAGED_SPACES",
      "INFRASTRUCTURE_EPC_PROJECTS",
      "SMART_CITY_PROJECTS",
    ],
  },
  {
    label: "Services, EdTech & Others",
    options: [
      "EDTECH_TRAINING_SKILLING",
      "LOGISTICS_SUPPLY_CHAIN",
      "STAFFING_HR_TECH",
      "MEDIA_ADVERTISING_MARTECH",
      "TRAVEL_HOSPITALITY",
      "EVENTS_EXPERIENTIAL",
      "LEGAL_TECH_PROFESSIONAL_SERVICES",
      "GOVERNMENT_PUBLIC_SECTOR",
      "DEFENCE",
      "NON_PROFIT_SOCIAL_ENTERPRISE",
    ],
  },
] as const;
