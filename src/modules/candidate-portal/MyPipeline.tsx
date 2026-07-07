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
  sourced: "bg-slate-100 text-slate-600",
  screened: "bg-slate-100 text-slate-600",
  shortlisted: "bg-teal-100 text-teal-700",
  submitted: "bg-indigo-100 text-indigo-700",
  client_interview: "bg-cyan-100 text-cyan-700",
  offer: "bg-amber-100 text-amber-700",
  placed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-600",
};

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
    return <p className="text-sm text-slate-400">Loading your pipeline…</p>;
  }

  if (rows.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="py-10 text-center">
          <Briefcase className="mx-auto mb-2 h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">
            You&apos;re not linked to any roles yet. When a recruiter matches you to an opening, you&apos;ll
            see its status here — no more wondering what happened after you applied.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Every role a StaffAnchor recruiter has matched you to, and exactly where things stand.
      </p>
      {rows.map((r) => {
        const stageIdx = STAGE_ORDER.indexOf(r.stage);
        const maxIdx = STAGE_ORDER.length - 1;
        const progressPct = r.stage === "rejected" ? 100 : stageIdx >= 0 ? ((stageIdx + 1) / (maxIdx + 1)) * 100 : 0;
        return (
          <Card key={r.link_id} className="border-slate-200 shadow-sm">
            <CardContent className="space-y-2.5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{r.role_title}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
                    <span>{r.client_display}</span>
                    {r.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {r.city}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                    STAGE_COLORS[r.stage] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {STAGE_LABELS[r.stage] ?? r.stage}
                </span>
              </div>
              {r.stage !== "rejected" && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500/80 transition-all duration-500"
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
