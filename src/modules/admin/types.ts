import type { Currency } from "@/modules/candidate/types";



export type AdminProfileType = "SALES" | "NON_SALES";
export type AdminRelocationPreference = "YES" | "NO" | "MAYBE";
export type AdminTravelPreference = "LOW" | "MEDIUM" | "HIGH";
export type AdminWorkMode = "ONSITE" | "HYBRID" | "REMOTE";
export type AdminProfileVisibilityFilter = "ALL" | "VISIBLE" | "HIDDEN";
export type AdminExperienceRange =
  | "FRESHER"
  | "LT_1"
  | "Y1_2"
  | "Y2_3"
  | "Y3_5"
  | "Y5_7"
  | "Y7_10"
  | "Y10_12"
  | "Y12_15"
  | "Y15_20"
  | "GT_20";

export interface AdminCandidateFilterInput {
  page: number;
  limit: number;
  search?: string;
  profileType?: AdminProfileType[];
  primarySalesCategory?: Array<"B2B" | "B2C" | "BOTH">;
  currentCity?: string[];
  preferredCities?: string[];
  relocationPreference?: AdminRelocationPreference[];
  travelPreference?: AdminTravelPreference[];
  workMode?: AdminWorkMode[];
  profileVisibility?: boolean;
  industriesWorkedIn?: string[];
  industriesSoldInto?: string[];
  roleLevel?: { min?: number; max?: number };
  quota?: { min?: number; max?: number; currency?: Currency };
  b2b?: { offeringType?: string[]; methodology?: string[] };
  b2c?: { channel?: string[]; products?: string[] };
  currentEmployer?: string[];
  currentJobTitle?: string[];
  totalWorkExperience?: AdminExperienceRange[];
  totalSalesExperience?: AdminExperienceRange[];
  functionDepartment?: string[];
  domains?: string[];
  skills?: string[];
  totalExperienceYears?: { min?: number; max?: number };
  currentFixedSalaryLpa?: { min?: number; max?: number };
  city?: string[];
  state?: string[];
  country?: string[];
}

