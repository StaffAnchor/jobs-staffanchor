"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Home, UserCircle2, Briefcase, Gift, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import { type CandidateProfile } from "@/modules/candidate-portal/ProfileEditor";
import ApplyForm from "@/modules/apply/ApplyForm";
import MyPipeline from "@/modules/candidate-portal/MyPipeline";
import ReferEarn from "@/modules/candidate-portal/ReferEarn";
import MandatoryBasicsGate from "@/modules/candidate-portal/MandatoryBasicsGate";
import PortalHome from "@/modules/candidate-portal/PortalHome";
import { listOpenJobs, type JobListing } from "@/modules/jobs/api";

const TABS = [
  {
    key: "home" as const,
    label: "Home",
    icon: Home,
    accent: "text-slate-700",
    ring: "ring-slate-100",
  },
  {
    key: "profile" as const,
    label: "My Profile",
    icon: UserCircle2,
    accent: "text-emerald-600",
    ring: "ring-emerald-100",
  },
  {
    key: "pipeline" as const,
    label: "My Pipeline",
    icon: Briefcase,
    accent: "text-indigo-600",
    ring: "ring-indigo-100",
  },
  {
    key: "refer" as const,
    label: "Refer & Earn",
    icon: Gift,
    accent: "text-amber-600",
    ring: "ring-amber-100",
  },
];

type TabKey = (typeof TABS)[number]["key"];

const TAB_META: Record<
  TabKey,
  { icon: typeof Briefcase; iconClasses: string; title: string; subtitle: string }
> = {
  home: {
    icon: Home,
    iconClasses: "bg-slate-100 text-slate-700",
    title: "Home",
    subtitle: "Your Profile Score and everything you can do from here.",
  },
  profile: {
    icon: UserCircle2,
    iconClasses: "bg-emerald-50 text-emerald-600",
    title: "My Profile",
    subtitle: "Keep your profile current so recruiters can match you to the right roles.",
  },
  pipeline: {
    icon: Briefcase,
    iconClasses: "bg-indigo-50 text-indigo-600",
    title: "My Pipeline",
    subtitle: "Where you stand on every role you've been matched to.",
  },
  refer: {
    icon: Gift,
    iconClasses: "bg-amber-50 text-amber-600",
    title: "Refer & Earn",
    subtitle: "Help someone in your network find their next sales role — and earn a reward when they get placed.",
  },
};

function initialsFor(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function CandidatePortalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [openJobs, setOpenJobs] = useState<JobListing[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("home");
  const [pipelineCount, setPipelineCount] = useState<number | null>(null);
  const [activeReferralCount, setActiveReferralCount] = useState<number | null>(null);

  async function loadProfile(cancelledRef?: { current: boolean }) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/candidate-login");
      return;
    }

    const { data: candidateId, error: rpcError } = await supabase.rpc("get_or_create_my_candidate_profile");
    if (rpcError) {
      if (!cancelledRef?.current) setError(rpcError.message);
      return;
    }

    const { data, error: fetchError } = await supabase.from("candidates").select("*").eq("id", candidateId).single();
    if (cancelledRef?.current) return;
    if (fetchError || !data) {
      setError(fetchError?.message ?? "Could not load your profile.");
      return;
    }
    setProfile(data as CandidateProfile);

    try {
      const jobs = await listOpenJobs();
      if (!cancelledRef?.current) setOpenJobs(jobs);
    } catch {
      // Non-critical.
    }

    // Lightweight counts just to give the nav some life — actual detail
    // fetching/rendering still happens inside each tab's own component.
    const [{ data: pipeline }, { data: referrals }] = await Promise.all([
      supabase.rpc("get_my_pipeline"),
      supabase.rpc("get_my_referrals"),
    ]);
    if (cancelledRef?.current) return;
    setPipelineCount((pipeline ?? []).length);
    setActiveReferralCount((referrals ?? []).filter((r: { status: string }) => r.status !== "not_selected").length);
  }

  useEffect(() => {
    const cancelledRef = { current: false };
    loadProfile(cancelledRef);
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // See get_or_create_my_candidate_profile() -- the very first sign-in
  // creates a candidates row with only an email address. Block the rest of
  // the portal until name/phone/function are captured, so a drop-off after
  // this point still leaves a usable lead instead of an empty row.
  if (!profile.full_name?.trim() || !profile.phone?.trim() || !profile.category) {
    return (
      <MandatoryBasicsGate
        candidateId={profile.id}
        email={profile.email ?? ""}
        onComplete={() => loadProfile()}
      />
    );
  }

  const badgeFor = (key: TabKey) => {
    if (key === "pipeline" && pipelineCount) return pipelineCount;
    if (key === "refer" && activeReferralCount) return activeReferralCount;
    return null;
  };

  const meta = TAB_META[tab];
  const MetaIcon = meta.icon;

  return (
    <div className="bg-[#f7f9fc]">
      <div className="relative isolate overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-900 pb-7">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-16 right-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 ring-2 ring-white/10">
              {initialsFor(profile.full_name)}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400/90">
                <Sparkles className="h-3 w-3" /> Candidate Portal
              </p>
              <h1 className="text-lg font-semibold text-white sm:text-xl">
                Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
              </h1>
            </div>
          </div>

          <nav className="inline-flex gap-1 rounded-2xl bg-white/[0.06] p-1 ring-1 ring-white/[0.08] backdrop-blur-sm">
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              const badge = badgeFor(t.key);
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`group relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white text-slate-900 shadow-[0_6px_20px_-4px_rgba(0,0,0,0.35)]"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <Icon className={`h-4 w-4 transition-colors ${isActive ? t.accent : "text-slate-400 group-hover:text-slate-200"}`} />
                  {t.label}
                  {badge != null && (
                    <span
                      className={`flex h-4.5 min-w-4.5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                        isActive ? `bg-slate-100 ${t.accent}` : "bg-white/15 text-white"
                      }`}
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

      {tab === "home" && (
        <PortalHome
          candidate={profile}
          pipelineCount={pipelineCount}
          activeReferralCount={activeReferralCount}
          openJobsCount={openJobs.length}
          onNavigate={(t) => setTab(t)}
        />
      )}

      {tab === "profile" && (
        // Career Timeline is now Step 2 inside ApplyForm's own wizard -- it used
        // to be a separate always-visible panel rendered below the wizard here,
        // which read as two disconnected forms (profile-strength moving up top
        // while a second panel silently saved itself below). Single form now.
        <ApplyForm existingProfile={profile} onSaved={() => loadProfile()} />
      )}

      {(tab === "pipeline" || tab === "refer") && (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-start gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${meta.iconClasses}`}>
              <MetaIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">{meta.title}</h2>
              <p className="mt-0.5 text-sm text-slate-500">{meta.subtitle}</p>
            </div>
          </div>
          {tab === "pipeline" && <MyPipeline />}
          {tab === "refer" && <ReferEarn openJobs={openJobs} />}
        </div>
      )}
    </div>
  );
}
