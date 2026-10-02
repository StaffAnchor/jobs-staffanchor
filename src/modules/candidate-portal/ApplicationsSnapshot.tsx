"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { APPLICATION_STEPS, loadMyApplications, statusLabel, stepIndexForStage, type ApplicationRow } from "./applications";

type TabKey = "profile" | "pipeline" | "refer";

// The three most recently moved applications, each with a progress bar, so
// Home answers "what is happening with my applications?" at a glance.
export default function ApplicationsSnapshot({ onNavigate }: { onNavigate: (tab: TabKey) => void }) {
  const [rows, setRows] = useState<ApplicationRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadMyApplications()
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null) return <div className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white" />;

  if (rows.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Your applications</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Nothing yet. Apply to a role and every step will show up here, so you never have to wonder what happened.
        </p>
        <Link href="/jobs" className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800">
          Browse current openings <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Your applications</h2>
        <button onClick={() => onNavigate("pipeline")} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
          Track all <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.slice(0, 3).map((r) => {
          const closed = r.stage === "rejected" || r.stage === "pulled_back";
          const idx = stepIndexForStage(r.stage);
          return (
            <li key={r.link_id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{r.role_title}</p>
                  <p className="truncate text-xs text-slate-500">{r.client_display}</p>
                </div>
                <span className={`shrink-0 text-xs font-semibold ${closed ? "text-slate-400" : "text-blue-700"}`}>{statusLabel(r.stage)}</span>
              </div>
              {!closed && (
                <div className="mt-2.5 flex gap-1" aria-label={`Step ${idx + 1} of ${APPLICATION_STEPS.length}`}>
                  {APPLICATION_STEPS.map((label, i) => (
                    <span key={label} className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-blue-600" : "bg-slate-200"}`} />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
