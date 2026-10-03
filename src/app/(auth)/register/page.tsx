"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { type ExistingProfile } from "@/modules/apply/ApplyForm";
import CandidateIntakeForm, { type IntakeExistingRow } from "@/modules/apply/CandidateIntakeForm";
import EmailGate from "@/modules/apply/EmailGate";
import { supabase } from "@/lib/supabaseClient";
import { Spinner } from "@/components/ui/spinner";
import PriorityFloatingNudge from "@/components/priority/priority-floating-nudge";

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-24">
          <Spinner className="w-6 h-6 text-slate-400" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  // Where to send the candidate right after registration -- e.g. Priority
  // Applicant linking here (`/register?returnTo=/priority-applicant`) so
  // "build a profile" is a fast on-ramp back to checkout.
  const returnTo = searchParams.get("returnTo");
  // Arrives pre-filled from the sign-in page when that email had no profile.
  const emailParam = searchParams.get("email")?.trim() ?? "";

  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | undefined>(undefined);
  const [gateEmail, setGateEmail] = useState<string | null>(null);

  // A signed-in candidate landing here has already registered -- send them to
  // My Account instead of the anonymous form.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) {
        router.replace(returnTo || "/candidate-portal");
        return;
      }
      if (!ref) {
        setLoading(false);
        return;
      }
      supabase
        .rpc("get_candidate_for_completion", { p_id: ref })
        .maybeSingle()
        .then(({ data: profileData }) => {
          if (cancelled) return;
          if (profileData) setExistingProfile(profileData as ExistingProfile);
          setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="w-6 h-6 text-slate-400" />
      </div>
    );
  }

  const showPriorityNudge = !returnTo?.startsWith("/priority-applicant");

  // A `ref` link is a recruiter handing a specific candidate a direct
  // completion link for their existing record. It opens the same short intake
  // as every other entry point, pre-filled; the long profile stays in My Account.
  if (ref && existingProfile) {
    return (
      <>
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <CandidateIntakeForm
              email={existingProfile.email}
              existing={existingProfile as unknown as IntakeExistingRow}
              completionRef={existingProfile.id}
              returnTo={returnTo ?? undefined}
            />
          </div>
        </div>
        {showPriorityNudge && <PriorityFloatingNudge />}
      </>
    );
  }

  const email = gateEmail ?? (/^\S+@\S+\.\S+$/.test(emailParam) ? emailParam : null);

  if (email === null) {
    return (
      <div className="px-4 py-12 sm:px-6">
        <EmailGate initialEmail={emailParam} onNewCandidate={setGateEmail} />
        {showPriorityNudge && <PriorityFloatingNudge />}
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Create your profile</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Let&apos;s get you in front of the right roles</h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <CandidateIntakeForm email={email} returnTo={returnTo ?? undefined} />
        </div>
      </div>
      {showPriorityNudge && <PriorityFloatingNudge />}
    </>
  );
}
