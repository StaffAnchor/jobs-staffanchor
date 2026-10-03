"use client";

import { CheckCircle2, LogOut, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { yourLevelOptions } from "./options";

// Shown to a signed-in, returning candidate before they apply: what we already
// have on file, in plain lines, with "All correct, apply" or "Update details".
// Purely presentational -- SignedInApplyCard owns the apply / edit behaviour.

export type ReviewRow = {
  full_name?: string | null;
  current_job_title?: string | null;
  current_employer?: string | null;
  current_location?: string | null;
  total_experience_years?: number | null;
  current_fixed_ctc?: number | null;
  current_variable_ctc?: number | null;
  expected_fixed_ctc?: number | null;
  expected_variable_ctc?: number | null;
  notice_period?: string | null;
  sub_domain?: string | null;
  segment_data?: Record<string, unknown> | null;
  details_confirmed_at?: string | null;
  updated_at?: string | null;
};

const STALE_DAYS = 60;

const lpa = (n: number | null | undefined) => (n == null ? null : n >= 121 ? "120L+" : `${n} LPA`);

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : Math.floor((Date.now() - t) / 86_400_000);
}

export function reviewLines(c: ReviewRow): { label: string; value: string }[] {
  const seg = (c.segment_data ?? {}) as Record<string, unknown>;
  const level = yourLevelOptions.find((l) => l.value === seg.role_level)?.label ?? (typeof seg.role_level === "string" ? seg.role_level : null);
  const sellsNow = Array.isArray(seg.sells_now) && seg.sells_now.length ? (seg.sells_now as string[]).join(", ") : c.sub_domain;
  const fixed = lpa(c.current_fixed_ctc);
  const variable = lpa(c.current_variable_ctc);
  const expected = seg.expected_ctc_negotiable === true ? "Negotiable" : lpa(c.expected_fixed_ctc);
  const role = [c.current_job_title, c.current_employer].filter(Boolean).join(" at ");
  const rows: [string, string | null | undefined][] = [
    ["Role", role || level],
    ["Level", role ? level : null],
    ["You sell", sellsNow],
    ["Experience", c.total_experience_years != null ? `${c.total_experience_years} years` : null],
    ["Current pay", fixed ? `${fixed} fixed${variable ? ` + ${variable} variable` : ""}` : null],
    ["Expected pay", expected ? `${expected}${c.expected_variable_ctc != null ? ` + ${lpa(c.expected_variable_ctc)} variable` : ""}` : null],
    ["Can join in", c.notice_period],
    ["City", c.current_location],
    ["Offer in hand", typeof seg.offer_in_hand === "boolean" ? (seg.offer_in_hand ? `Yes${typeof seg.offer_ctc === "number" ? `, ${lpa(seg.offer_ctc)}` : ""}` : "No") : null],
  ];
  return rows.filter((r): r is [string, string] => !!r[1]).map(([label, value]) => ({ label, value }));
}

export default function ReturningReviewCard({
  candidate,
  mandateTitle,
  applying,
  error,
  onApply,
  onUpdate,
  onLogout,
}: {
  candidate: ReviewRow;
  mandateTitle?: string;
  applying: boolean;
  error: string | null;
  onApply: () => void;
  onUpdate: () => void;
  onLogout: () => void;
}) {
  const first = candidate.full_name?.trim().split(/\s+/)[0] ?? "";
  const age = daysSince(candidate.details_confirmed_at ?? candidate.updated_at);
  const stale = age == null || age > STALE_DAYS;
  const lines = reviewLines(candidate);

  return (
    <div className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="p-6 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
          {mandateTitle ? `Apply for ${mandateTitle}` : "Apply"}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
          {first ? `Welcome back, ${first}` : "Welcome back"}
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">
          Your details are already with us. If anything has changed since last time, please update it before we send your profile.
        </p>

        {stale && (
          <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium leading-snug text-amber-900">
            {age == null
              ? "We haven't had you confirm these yet. Please check your pay and notice period."
              : `It's been ${age} days since you last updated. Please check your pay and notice period.`}
          </p>
        )}

        <dl className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200">
          {lines.map((l) => (
            <div key={l.label} className="flex items-start justify-between gap-4 px-4 py-3">
              <dt className="shrink-0 text-sm text-slate-500">{l.label}</dt>
              <dd className="text-right text-[15px] font-medium text-slate-900">{l.value}</dd>
            </div>
          ))}
        </dl>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <div className="mt-6 grid gap-3">
          <Button type="button" onClick={onApply} disabled={applying} className="h-12 rounded-2xl text-base">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {applying ? "Applying…" : "All correct, apply"}
          </Button>
          <Button type="button" variant="outline" onClick={onUpdate} disabled={applying} className="h-12 rounded-2xl text-base">
            <Pencil className="mr-2 h-4 w-4" /> Update my details
          </Button>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600"
        >
          <LogOut className="h-3 w-3" /> Not you? Log out
        </button>
      </div>
    </div>
  );
}
