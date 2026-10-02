"use client";

import { Check } from "lucide-react";
import { PROFILE_SCORE_TIER_META, type CoachStep, type ProfileScoreTier } from "./profile-score";

type TabKey = "profile" | "pipeline" | "refer";

// Profile strength with a concrete, ranked list of what to add next and what
// each step is worth -- instead of a bare percentage and a comma-separated
// list of missing fields.
export default function ProfileCoach({
  score,
  tier,
  steps,
  onNavigate,
}: {
  score: number;
  tier: ProfileScoreTier;
  steps: CoachStep[];
  onNavigate: (tab: TabKey) => void;
}) {
  const meta = PROFILE_SCORE_TIER_META[tier];
  const next = steps.slice(0, 4);
  const potential = Math.min(100, score + next.reduce((sum, s) => sum + s.impact, 0));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div
          className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${meta.ring} ${score * 3.6}deg, #e2e8f0 0deg)` }}
        >
          <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white">
            <span className="text-2xl font-extrabold text-slate-900">{score}%</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-slate-900">Profile strength</p>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.chipBg} ${meta.chipText}`}>{tier}</span>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-slate-500">
            {steps.length > 0 ? `${next.length} quick step${next.length === 1 ? "" : "s"} could take you to about ${potential}%.` : meta.blurb}
          </p>
        </div>
      </div>

      {steps.length > 0 ? (
        <ul className="mt-5 space-y-1.5">
          {next.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onNavigate("profile")}
                className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50"
              >
                <span className="h-5 w-5 shrink-0 rounded-full border-2 border-slate-300 group-hover:border-blue-500" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800">{s.label}</span>
                  <span className="block truncate text-xs text-slate-500">{s.why}</span>
                </span>
                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">+{s.impact}%</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <Check className="h-4 w-4" /> Your profile is complete. Nice work.
        </p>
      )}

      {steps.length > 0 && (
        <button
          onClick={() => onNavigate("profile")}
          className="mt-4 h-11 w-full rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Improve my profile
        </button>
      )}
    </section>
  );
}
