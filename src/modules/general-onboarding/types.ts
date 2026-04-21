export type GeneralOpenToRelocation = "OPEN_TO_RELOCATION" | "NOT_OPEN_TO_RELOCATION";

export interface GeneralOnboardingAddress {
  openToRelocation: GeneralOpenToRelocation;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface GeneralOnboardingProfessional {
  functionDepartment: string;
  currentJobTitle: string;
  currentEmployer: string;
  totalExperienceYears: number;
  highestQualification: string;
  currentFixedSalaryLpa: number;
  domains: string[];
  skills: string[];
}

export interface GeneralOnboardingSnapshot {
  address?: GeneralOnboardingAddress;
  professional?: GeneralOnboardingProfessional;
  resumeUrl?: string;
  resumeFileName?: string;
  submittedAt?: string;
}

export interface GeneralOnboardingPayload {
  address: GeneralOnboardingAddress;
  professional: GeneralOnboardingProfessional;
  resumeUrl: string;
}

export interface CandidateAccountSummary {
  name: string;
  email: string;
  phone: string;
}
