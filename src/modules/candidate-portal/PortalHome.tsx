"use client";

import Link from "next/link";
import { UserCircle2, Briefcase, Gift, Search, ArrowRight, ChevronRight } from "lucide-react";
import { computeProfileScore, PROFILE_SCORE_TIER_META, type ScoreCandidateRow } from "./profile-score";

// The portal's actual landing screen -- previously "My Profile" (the full
// onboarding wizard) was the default tab, which meant every return visit
// dropped a candidate straight into a long form instead of an at-a-glance
// view of where they stand. This gives them a Profile Score plus one-tap
// entry into each of the portal's three real destinations, the way the CRM's
// Priority Actions Inbox became recruiters' actual home screen instead of a
// raw table.

type TabKey = "profile" | "pipeline" | "refer";

export default function PortalHome({
  candidate,
  pipelineCount,
  activeReferralCount,
  openJobsCount,
  onNavigate,
}: {
  candidate: ScoreCandidateRow;
  pipelineCount: number | null;
  activeReferralCount: number | null;
  openJobsCount: number;
  onNavigate: (tab: TabKey) => void;
}) {
  const { score, tier, missing } = computeProfileScore(candidate);
  const meta = PROFILE_SCORE_TIER_META[tier];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* --- Profile Score --- */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Profile Score</p>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.chipBg} ${meta.chipText}`}>{tier}</span>
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
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Still missing ({missing.length})
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {missing.slice(0, 4).join(", ")}
                {missing.length > 4 ? `, +${missing.length - 4} more` : ""}
              </p>
              <button
                onClick={() => onNavigate("profile")}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Complete my profile <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* --- Big-block CTAs --- */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <HomeBlock
            icon={UserCircle2}
            iconClasses="bg-emerald-50 text-emerald-600"
            title="My Profile"
            subtitle="Keep your details current so recruiters can match you to the right roles."
            onClick={() => onNavigate("profile")}
          />
          <HomeBlock
            icon={Briefcase}
            iconClasses="bg-indigo-50 text-indigo-600"
            title="My Pipeline"
            subtitle="Where you stand on every role you've been matched to."
            badge={pipelineCount ?? undefined}
            onClick={() => onNavigate("pipeline")}
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
        </div>
      </div>
    </div>
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
