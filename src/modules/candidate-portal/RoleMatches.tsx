"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { budgetLabel, experienceLabel, listOpenJobs, type JobListing } from "@/modules/jobs/api";
import { loadJobMatches, MATCH_TIER_CLASSES, MATCH_TIER_LABEL, matchTier, type JobMatch } from "@/modules/jobs/personal";

// "Roles picked for you" on Home: the best open roles for this candidate's
// profile, each with the reasons it fits. Hidden until there's at least one
// real match, so a thin profile never sees an empty or discouraging box.
export default function RoleMatches() {
  const [picks, setPicks] = useState<{ job: JobListing; match: JobMatch }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listOpenJobs(), loadJobMatches()])
      .then(([jobs, matches]) => {
        if (cancelled) return;
        const byId = new Map(jobs.map((j) => [j.id, j]));
        const top = matches
          .filter((m) => !m.applied && matchTier(m.score) !== null && byId.has(m.mandate_id))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map((m) => ({ job: byId.get(m.mandate_id)!, match: m }));
        setPicks(top);
      })
      .catch(() => {
        if (!cancelled) setPicks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!picks || picks.length === 0) return null;

  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Roles picked for you</h2>
        <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline">
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {picks.map(({ job, match }) => {
          const tier = matchTier(match.score)!;
          const cities = job.cities?.length ? job.cities : job.city ? [job.city] : [];
          const exp = experienceLabel(job.experience_min, job.experience_max);
          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group flex flex-col gap-2.5 rounded-xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
            >
              <span className={`w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold ${MATCH_TIER_CLASSES[tier]}`}>
                {MATCH_TIER_LABEL[tier]} · {match.score}%
              </span>
              <div>
                <p className="text-[15px] font-bold leading-snug text-slate-900 group-hover:text-blue-700">{job.role_title ?? "Open role"}</p>
                {job.client_display && <p className="mt-0.5 text-xs text-slate-500">{job.client_display}</p>}
              </div>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                {cities.length > 0 && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {cities.slice(0, 2).join(", ")}
                  </span>
                )}
                <span>
                  {exp && <>{exp} · </>}
                  {budgetLabel(job.budget_min, job.budget_max)}
                </span>
              </p>
              {match.reasons.length > 0 && (
                <p className="rounded-lg bg-emerald-50/70 px-2.5 py-1.5 text-[11.5px] font-medium leading-snug text-emerald-800">
                  {match.reasons.slice(0, 2).join(" · ")}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
