import { axiosClient } from "@/lib/axios";
import type {
  CandidateCareerPayload,
  CandidateProfilePayload,
  CompensationPayload,
  DocumentsPayload,
  JobPayload,
  SkillsPayload,
} from "./types";

export const candidateApi = {
  async createProfile(payload: CandidateProfilePayload) {
    const { data } = await axiosClient.post("/candidate/profile", payload);
    return data;
  },

  async updateProfile(payload: Partial<CandidateProfilePayload>) {
    const { data } = await axiosClient.put("/candidate/profile", payload);
    return data;
  },

  async createCareer(payload: CandidateCareerPayload) {
    const { data } = await axiosClient.post("/candidate/career", payload);
    return data;
  },

  async updateCareer(payload: Partial<CandidateCareerPayload>) {
    const { data } = await axiosClient.put("/candidate/career", payload);
    return data;
  },

  async createJob(payload: JobPayload) {
    const { data } = await axiosClient.post("/candidate/job", payload);
    return data;
  },

  async updateJob(jobId: string, payload: Partial<JobPayload>) {
    const { data } = await axiosClient.put(`/candidate/job/${jobId}`, payload);
    return data;
  },

  async deleteJob(jobId: string) {
    await axiosClient.delete(`/candidate/job/${jobId}`);
  },

  async upsertSkills(payload: SkillsPayload) {
    const { data } = await axiosClient.post("/candidate/skills", payload);
    return data;
  },

  async upsertCompensation(payload: CompensationPayload) {
    const { data } = await axiosClient.post("/candidate/compensation", payload);
    return data;
  },

  async uploadDocuments(payload: DocumentsPayload) {
    const formData = new FormData();
    if (payload.resume) {
      formData.append("resume", payload.resume);
    }
    if (payload.salaryProof) {
      formData.append("salaryProof", payload.salaryProof);
    }
    if (payload.linkedinUrl) {
      formData.append("linkedinUrl", payload.linkedinUrl);
    }

    const { data } = await axiosClient.post("/candidate/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return data;
  },
};
