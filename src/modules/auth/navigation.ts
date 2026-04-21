import type { ProfileType } from "./store";

export function getOnboardingPath(profileType: ProfileType | null | undefined) {
  return profileType === "NON_SALES" ? "/onboarding/general/step-1-basic" : "/onboarding";
}