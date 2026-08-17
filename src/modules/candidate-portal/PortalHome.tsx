"use client";

import Link from "next/link";
import { UserCircle2, Gift, Search, ArrowRight, ChevronRight, Sparkles, Briefcase, MapPin, MessageCircleQuestion, FileCheck2, Zap } from "lucide-react";
import { computeProfileScore, PROFILE_SCORE_TIER_META, type ScoreCandidateRow } from "./profile-score";
import MarketIntelligenceStrip from "./MarketIntelligenceStrip";
import SharePassportCard from "./SharePassportCard";

// The portal's actual landing screen -- previously "My Profile" (the full
// onboarding wizard) was the default tab, which meant every return visit
// dropped a candidate straight into a long form instead of an at-a-glance
// view of where they stand. This gives them a Profile Score plus one-tap
// entry into each of the portal's three real destinations, the way the CRM's
// Priority Actions Inbox became recruiters' actual home screen instead of a
// raw table.
//
// v2 (Phase 1 "career command center" pass): the page used to open on a
// CTA grid -- four equally-weighted buttons, none of which actually answered
// "what's happening with me right now." Candidates' #1 anxiety after
// applying anywhere is silence -- so the home screen now leads with a real
// Recent Activity card (their single most-recently-updated pipeline item,
// pulled from the same get_my_pipeline() RPC MyPipeline.tsx already uses --
// no new schema, no new endpoint) and, when one exists, the recruiter-facing
// AI summary already generated for this candidate, reframed candidate-side.
// The old CTA grid is kept, just demoted to a secondary "Quick links" row
// underneath, since Pipeline now has its own real entry point via the
// Recent Activity card's "View full pipeline" link.

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

const STAGE_LABELS: Record<string, string> = {
  sourced: "Applied",
  screened: "Applied",
  shortlisted: "Shortlisted",
  submitted: "Submitted to client",
  client_interview: "Client interview",
  offer: "Offer",
  placed: "Placed",
  rejected: "Not selected this time",
};

const STAGE_COLORS: Record<string, string> = {
  sourced: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
  screened: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
  shortlisted: "bg-teal-50 text-teal-700 ring-1 ring-teal-200/70",
  submitted: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/70",
  client_interview: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200/70",
  offer: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
  placed: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
  rejected: "bg-red-50 text-red-600 ring-1 ring-red-200/70",
};

const STAGE_ORDER = ["sourced", "screened", "shortlisted", "submitted", "client_interview", "offer", "placed"];

