"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle2, Briefcase, Gift, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import ProfileEditor, { type CandidateProfile } from "@/modules/candidate-portal/ProfileEditor";
import MyPipeline from "@/modules/candidate-portal/MyPipeline";
import ReferEarn from "@/modules/candidate-portal/ReferEarn";
import { listOpenJobs, type JobListing } from "@/modules/jobs/api";

const TABS = [
  {
    key: "profile" as const,
    label: "My Profile",
    icon: UserCircle2,
    activeClasses: "bg-white text-blue-600 shadow-sm ring-1 ring-blue-100",
    dotClasses: "bg-blue-500",
  },
  {
    key: "pipeline" as const,
    label: "My Pipeline",
    icon: Briefcase,
    activeClasses: "bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100",
    dotClasses: "bg-indigo-500",
  },
  {
    key: "refer" as const,
    label: "Refer & Earn",
    icon: Gift,
    activeClasses: "bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100",
    dotClasses: "bg-emerald-500",
  },
];

type TabKey = (typeof TABS)[number]["key"];

export default function CandidatePortalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [openJobs, setOpenJobs] = useState<JobListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("profile");
  const [pipelineCount, setPipelineCount] = useState<number | null>(null);
  const [activeReferralCount, setActiveReferralCount] = useState<number | null>(null);

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

      // Lightweight counts just to give the nav some life — actual detail
      // fetching/rendering still happens inside each tab's own component.
      const [{ data: pipeline }, { data: referrals }] = await Promise.all([
        supabase.rpc("get_my_pipeline"),
        supabase.rpc("get_my_referrals"),
      ]);
      if (cancelled) return;
      setPipelineCount((pipeline ?? []).length);
      setActiveReferralCount((referrals ?? []).filter((r: { status: string }) => r.status !== "not_selected").length);
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

  const badgeFor = (key: TabKey) => {
    if (key === "pipeline" && pipelineCount) return pipelineCount;
    if (key === "refer" && activeReferralCount) return activeReferralCount;
    return null;
  };

  return (
    <div>
      <div className="border-b border-slate-200 bg-gradient-to-b from-blue-50/60 to-transparent">
        <div className="mx-auto max-w-6xl px-4 pt-7 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
            </p>
          </div>
          <nav className="mb-0 inline-flex gap-1 rounded-full bg-slate-100/80 p-1">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              const badge = badgeFor(t.key);
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`group relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive ? t.activeClasses : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "" : "text-slate-400 group-hover:text-slate-600"}`} />
                  {t.label}
                  {badge != null && (
                    <span
                      className={`ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${t.dotClasses}`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {tab === "profile" && <ProfileEditor profile={profile} openJobs={openJobs} />}
      {tab === "pipeline" && (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-900">
            <Briefcase className="h-5 w-5 text-indigo-500" /> My Pipeline
          </h1>
          <p className="mb-5 text-sm text-slate-500">Where you stand on every role you've been matched to.</p>
          <MyPipeline />
        </div>
      )}
      {tab === "refer" && (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-900">
            <Gift className="h-5 w-5 text-emerald-500" /> Refer & Earn
          </h1>
          <p className="mb-5 text-sm text-slate-500">
            Help someone in your network find their next sales role — and earn a reward when they get placed.
          </p>
          <ReferEarn openJobs={openJobs} />
        </div>
      )}
    </div>
  );
}
