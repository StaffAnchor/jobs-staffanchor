"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import ProfileEditor, { type CandidateProfile } from "@/modules/candidate-portal/ProfileEditor";
import { listOpenJobs, type JobListing } from "@/modules/jobs/api";

export default function CandidatePortalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [openJobs, setOpenJobs] = useState<JobListing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/candidate-login");
        return;
      }

      const { data: candidateId, error: rpcError } = await supabase.rpc("get_or_create_my_candidate_profile");
      if (rpcError) {
        if (!cancelled) setError(rpcError.message);
        return;
      }

      const { data, error: fetchError } = await supabase.from("candidates").select("*").eq("id", candidateId).single();
      if (cancelled) return;
      if (fetchError || !data) {
        setError(fetchError?.message ?? "Could not load your profile.");
        return;
      }
      setProfile(data as CandidateProfile);

      try {
        const jobs = await listOpenJobs();
        if (!cancelled) setOpenJobs(jobs);
      } catch {
        // Non-critical: the profile editor still works without the openings panel.
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  return <ProfileEditor profile={profile} openJobs={openJobs} />;
}
