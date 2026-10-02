"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { budgetLabel, categoryLabel, experienceLabel, listOpenJobs, type JobListing } from "@/modules/jobs/api";

// Real open roles in the hero, instead of a text-only product pitch: shows
// visitors what's actually available the moment the page loads.
export default function HeroLiveCard() {
  const [jobs, setJobs] = useState<JobListing[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listOpenJobs()
      .then((all) => {
        if (!cancelled) setJobs(all);
      })
      .catch(() => {
        if (!cancelled) setJobs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const top = (jobs ?? []).slice(0, 3);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="relative rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.45)]">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Hiring right now
          </p>
          {jobs && jobs.length > 0 && <span className="text-xs font-medium text-slate-400">{jobs.length} open roles</span>}
        </div>

        <div className="space-y-3">
          {jobs === null &&
            [0, 1, 2].map((i) => <div key={i} className="h-[84px] animate-pulse rounded-2xl bg-slate-100" />)}
          {top.map((job) => {
            const cities = job.cities?.length ? job.cities : job.city ? [job.city] : [];
            const exp = experienceLabel(job.experience_min, job.experience_max);
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group block rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-slate-900 group-hover:text-blue-700">{job.role_title ?? "Sales role"}</p>
                    {job.client_display && <p className="mt-0.5 truncate text-xs text-slate-500">{job.client_display}</p>}
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10.5px] font-bold text-blue-700">
                    {categoryLabel(job.category)}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  {cities.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {cities.slice(0, 2).join(", ")}
                    </span>
                  )}
                  <span>
                    {exp && <>{exp} · </>}
                    {budgetLabel(job.budget_min, job.budget_max)}
                  </span>
                </div>
              </Link>
            );
          })}
          {jobs && jobs.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">New roles are added regularly. Create a profile and we will match you.</p>
          )}
        </div>

        <Link href="/jobs" className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
          Browse all roles <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
