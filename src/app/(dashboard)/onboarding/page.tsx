"use client";

import { OnboardingWizard } from "@/components/forms/onboarding-wizard";
import { AuthGuard } from "@/components/common/auth-guard";
import { useAuthStore } from "@/modules/auth/store";
import { getOnboardingPath } from "@/modules/auth/navigation";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const profileType = useAuthStore((state) => state.profileType);

  useEffect(() => {
    if (profileType === "NON_SALES") {
      router.replace(getOnboardingPath(profileType));
    }
  }, [profileType, router]);

  if (profileType === "NON_SALES") {
    return null;
  }

  return (
    <AuthGuard roles={["CANDIDATE"]}>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <OnboardingWizard />
      </main>
    </AuthGuard>
  );
}
