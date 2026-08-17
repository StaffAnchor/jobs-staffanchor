"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabaseClient";

type PipelineRow = {
  link_id: string;
  mandate_id: string;
  role_title: string;
  stage: string;
  client_display: string;
  city: string | null;
  in_shortlist: boolean;
  linked_at: string;
  is_priority: boolean;
};

const STAGE_ORDER = ["sourced", "screened", "shortlisted", "submitted", "client_interview", "offer", "placed"];

const STAGE_LABELS: Record<string, string> = {
  sourced: "Sourced",
  screened: "Screened",
  shortlisted: "Shortlisted",
  submitted: "Submitted to client",
  client_interview: "Client interview",
  offer: "Offer",
  placed: "Placed",
  rejected: "Not selected",
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

const CARD_CLASSES =
  "rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]";

// candidateId is threaded down from candidate-portal/page.tsx (already
// resolved there via get_or_create_my_candidate_profile) so this list can
// spend a priority credit directly against a row's link_id without a
// second round trip just to find out who's logged in.
export default function MyPipeline({ candidateId }: { candidateId: string }) {
  const [rows, setRows] = useState<PipelineRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [spendingId, setSpendingId] = useState<string | null>(null);

  async function loadPipeline() {
    const [{ data, error }, { data: bal }] = await Promise.all([
      supabase.rpc("get_my_pipeline"),
      supabase.rpc("get_my_priority_balance"),
    ]);
    if (error) {
      setError(error.message);
      return;
    }
    setRows((data ?? []) as PipelineRow[]);
    const balRow = Array.isArray(bal) ? bal[0] : bal;
    setBalance(balRow?.priority_credits ?? 0);
  }

  useEffect(() => {
    let cancelled = false;
    loadPipeline().catch((e) => {
      if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function makePriority(linkId: string) {
    if (balance < 1) return;
    setSpendingId(linkId);
    try {
      const res = await fetch("/api/priority/apply-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId, linkId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't apply priority.");
      setRows((prev) => (prev ? prev.map((r) => (r.link_id === linkId ? { ...r, is_priority: true } : r)) : prev));
      setBalance(data.remainingBalance ?? balance - 1);
    } catch {
      // Non-fatal -- row just stays non-priority, candidate can retry.
    } finally {
      setSpendingId(null);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (rows === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-slate-100 bg-white/60 shadow-sm"
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className={CARD_CLASSES}>
        <CardContent className="py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Briefcase className="h-5.5 w-5.5 text-indigo-400" />
          </div>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
            You&apos;re not linked to any roles yet. When a recruiter matches you to an opening, you&apos;ll
            see its status here — no more wondering what happened after you applied.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Every role a StaffAnchor recruiter has matched you to, and exactly where things stand.
        </p>
        <Link
          href="/priority-applicant"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
        >
          <Zap className="h-3.5 w-3.5" />
          {balance > 0 ? `${balance} priority credit${balance === 1 ? "" : "s"}` : "Get Priority credits"}
        </Link>
      </div>
      {rows.map((r) => {
        const stageIdx = STAGE_ORDER.indexOf(r.stage);
        const maxIdx = STAGE_ORDER.length - 1;
        const progressPct = r.stage === "rejected" ? 100 : stageIdx >= 0 ? ((stageIdx + 1) / (maxIdx + 1)) * 100 : 0;
        return (
          <Card key={r.link_id} className={CARD_CLASSES}>
            <CardContent className="space-y-3 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-semibold text-slate-900">{r.role_title}</p>
                    {r.is_priority && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Zap className="h-2.5 w-2.5" /> Priority
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{r.client_display}</span>
                    {r.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> {r.city}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
                    STAGE_COLORS[r.stage] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {STAGE_LABELS[r.stage] ?? r.stage}
                </span>
              </div>
              {r.stage !== "rejected" && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-700 ease-out"
                    style={{ width: `${Math.max(progressPct, 6)}%` }}
                  />
                </div>
              )}
              {!r.is_priority &&
                (balance > 0 ? (
                  <button
                    onClick={() => makePriority(r.link_id)}
                    disabled={spendingId === r.link_id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                  >
                    <Zap className="h-3 w-3" />
                    {spendingId === r.link_id ? "Applying…" : "Use 1 credit to make Priority"}
                  </button>
                ) : (
                  <Link
                    href={`/priority-applicant?mandateId=${r.mandate_id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Zap className="h-3 w-3" />
                    Make Priority
                  </Link>
                ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
