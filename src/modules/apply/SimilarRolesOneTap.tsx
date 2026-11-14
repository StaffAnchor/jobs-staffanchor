"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { authHeaders } from "@/lib/auth-headers";
import { getOpenJob, jobPath, listOpenJobs, budgetLabel, type JobListing } from "@/modules/jobs/api";
import { fetchApplicationQuestions } from "./applicationQuestions";

type Row = { job: JobListing; needsAnswers: boolean };

// After applying: two or three open roles that look like the one they just applied to. A role with no extra questions can be
// applied to in one tap with the profile they just confirmed; a role that asks questions opens its own form.
export default function SimilarRolesOneTap({ currentMandateId, email }: { currentMandateId: string; email: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [state, setState] = useState<Record<string, "busy" | "done" | "error">>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, here, pipeline] = await Promise.all([listOpenJobs(), getOpenJob(currentMandateId), supabase.rpc("get_my_pipeline")]);
        const applied = new Set(((pipeline.data ?? []) as { mandate_id: string }[]).map((r) => r.mandate_id));
        const cities = new Set([...(here?.cities ?? []), ...(here?.city ? [here.city] : [])].map((c) => c.toLowerCase()));
        const scored = all
          .filter((j) => j.id !== currentMandateId && !applied.has(j.id) && j.listing_kind !== "pipeline")
          .map((j) => {
            const jc = [...(j.cities ?? []), ...(j.city ? [j.city] : [])].map((c) => c.toLowerCase());
            const sameCity = jc.some((c) => cities.has(c));
            const sameCat = !!here?.category && j.category === here.category;
            const sameSub = !!here?.sub_domain && (j.sub_domain === here.sub_domain || (j.sub_domains ?? []).includes(here.sub_domain));
            return { j, score: (sameCat ? 2 : 0) + (sameCity ? 2 : 0) + (sameSub ? 2 : 0) };
          })
          .filter((x) => x.score >= 2)
          .sort((a, b) => b.score - a.score || +new Date(b.j.created_at) - +new Date(a.j.created_at))
          .slice(0, 3);
        const withQs = await Promise.all(scored.map(async ({ j }) => ({ job: j, needsAnswers: (await fetchApplicationQuestions(j.id)).length > 0 })));
        if (!cancelled) setRows(withQs);
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentMandateId]);

  async function apply(id: string) {
    setState((s) => ({ ...s, [id]: "busy" }));
    try {
      const res = await fetch("/api/candidate-submit", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ payload: { email }, mandateId: id, confirmDetails: true }) });
      setState((s) => ({ ...s, [id]: res.ok ? "done" : "error" }));
    } catch {
      setState((s) => ({ ...s, [id]: "error" }));
    }
  }

  if (!rows || rows.length === 0) return null;
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">More roles that fit you</h3>
      <p className="mt-0.5 text-sm text-slate-500">Same kind of work, same city. Apply in one tap with the profile you just confirmed.</p>
      <ul className="mt-4 divide-y divide-slate-100">
        {rows.map(({ job, needsAnswers }) => {
          const st = state[job.id];
          const where = job.cities?.length ? job.cities.join(", ") : job.city;
          const pay = job.budget_min || job.budget_max ? budgetLabel(job.budget_min, job.budget_max) : null;
          return (
            <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <Link href={jobPath(job)} className="block truncate text-[15px] font-semibold text-slate-900 hover:underline">{job.role_title}</Link>
                <p className="truncate text-sm text-slate-500">{[job.client_display, where, pay].filter(Boolean).join(" · ")}</p>
              </div>
              {st === "done" ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700"><Check className="h-4 w-4" /> Applied</span>
              ) : needsAnswers ? (
                <Link href={`${jobPath(job)}#apply-form`} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">Answer a few questions</Link>
              ) : (
                <button type="button" onClick={() => void apply(job.id)} disabled={st === "busy"} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                  {st === "busy" && <Loader2 className="h-4 w-4 animate-spin" />} {st === "error" ? "Try again" : "Apply in one tap"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
