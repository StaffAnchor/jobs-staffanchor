"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CandidateCareerPayload,
  CandidateProfilePayload,
  CompensationPayload,
  JobPayload,
  OnboardingSnapshot,
  SkillsPayload,
} from "./types";

interface OnboardingState {
  snapshot: OnboardingSnapshot;
  completedSteps: number[];
  setProfile: (data: CandidateProfilePayload, profileScore?: number) => void;
  setCareer: (data: CandidateCareerPayload) => void;
  upsertJob: (job: JobPayload) => void;
  removeJob: (id: string) => void;
  setSkills: (data: SkillsPayload) => void;
  setCompensation: (data: CompensationPayload) => void;
  setDocuments: (data: OnboardingSnapshot["documents"]) => void;
  setProfileScore: (score: number) => void;
  markStepCompleted: (step: number) => void;
  reset: () => void;
}

const initialSnapshot: OnboardingSnapshot = {
  jobs: [],
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      snapshot: initialSnapshot,
      completedSteps: [],
      setProfile: (data, profileScore) =>
        set((state) => ({
          snapshot: { ...state.snapshot, profile: data, profileScore: profileScore ?? state.snapshot.profileScore },
        })),
      setCareer: (data) => set((state) => ({ snapshot: { ...state.snapshot, career: data } })),
      upsertJob: (job) =>
        set((state) => {
          const nextJobs = [...state.snapshot.jobs];
          if (job.id) {
            const idx = nextJobs.findIndex((item) => item.id === job.id);
            if (idx >= 0) {
              nextJobs[idx] = job;
            } else {
              nextJobs.push(job);
            }
          } else {
            nextJobs.push(job);
          }
          return { snapshot: { ...state.snapshot, jobs: nextJobs } };
        }),
      removeJob: (id) =>
        set((state) => ({
          snapshot: { ...state.snapshot, jobs: state.snapshot.jobs.filter((item) => item.id !== id) },
        })),
      setSkills: (data) => set((state) => ({ snapshot: { ...state.snapshot, skills: data } })),
      setCompensation: (data) => set((state) => ({ snapshot: { ...state.snapshot, compensation: data } })),
      setDocuments: (data) => set((state) => ({ snapshot: { ...state.snapshot, documents: data } })),
      setProfileScore: (score) => set((state) => ({ snapshot: { ...state.snapshot, profileScore: score } })),
      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step].sort((a, b) => a - b),
        })),
      reset: () => set({ snapshot: initialSnapshot, completedSteps: [] }),
    }),
    {
      name: "staffanchor-onboarding",
    }
  )
);
