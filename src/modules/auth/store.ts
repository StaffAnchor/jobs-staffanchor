"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decodeJwtPayload } from "@/lib/utils";
import type { AuthTokenPayload } from "@/types/api";
import { clearStoredToken, setStoredToken } from "./token";
import { useOnboardingStore } from "@/modules/candidate/store";

export type UserRole = "CANDIDATE" | "ADMIN";
export type ProfileType = "SALES" | "NON_SALES";

interface AuthState {
  token: string | null;
  role: UserRole | null;
  profileType: ProfileType | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  pendingVerificationEmail: string;
  setPendingVerificationEmail: (email: string) => void;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: null,
      profileType: null,
      isAuthenticated: false,
      hasHydrated: false,
      pendingVerificationEmail: "",
      setPendingVerificationEmail: (email) => set({ pendingVerificationEmail: email }),
      login: (token) => {
        const payload = decodeJwtPayload<AuthTokenPayload>(token);
        setStoredToken(token);
        useOnboardingStore.getState().reset();
        set({
          token,
          role: payload?.role ?? null,
          profileType: payload?.profileType ?? null,
          isAuthenticated: true,
          hasHydrated: true,
        });
      },
      logout: () => {
        clearStoredToken();
        useOnboardingStore.getState().reset();
        set({ token: null, role: null, profileType: null, isAuthenticated: false, hasHydrated: true });
      },
    }),
    {
      name: "staffanchor-auth",
      partialize: (state) => ({
        token: state.token,
        role: state.role,
        profileType: state.profileType,
        isAuthenticated: state.isAuthenticated,
        pendingVerificationEmail: state.pendingVerificationEmail,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          clearStoredToken();
          useAuthStore.setState({
            token: null,
            role: null,
            profileType: null,
            isAuthenticated: false,
            hasHydrated: true,
          });
          return;
        }

        const hydratedToken = state?.token ?? null;
        if (hydratedToken) {
          setStoredToken(hydratedToken);
        } else {
          clearStoredToken();
        }

        const payload = hydratedToken ? decodeJwtPayload<AuthTokenPayload>(hydratedToken) : null;
        useAuthStore.setState({
          token: hydratedToken,
          role: payload?.role ?? null,
          profileType: payload?.profileType ?? null,
          isAuthenticated: Boolean(hydratedToken),
          hasHydrated: true,
        });
      },
    }
  )
);