export default function PortalHome({
  candidate,
  pipelineCount,
  pipelineRows,
  activeReferralCount,
  openJobsCount,
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
  const { score, tier, missing } = computeProfileScore(candidate);
  const meta = PROFILE_SCORE_TIER_META[tier];

  const mostRecent = [...(pipelineRows ?? [])].sort(
    (a, b) => new Date(b.linked_at).getTime() - new Date(a.linked_at).getTime()
  )[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <MarketIntelligenceStrip category={candidate.category ?? null} subDomain={candidate.sub_domain ?? null} />

      {/* --- Primary row: what's happening with me + my score --- */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentActivityCard row={mostRecent} onNavigate={onNavigate} />
        </div>

        <div
          className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
            missing.length > 0 ? `border-t-4 ${meta.accentBorder}` : ""
          }`}
        >
          <div className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Profile Score</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${meta.chipBg} ${meta.chipText}`}>{tier}</span>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div
                className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
                style={{ background: `conic-gradient(${meta.ring} ${score * 3.6}deg, #e2e8f0 0deg)` }}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white">
                  <span className="text-lg font-bold text-slate-900">{score}%</span>
                </div>
              </div>
              <p className="text-xs leading-5 text-slate-500">{meta.blurb}</p>
            </div>
            {missing.length > 0 && (
              <div className={`mt-4 rounded-xl border-l-4 ${meta.accentBorder} ${meta.accentBg} p-3.5`}>
                <p className={`text-[11px] font-bold uppercase tracking-wide ${meta.chipText}`}>
                  Still missing ({missing.length})
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  {missing.slice(0, 4).join(", ")}
                  {missing.length > 4 ? `, +${missing.length - 4} more` : ""}
                </p>
                <button
                  onClick={() => onNavigate("profile")}
                  className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-bold shadow-sm ring-1 ring-inset ring-slate-200 transition hover:ring-slate-300"
                  style={{ color: meta.ring }}
                >
                  Complete my profile <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Your Career Snapshot: the recruiter-facing AI summary, shown
          candidate-side. Reuses the exact same ai_summary field already
          generated for recruiters/clients -- no new generation, no new
          field, just a first candidate-facing surface for it. Only renders
          once one exists, so an incomplete profile never sees a blank or
          placeholder card here. */}
      {candidate.ai_summary && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
            <Sparkles className="h-3.5 w-3.5" /> Your career snapshot
          </p>
          <p className="text-sm leading-6 text-slate-700">{candidate.ai_summary}</p>
        </div>
      )}

      {/* --- Quick links: secondary now that Recent Activity covers the
          most common "why am I here" reason for a return visit. --- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <HomeBlock
          icon={UserCircle2}
          iconClasses="bg-emerald-50 text-emerald-600"
          title="My Profile"
          subtitle="Keep your details current so recruiters can match you to the right roles."
          onClick={() => onNavigate("profile")}
        />
        <HomeBlock
          icon={Gift}
          iconClasses="bg-amber-50 text-amber-600"
          title="Refer & Earn"
          subtitle="Refer someone in your network and earn a reward when they're placed."
          badge={activeReferralCount ?? undefined}
          onClick={() => onNavigate("refer")}
        />
        <HomeBlock
          icon={Search}
          iconClasses="bg-sky-50 text-sky-600"
          title="Browse Open Roles"
          subtitle="See every open sales role currently being staffed through StaffAnchor."
          badge={openJobsCount > 0 ? openJobsCount : undefined}
          href="/jobs"
        />
        <HomeBlock
          icon={MessageCircleQuestion}
          iconClasses="bg-indigo-50 text-indigo-600"
          title="Practice Mock Interview"
          subtitle="Answer real sales interview questions and get instant AI feedback before your next call."
          href="/mock-interview"
        />
        <HomeBlock
          icon={FileCheck2}
          iconClasses="bg-teal-50 text-teal-600"
          title="Check My ATS Score"
          subtitle="Upload your resume and see how it scores for keyword match and ATS-parsability."
          href="/ats-score"
        />
        <HomeBlock
          icon={Zap}
          iconClasses="bg-indigo-50 text-indigo-600"
          title="Priority Applicant"
          subtitle="Get an application flagged for the recruiter's first review pass — from ₹79."
          href="/priority-applicant"
        />
      </div>

      {onPassportChange && (
        <div className="mt-6">
          <SharePassportCard slug={publicSlug} enabled={publicEnabled} onChange={onPassportChange} />
        </div>
      )}
    </div>
  );
}

function RecentActivityCard({
  row,
  onNavigate,
}: {
  row: PipelineRow | undefined;
  onNavigate: (tab: TabKey) => void;
}) {
  if (!row) {
    return (
      <div className="flex h-full flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">No active applications yet</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Once a recruiter matches you to an opening, you&apos;ll see exactly where things stand right here --
          no more wondering what happened after you applied.
        </p>
        <Link
          href="/jobs"
          className="mt-3 inline-flex w-fit items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          Browse open roles <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  const stageIdx = STAGE_ORDER.indexOf(row.stage);
  const maxIdx = STAGE_ORDER.length - 1;
  const progressPct = row.stage === "rejected" ? 100 : stageIdx >= 0 ? ((stageIdx + 1) / (maxIdx + 1)) * 100 : 0;

  return (
    <button
      onClick={() => onNavigate("pipeline")}
      className="group flex h-full w-full flex-col rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Most recent activity</p>
      <div className="mt-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-slate-900">{row.role_title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-slate-400" /> {row.client_display}
            </span>
            {row.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3 text-slate-400" /> {row.city}
              </span>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
            STAGE_COLORS[row.stage] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {STAGE_LABELS[row.stage] ?? row.stage}
        </span>
      </div>
      {row.stage !== "rejected" && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700 ease-out"
            style={{ width: `${Math.max(progressPct, 6)}%` }}
          />
        </div>
      )}
      <span className="mt-4 inline-flex items-center gap-0.5 text-xs font-semibold text-slate-400 transition-colors group-hover:text-slate-700">
        View full pipeline <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}

function HomeBlock({
  icon: Icon,
  iconClasses,
  title,
  subtitle,
  badge,
  onClick,
  href,
}: {
  icon: typeof UserCircle2;
  iconClasses: string;
  title: string;
  subtitle: string;
  badge?: number;
  onClick?: () => void;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClasses}`}>
          <Icon className="h-5 w-5" />
        </div>
        {badge != null && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{subtitle}</p>
      <span className="mt-3 inline-flex items-center gap-0.5 text-xs font-semibold text-slate-400 transition-colors group-hover:text-slate-700">
        Open <ChevronRight className="h-3 w-3" />
      </span>
    </>
  );

  const className =
    "group block rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}
