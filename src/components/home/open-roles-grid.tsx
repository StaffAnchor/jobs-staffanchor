"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { budgetLabel, categoryLabel, experienceLabel, listOpenJobs, timeAgo, type JobListing } from "@/modules/jobs/api";

const TAG_COLOR: Record<string, string> = {
  b2b_sales: "bg-blue-50 text-blue-700",
  b2c_sales: "bg-violet-50 text-violet-700",
  non_sales: "bg-slate-100 text-slate-600",
};

function initials(title: string | null) {
  const words = (title ?? "Sales").split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "S").toUpperCase() + (words[1]?.[0] ?? "").toUpperCase();
}

// Real, current roles as the main body of the page -- the strongest proof
// there is that this is a live, working place to find a job.
export default function OpenRolesGrid() {
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

  if (jobs && jobs.length === 0) return null;
  const shown = (jobs ?? []).slice(0, 6);

  return (
    <section className="container-page py-16 md:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Hiring right now
          </p>
          <h2 className="mt-3 font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Open roles you can apply to today
          </h2>
        </div>
        <Link href="/jobs" className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:shadow">
          View all {jobs ? jobs.length : ""} roles <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {jobs === null && [0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-slate-100" />)}
        {shown.map((job) => {
          const cities = job.cities?.length ? job.cities : job.city ? [job.city] : [];
          const exp = experienceLabel(job.experience_min, job.experience_max);
          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-[0_28px_60px_-28px_rgba(37,87,230,0.35)]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-extrabold text-white shadow-md shadow-blue-600/25">
                  {initials(job.role_title)}
                </span>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${TAG_COLOR[job.category ?? ""] ?? "bg-slate-100 text-slate-600"}`}>
                  {categoryLabel(job.category)}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold leading-snug tracking-tight text-slate-950 group-hover:text-blue-700">
                {job.role_title ?? "Sales role"}
              </h3>
              {job.client_display && <p className="mt-1 text-sm text-slate-500">{job.client_display}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-600">
                {cities.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" /> {cities.slice(0, 2).join(", ")}
                  </span>
                )}
                <span>
                  {exp && <>{exp} · </>}
                  {budgetLabel(job.budget_min, job.budget_max)}
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                <span className="text-slate-400">{timeAgo(job.created_at)}</span>
                <span className="flex items-center gap-1 font-bold text-blue-600 transition group-hover:gap-2">
                  View role <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
