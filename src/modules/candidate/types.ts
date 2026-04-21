import {
  avgTicketSizeOptions,
  b2bCustomerSegmentOptions,
  b2bPersonaOptions,
  b2cCustomerProfileOptions,
  b2cProductServiceOptions,
  b2cSalesChannelOptions,
  channelTypeOptions,
  crmSalesPlatformOptions,
  gemPortalOptions,
  govtSegmentOptions,
  marketFocusOptions,
  offeringTypeOptions,
  partnersManagedRangeOptions,
  rfpExperienceOptions,
  salesMethodologyOptions,
  seniorSellingExperienceOptions,
  tenderExperienceOptions,
  teamSizeOptions,
  binaryChoiceOptions,
} from "@/modules/shared/options";

export type Currency = "INR" | "USD";

export interface CandidateProfilePayload {
  dob: string;
  currentCity: string;
  preferredCities: string[];
  relocationPreference: "YES" | "NO" | "MAYBE";
  travelPreference: "LOW" | "MEDIUM" | "HIGH";
  workMode: "ONSITE" | "HYBRID" | "REMOTE";
  primarySalesCategory: "B2B" | "B2C" | "BOTH";
  profileVisibility: boolean;
}

export interface CandidateCareerPayload {
  totalWorkExperience: "FRESHER" | "LT_1" | "Y1_2" | "Y2_3" | "Y3_5" | "Y5_7" | "Y7_10" | "Y10_12" | "Y12_15" | "Y15_20" | "GT_20";
  totalSalesExperience: "FRESHER" | "LT_1" | "Y1_2" | "Y2_3" | "Y3_5" | "Y5_7" | "Y7_10" | "Y10_12" | "Y12_15" | "Y15_20" | "GT_20";
  employmentStatus: "EMPLOYED" | "SERVING_NOTICE" | "FREELANCING" | "BETWEEN_JOBS" | "FIRST_JOB_SEEKER";
  currentRoleLevel: "SALES_TRAINEE" | "SALES_EXECUTIVE" | "SENIOR_SALES_EXECUTIVE" | "TEAM_LEAD_IC" | "SENIOR_TEAM_LEAD_IC" | "ASSISTANT_MANAGER" | "DEPUTY_MANAGER" | "MANAGER" | "SENIOR_MANAGER" | "AGM" | "DGM" | "GENERAL_MANAGER" | "ASSOCIATE_DIRECTOR" | "DIRECTOR" | "SENIOR_DIRECTOR" | "VICE_PRESIDENT" | "SENIOR_VP" | "EXECUTIVE_VP" | "CRO" | "CSO" | "CBO" | "CCO" | "CEO_CO_FOUNDER" | "PRESIDENT_SALES";
  highestRoleLevel: "SALES_TRAINEE" | "SALES_EXECUTIVE" | "SENIOR_SALES_EXECUTIVE" | "TEAM_LEAD_IC" | "SENIOR_TEAM_LEAD_IC" | "ASSISTANT_MANAGER" | "DEPUTY_MANAGER" | "MANAGER" | "SENIOR_MANAGER" | "AGM" | "DGM" | "GENERAL_MANAGER" | "ASSOCIATE_DIRECTOR" | "DIRECTOR" | "SENIOR_DIRECTOR" | "VICE_PRESIDENT" | "SENIOR_VP" | "EXECUTIVE_VP" | "CRO" | "CSO" | "CBO" | "CCO" | "CEO_CO_FOUNDER" | "PRESIDENT_SALES";
  salesSubtypes: string[];
  industriesWorkedIn: string[];
  industriesSoldInto: string[];
  customerSegments: string[];
  geographyCovered: string[];
  markets: string[];
  highestQuotaValue: number;
  quotaCurrency: Currency;
  teamManagement: boolean;
  largestTeamManaged: "NA" | "ONE_TO_THREE" | "FOUR_TO_TEN" | "ELEVEN_TO_TWENTY_FIVE" | "TWENTY_SIX_TO_FIFTY" | "FIFTY_ONE_TO_ONE_HUNDRED" | "ONE_HUNDRED_ONE_TO_TWO_HUNDRED" | "TWO_HUNDRED_TO_FIVE_HUNDRED" | "GT_FIVE_HUNDRED";
  openToStartup: "YES_EXCITED" | "YES_OPEN" | "NEUTRAL" | "PREFER_ESTABLISHED" | "NO";
}

