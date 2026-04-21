"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GeneralOnboardingAddress,
  GeneralOnboardingProfessional,
  GeneralOnboardingSnapshot,
} from "./types";

interface GeneralOnboardingState {
  snapshot: GeneralOnboardingSnapshot;
  setAddress: (data: GeneralOnboardingAddress) => void;
  setProfessional: (data: GeneralOnboardingProfessional) => void;
  setResume: (data: { resumeUrl: string; resumeFileName?: string }) => void;
  markSubmitted: () => void;
  reset: () => void;
}

const initialSnapshot: GeneralOnboardingSnapshot = {};

export const useGeneralOnboardingStore = create<GeneralOnboardingState>()(
  persist(
    (set) => ({
      snapshot: initialSnapshot,
      setAddress: (data) => set((state) => ({ snapshot: { ...state.snapshot, address: data } })),
      setProfessional: (data) => set((state) => ({ snapshot: { ...state.snapshot, professional: data } })),
      setResume: (data) =>
        set((state) => ({
          snapshot: {
            ...state.snapshot,
            resumeUrl: data.resumeUrl,
            resumeFileName: data.resumeFileName ?? state.snapshot.resumeFileName,
          },
        })),
      markSubmitted: () => set((state) => ({ snapshot: { ...state.snapshot, submittedAt: new Date().toISOString() } })),
      reset: () => set({ snapshot: initialSnapshot }),
    }),
    {
      name: "staffanchor-general-onboarding",
    }
  )
);
