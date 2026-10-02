"use client";

import Link from "next/link";
import { FileCheck2, Gift, MessageCircleQuestion, Sparkles, Zap, type LucideIcon } from "lucide-react";
import { computeCoachSteps, computeProfileScore, type ScoreCandidateRow } from "./profile-score";
import MarketIntelligenceStrip from "./MarketIntelligenceStrip";
import SharePassportCard from "./SharePassportCard";
import AccountSecurityCard from "./AccountSecurityCard";
import LatestUpdates from "./LatestUpdates";
import RoleMatches from "./RoleMatches";
import SavedAndAlerts from "./SavedAndAlerts";
import HomeGreeting from "./HomeGreeting";
import ProfileCoach from "./ProfileCoach";
import ApplicationsSnapshot from "./ApplicationsSnapshot";
import { logPriorityClick } from "@/lib/priority-click";

// The portal's landing screen, built around one question: what should I do
// next? Top: a personal greeting plus the few things that need attention
// (an interview, new updates, the best profile step). Main column: roles that
// fit, and where each application stands. Side column: profile strength with a
// ranked coach, saved roles and alerts. Tools and account settings sit below.

type TabKey = "profile" | "pipeline" | "refer";

type PipelineRow = {
  link_id: string;
  mandate_id: string;
  role_title: string;
  stage: string;
  client_display: string;
  city: string | null;
  in_shortlist: boolean;
  linked_at: string;
};

export default function PortalHome({
  candidate,
  activeReferralCount,
  onNavigate,
  publicSlug,
  publicEnabled,
  onPassportChange,
}: {
  candidate: ScoreCandidateRow & { ai_summary?: string | null };
  pipelineCount: number | null;
  pipelineRows?: PipelineRow[];
  activeReferralCount: number | null;
  openJobsCount: number;
  onNavigate: (tab: TabKey) => void;
  publicSlug?: string | null;
  publicEnabled?: boolean | null;
  onPassportChange?: (next: { slug: string | null; enabled: boolean }) => void;
}) {
  const { score, tier } = computeProfileScore(candidate);
  const steps = computeCoachSteps(candidate);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <HomeGreeting fullName={candidate.full_name} score={score} topStep={steps[0]} onNavigate={onNavigate} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <LatestUpdates onSeeAll={() => onNavigate("pipeline")} />
          <RoleMatches />
          <ApplicationsSnapshot onNavigate={onNavigate} />
          <MarketIntelligenceStrip category={candidate.category ?? null} subDomain={candidate.sub_domain ?? null} />
          {candidate.ai_summary && (
            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                <Sparkles className="h-3.5 w-3.5" /> Your career snapshot
              </p>
              <p className="text-sm leading-6 text-slate-700">{candidate.ai_summary}</p>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-6">
          <ProfileCoach score={score} tier={tier} steps={steps} onNavigate={onNavigate} />
          <SavedAndAlerts />
        </aside>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile
            icon={MessageCircleQuestion}
            tone="bg-violet-50 text-violet-600"
            title="Mock interview"
            text="Practise real sales questions and get instant feedback."
            href="/mock-interview"
          />
          <Tile
            icon={FileCheck2}
            tone="bg-sky-50 text-sky-600"
            title="Check my ATS score"
            text="See how your resume scores and what to fix."
            href="/ats-score"
          />
          <Tile
            icon={Gift}
            tone="bg-amber-50 text-amber-600"
            title="Refer and earn"
            text="Refer someone and earn a reward when they are placed."
            badge={activeReferralCount ?? undefined}
            onClick={() => onNavigate("refer")}
          />
          <Tile
            icon={Zap}
            tone="bg-indigo-600 text-white"
            title="Priority Applicant"
            text="Get an application flagged for a first review, from ₹79."
            href="/priority-applicant"
            onClick={() => logPriorityClick("portal_home")}
            highlight
          />
        </div>
      </section>

      {onPassportChange && (
        <div className="mt-8">
          <SharePassportCard slug={publicSlug} enabled={publicEnabled} onChange={onPassportChange} />
        </div>
      )}

      <div className="mt-6">
        <AccountSecurityCard email={candidate.email} />
      </div>
    </div>
  );
}

function Tile({
  icon: Icon,
  tone,
  title,
  text,
  href,
  onClick,
  badge,
  highlight,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  text: string;
  href?: string;
  onClick?: () => void;
  badge?: number;
  highlight?: boolean;
}) {
  const className = highlight
    ? "group relative block rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-5 text-left text-white shadow-md shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:shadow-lg"
    : "group block rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md";
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${highlight ? "bg-white/15 text-white" : tone}`}>
          <Icon className="h-5 w-5" />
        </span>
        {badge != null && badge > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-bold text-white">{badge}</span>
        )}
      </div>
      <p className={`mt-3 text-sm font-bold ${highlight ? "text-white" : "text-slate-900"}`}>{title}</p>
      <p className={`mt-1 text-xs leading-5 ${highlight ? "text-indigo-100" : "text-slate-500"}`}>{text}</p>
    </>
  );
  return href ? (
    <Link href={href} onClick={onClick} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}
