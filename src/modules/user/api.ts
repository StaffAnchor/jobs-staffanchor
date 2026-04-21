import { axiosClient } from "@/lib/axios";
import type { GeneralOnboardingPayload } from "@/modules/general-onboarding/types";

interface CandidateProfileResponse {
  id: string;
  userId: string;
  dob: string;
  currentCity: string;
  preferredCities: string[];
  relocationPreference: "YES" | "NO" | "MAYBE";
  travelPreference: "LOW" | "MEDIUM" | "HIGH";
  workMode: "ONSITE" | "HYBRID" | "REMOTE";
  primarySalesCategory: "B2B" | "B2C" | "BOTH";
  toolsCrm: string[];
  certifications: string[];
  profileScore: number;
  profileVisibility: boolean;
  createdAt: string;
  updatedAt: string;
  careerSnapshot?: {
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
    quotaCurrency: string;
    teamManagement: boolean;
    largestTeamManaged: string;
    openToStartup: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  jobs: Array<{
    id: string;
    candidateId: string;
    companyName: string;
    designation: string;
    startDate: string;
    endDate?: string | null;
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
    quotaCurrency: string;
    quotaAttainment: string;
    quotaBasis: string;
    dealSizeRange: string;
    salesCycle: string;
    hunterPercentage: number;
    createdAt: string;
    updatedAt: string;
    b2bContext?: {
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
    } | null;
    b2cContext?: {
      salesChannels: string[];
      productsSold: string[];
      avgTicketSize: string;
      customerProfile: string[];
      teamSize: string;
      distributorManaged: string;
      beatPlanning: string;
    } | null;
  }>;
  candidateSkills: Array<{
    id: string;
    candidateId: string;
    skillId: string;
    isCore: boolean;
    createdAt: string;
    skill: {
      id: string;
      name: string;
      category: string;
      createdAt: string;
    };
  }>;
  achievements: Array<{ id: string; candidateId: string; description: string; createdAt: string }>;
  compensation?: {
    id: string;
    candidateId: string;
    currentFixed: number | string;
    currentVariable: number | string;
    expectedMin: number | string;
    expectedIdeal: number | string;
    esopPreference: string;
    noticePeriod: string;
    salaryFlexibility: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  document?: {
    id: string;
    candidateId: string;
    resumeUrl?: string | null;
    linkedinUrl?: string | null;
    salaryProofUrl?: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export interface UserMeResponse {
  name: string;
  email: string;
  phone: string;
  role: "CANDIDATE" | "ADMIN";
  profileType: "SALES" | "NON_SALES";
  candidateProfileCompletion: number;
  candidateProfile?: CandidateProfileResponse | null;
  generalCandidateProfile?: {
    id: string;
    userId: string;
    openToRelocation: GeneralOnboardingPayload["address"]["openToRelocation"];
    city: string;
    state: string;
    country: string;
    postalCode: string;
    functionDepartment: string;
    currentJobTitle: string;
    currentEmployer: string;
    totalExperienceYears: number;
    highestQualification: string;
    currentFixedSalaryLpa: number;
    domains: string[];
    skills: string[];
    resumeUrl: string;
    resumeFileName?: string | null;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export const userApi = {
  async me() {
    const { data } = await axiosClient.get<UserMeResponse>("/user/me");
    return data;
  },
};
