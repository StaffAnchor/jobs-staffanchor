import { GeneralOnboardingWizard } from "@/components/forms/general-onboarding-wizard";

export default function GeneralReviewPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <GeneralOnboardingWizard step={5} />
    </main>
  );
}
