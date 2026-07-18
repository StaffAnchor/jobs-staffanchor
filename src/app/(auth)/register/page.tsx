"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ApplyForm, { type ExistingProfile } from "@/modules/apply/ApplyForm";
import { supabase } from "@/lib/supabaseClient";
import { Spinner } from "@/components/ui/spinner";

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

  const [loading, setLoading] = useState(true);
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | undefined>(undefined);

  // A signed-in candidate landing here (old bookmark, the "sign up for
  // future openings" link, whatever) has already registered -- send them to
  // My Account instead of the anonymous Register form, same as the navbar
  // already hides "Build My Profile" once signed in (see navbar.tsx). This
  // is the register-page half of the same "recognize a persisted session"
  // fix applied to the job Apply flow.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) {
        router.replace("/candidate-portal");
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

  return <ApplyForm existingProfile={existingProfile} />;
}
