import { axiosClient } from "@/lib/axios";
import type { GeneralOnboardingPayload } from "./types";

export interface GeneralCandidateAccountResponse {
  name: string;
  email: string;
  phone: string;
  profileType: "SALES" | "NON_SALES";
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

export const generalOnboardingApi = {
  async me() {
    const { data } = await axiosClient.get<GeneralCandidateAccountResponse>("/user/me");
    return data;
  },

  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append("resume", file);

    const { data } = await axiosClient.post<{ resumeUrl: string }>("/user/general-onboarding/resume", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  },

  async save(payload: GeneralOnboardingPayload) {
    const { data } = await axiosClient.put("/user/general-onboarding", payload);
    return data;
  },
};
