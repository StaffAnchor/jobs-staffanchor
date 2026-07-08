"use client";

import { useEffect, useState } from "react";
import { Briefcase, MapPin } from "lucide-react";
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

export default function MyPipeline() {
  const [rows, setRows] = useState<PipelineRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_my_pipeline");
      if (cancelled) return;
      if (error) {
        setError(error.message);
        return;
      }
      setRows((data ?? []) as PipelineRow[]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
      <p className="text-sm text-slate-500">
        Every role a StaffAnchor recruiter has matched you to, and exactly where things stand.
      </p>
      {rows.map((r) => {
        const stageIdx = STAGE_ORDER.indexOf(r.stage);
        const maxIdx = STAGE_ORDER.length - 1;
        const progressPct = r.stage === "rejected" ? 100 : stageIdx >= 0 ? ((stageIdx + 1) / (maxIdx + 1)) * 100 : 0;
        return (
          <Card key={r.link_id} className={CARD_CLASSES}>
            <CardContent className="space-y-3 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-slate-900">{r.role_title}</p>
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
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
