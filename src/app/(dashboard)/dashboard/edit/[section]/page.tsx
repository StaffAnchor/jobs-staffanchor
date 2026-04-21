"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/common/auth-guard";
import { OnboardingWizard } from "@/components/forms/onboarding-wizard";

const mapSectionToStep: Record<string, number> = {
  profile: 1,
  career: 2,
  jobs: 3,
  skills: 4,
  compensation: 5,
};

export default function EditSectionPage() {
  const params = useParams<{ section: string }>();
  const step = useMemo(() => mapSectionToStep[params.section] ?? 1, [params.section]);

  return (
    <AuthGuard roles={["CANDIDATE"]}>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <OnboardingWizard initialStep={step} />
      </main>
    </AuthGuard>
  );
}