export interface B2BContext {
  customerSegment: (typeof b2bCustomerSegmentOptions)[number];
  offeringType: (typeof offeringTypeOptions)[number];
  salesMethodologies: Array<(typeof salesMethodologyOptions)[number]>;
  cSuiteSelling: (typeof seniorSellingExperienceOptions)[number];
  rfpExperience: (typeof rfpExperienceOptions)[number];
  personas: Array<(typeof b2bPersonaOptions)[number]>;
  channelType: Array<(typeof channelTypeOptions)[number]>;
  partnersManaged: (typeof partnersManagedRangeOptions)[number];
  govtSegment: Array<(typeof govtSegmentOptions)[number]>;
  gemExperience: (typeof gemPortalOptions)[number];
  tenderExperience: (typeof tenderExperienceOptions)[number];
  marketFocus: Array<(typeof marketFocusOptions)[number]>;
}

export interface B2CContext {
  salesChannels: Array<(typeof b2cSalesChannelOptions)[number]>;
  productsSold: Array<(typeof b2cProductServiceOptions)[number]>;
  avgTicketSize: (typeof avgTicketSizeOptions)[number];
  customerProfile: Array<(typeof b2cCustomerProfileOptions)[number]>;
  teamSize: (typeof teamSizeOptions)[number];
  distributorManaged: (typeof binaryChoiceOptions)[number];
  beatPlanning: (typeof binaryChoiceOptions)[number];
}

export interface JobPayload {
  id?: string;
  companyName: string;
  designation: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  jobSalesType: "B2B" | "B2C" | "BOTH";
  salesSubtype: string[];
  roleLevel: "SALES_TRAINEE" | "SALES_EXECUTIVE" | "SENIOR_SALES_EXECUTIVE" | "TEAM_LEAD_IC" | "SENIOR_TEAM_LEAD_IC" | "ASSISTANT_MANAGER" | "DEPUTY_MANAGER" | "MANAGER" | "SENIOR_MANAGER" | "AGM" | "DGM" | "GENERAL_MANAGER" | "ASSOCIATE_DIRECTOR" | "DIRECTOR" | "SENIOR_DIRECTOR" | "VICE_PRESIDENT" | "SENIOR_VP" | "EXECUTIVE_VP" | "CRO" | "CSO" | "CBO" | "CCO" | "CEO_CO_FOUNDER" | "PRESIDENT_SALES";
  industry: string;
  industriesSoldInto: string[];
  geography: string[];
  directReports: number;
  reasonForLeaving: "BETTER_OPPORTUNITY" | "COMPENSATION" | "GROWTH" | "RELOCATION" | "LAYOFF" | "PERSONAL" | "STILL_EMPLOYED";
  quotaValue: number;
  quotaCurrency: Currency;
  quotaAttainment: "BELOW_50" | "FROM_50_TO_75" | "FROM_75_TO_90" | "FROM_90_TO_100" | "FROM_100_TO_110" | "FROM_110_TO_125" | "GT_125";
  quotaBasis: "REVENUE" | "VOLUME" | "NEW_ACCOUNTS" | "ARR_MRR" | "AUM" | "POLICIES" | "LOANS_DISBURSED";
  dealSizeRange: "SMALL" | "MEDIUM" | "LARGE" | "ENTERPRISE";
  salesCycle:
    | "SAME_DAY"
    | "LT_1_WEEK"
    | "W1_TO_4_WEEKS"
    | "M1_TO_3_MONTHS"
    | "M3_TO_6_MONTHS"
    | "M6_TO_12_MONTHS"
    | "GT_12_MONTHS";
  hunterPercentage: number;
  b2bContext?: B2BContext;
  b2cContext?: B2CContext;
}

export interface SkillsPayload {
  skills: Array<{ name: string; category: string; isCore: boolean }>;
  toolsCrm: Array<(typeof crmSalesPlatformOptions)[number]>;
  certifications: string[];
  achievements: Array<{ description: string }>;
}

export interface CompensationPayload {
  currentFixed: number;
  currentVariable: number;
  expectedMin: number;
  expectedIdeal: number;
  esopPreference: "YES_KEY_CRITERION" | "YES_OPEN" | "NEUTRAL" | "NO";
  noticePeriod: "IMMEDIATE" | "DAYS_15" | "DAYS_30" | "DAYS_45" | "DAYS_60" | "DAYS_90" | "GT_DAYS_90" | "NEGOTIABLE";
  salaryFlexibility: "FIXED" | "SLIGHTLY_FLEXIBLE" | "OPEN_FOR_RIGHT_ROLE" | "VERY_FLEXIBLE_ESOP_GROWTH";
}

export interface DocumentsPayload {
  resume?: File;
  salaryProof?: File;
  linkedinUrl?: string;
}

export interface OnboardingSnapshot {
  profile?: CandidateProfilePayload;
  career?: CandidateCareerPayload;
  jobs: JobPayload[];
  skills?: SkillsPayload;
  compensation?: CompensationPayload;
  documents?: { linkedinUrl?: string; resumeUrl?: string; salaryProofUrl?: string };
  profileScore?: number;
}
