"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import ProfileEditor, { type CandidateProfile } from "@/modules/candidate-portal/ProfileEditor";
import MyPipeline from "@/modules/candidate-portal/MyPipeline";
import ReferEarn from "@/modules/candidate-portal/ReferEarn";
import { listOpenJobs, type JobListing } from "@/modules/jobs/api";

const TABS = [
  { key: "profile", label: "My Profile" },
  { key: "pipeline", label: "My Pipeline" },
  { key: "refer", label: "Refer & Earn" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function CandidatePortalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [openJobs, setOpenJobs] = useState<JobListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("profile");

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

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="mb-2 flex gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {tab === "profile" && <ProfileEditor profile={profile} openJobs={openJobs} />}
      {tab === "pipeline" && (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-1 text-xl font-bold text-slate-900">My Pipeline</h1>
          <p className="mb-5 text-sm text-slate-500">Where you stand on every role you've been matched to.</p>
          <MyPipeline />
        </div>
      )}
      {tab === "refer" && (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-1 text-xl font-bold text-slate-900">Refer & Earn</h1>
          <p className="mb-5 text-sm text-slate-500">
            Help someone in your network find their next sales role — and earn a reward when they get placed.
          </p>
          <ReferEarn />
        </div>
      )}
    </div>
  );
}
