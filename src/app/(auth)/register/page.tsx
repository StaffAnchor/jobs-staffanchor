"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  const [loading, setLoading] = useState(!!ref);
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | undefined>(undefined);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .rpc("get_candidate_for_completion", { p_id: ref })
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data) setExistingProfile(data as ExistingProfile);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
