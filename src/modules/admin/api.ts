import { axiosClient } from "@/lib/axios";
import type {
  AdminCandidateFilterInput,
  AdminCandidateListResponse,
  AdminCandidateRecord,
} from "./types";

export const adminApi = {
  async getCandidates(params: Pick<AdminCandidateFilterInput, "page" | "limit">): Promise<AdminCandidateListResponse> {
    const { data } = await axiosClient.get<AdminCandidateListResponse>("/admin/candidates", {
      params,
    });
    return data;
  },

  async getCandidateById(candidateId: string): Promise<AdminCandidateRecord> {
    const { data } = await axiosClient.get<AdminCandidateRecord>(`/admin/candidate/${candidateId}`);
    return data;
  },

  async filterCandidates(payload: AdminCandidateFilterInput): Promise<AdminCandidateListResponse> {
    const { data } = await axiosClient.post<AdminCandidateListResponse>("/admin/filter", payload);
    return data;
  },
};