export interface AdminPagedResponse<T> {
  page: number;
  limit: number;
  total: number;
  items: T[];
}

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "CANDIDATE" | "ADMIN";
  profileType: AdminProfileType;
  isVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCareerSnapshot {
  id: string;
  candidateId: string;
  totalWorkExperience: string;
  totalSalesExperience: string;
  employmentStatus: string;
  currentRoleLevel: string;
  highestRoleLevel: string;
  salesSubtypes: string[];
  industriesWorkedIn: string[];
  industriesSoldInto: string[];
  customerSegments: string[];
  geographyCovered: string[];
  markets: string[];
  highestQuotaValue: string;
  quotaCurrency: Currency;
  teamManagement: boolean;
  largestTeamManaged: string;
  openToStartup: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminB2BContext {
  id: string;
  jobId: string;
  customerSegment: string;
  offeringType: string;
  salesMethodologies: string[];
  cSuiteSelling: string;
  rfpExperience: string;
  personas: string[];
  channelType: string[];
  partnersManaged: string;
  govtSegment: string[];
  gemExperience: string;
  tenderExperience: string;
  marketFocus: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminB2CContext {
  id: string;
  jobId: string;
  salesChannels: string[];
  productsSold: string[];
  avgTicketSize: string;
  customerProfile: string[];
  teamSize: string;
  distributorManaged: string;
  beatPlanning: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminJob {
  id: string;
  candidateId: string;
  companyName: string;
  designation: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  jobSalesType: string;
  salesSubtype: string[];
  roleLevel: string;
  industry: string;
  industriesSoldInto: string[];
  geography: string[];
  directReports: number;
  reasonForLeaving: string;
  quotaValue: string;
  quotaCurrency: Currency;
  quotaAttainment: string;
  quotaBasis: string;
  dealSizeRange: string;
  salesCycle: string;
  hunterPercentage: number;
  createdAt: string;
  updatedAt: string;
  b2bContext?: AdminB2BContext | null;
  b2cContext?: AdminB2CContext | null;
}

export interface AdminSkillMaster {
  id: string;
  name: string;
  category: string;
  createdAt: string;
}

export interface AdminCandidateSkill {
  id: string;
  candidateId: string;
  skillId: string;
  isCore: boolean;
  createdAt: string;
  skill: AdminSkillMaster;
}

export interface AdminAchievement {
  id: string;
  candidateId: string;
  description: string;
  createdAt: string;
}

export interface AdminCompensation {
  id: string;
  candidateId: string;
  currentFixed: string;
  currentVariable: string;
  expectedMin: string;
  expectedIdeal: string;
  esopPreference: string;
  noticePeriod: string;
  salaryFlexibility: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDocument {
  id: string;
  candidateId: string;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  salaryProofUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminGeneralCandidateProfile {
  id: string;
  userId: string;
  openToRelocation: "OPEN_TO_RELOCATION" | "NOT_OPEN_TO_RELOCATION";
  city: string;
  state: string;
  country: string;
  postalCode: string;
  functionDepartment: string;
  currentJobTitle: string;
  currentEmployer: string;
  totalExperienceYears: number;
  highestQualification: string;
  currentFixedSalaryLpa: string;
  domains: string[];
  skills: string[];
  resumeUrl: string;
  resumeFileName: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCandidateProfile {
  id: string;
  userId: string;
  dob: string;
  currentCity: string;
  preferredCities: string[];
  relocationPreference: AdminRelocationPreference;
  travelPreference: AdminTravelPreference;
  workMode: AdminWorkMode;
  primarySalesCategory: "B2B" | "B2C" | "BOTH";
  toolsCrm: string[];
  certifications: string[];
  profileScore: number;
  profileVisibility: boolean;
  createdAt: string;
  updatedAt: string;
  careerSnapshot?: AdminCareerSnapshot | null;
  jobs: AdminJob[];
  candidateSkills: AdminCandidateSkill[];
  achievements: AdminAchievement[];
  compensation?: AdminCompensation | null;
  document?: AdminDocument | null;
}

export interface AdminCandidateRecord extends AdminUserSummary {
  candidateProfile: AdminCandidateProfile | null;
  generalCandidateProfile: AdminGeneralCandidateProfile | null;
}

export interface AdminCandidateTableRow {
  id: string;
  name: string;
  city: string | null;
  lastProfileUpdatedAt: string;
  email: string;
  phone: string;
  currentJobTitle: string | null;
  skills: string[];
  currentFixedSalary: string | null;
  totalWorkExperience: string | null;
  totalSalesExperience: string | null;
}

export type AdminCandidateListResponse = AdminPagedResponse<AdminCandidateTableRow>;

export interface AdminCandidateFilterFormValues {
  search?: string;
  profileType: AdminProfileType[];
  primarySalesCategory: Array<"B2B" | "B2C" | "BOTH">;
  currentCity: string[];
  preferredCities: string[];
  relocationPreference: AdminRelocationPreference[];
  travelPreference: AdminTravelPreference[];
  workMode: AdminWorkMode[];
  profileVisibility: AdminProfileVisibilityFilter;
  industriesWorkedIn: string[];
  industriesSoldInto: string[];
  roleLevelMin?: number;
  roleLevelMax?: number;
  quotaMin?: number;
  quotaMax?: number;
  quotaCurrency?: Currency;
  b2bOfferingType: string[];
  b2bMethodology: string[];
  b2cChannel: string[];
  b2cProducts: string[];
  currentEmployer: string[];
  currentJobTitle: string[];
  functionDepartment: string[];
  domains: string[];
  skills: string[];
  totalExperienceYearsMin?: number;
  totalExperienceYearsMax?: number;
  currentFixedSalaryLpaMin?: number;
  currentFixedSalaryLpaMax?: number;
  city: string[];
  state: string[];
  country: string[];
  page: number;
  limit: number;
}
