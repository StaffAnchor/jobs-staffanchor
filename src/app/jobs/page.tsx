"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, Building2, TrendingUp, Users, ChevronRight, X, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  listOpenJobs,
  categoryLabel,
  budgetLabel,
  experienceLabel,
  timeAgo,
  type JobListing,
} from "@/modules/jobs/api";

// Icon (not a letter initial) per function/domain -- reads calmer at a
// glance across a dense list than a wall of colored letter avatars, and
// doesn't imply a specific company logo we don't have on file.
const CATEGORY_ICON: Record<string, typeof Briefcase> = {
  b2b_sales: Building2,
  b2c_sales: Users,
  non_sales: TrendingUp,
};

const EXPERIENCE_BANDS: { label: string; min: number; max: number }[] = [
  { label: "0-3 Yrs", min: 0, max: 3 },
  { label: "3-6 Yrs", min: 3, max: 6 },
  { label: "6-10 Yrs", min: 6, max: 10 },
  { label: "10-15 Yrs", min: 10, max: 15 },
  { label: "15-20 Yrs", min: 15, max: 20 },
  { label: "20+ Yrs", min: 20, max: 999 },
];

const AVATAR_COLOR: Record<string, string> = {
  b2b_sales: "bg-indigo-50 text-indigo-700",
  b2c_sales: "bg-violet-50 text-violet-700",
  non_sales: "bg-slate-100 text-slate-600",
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [experienceBand, setExperienceBand] = useState("");

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load jobs."));
  }, []);

  const locations = useMemo(() => {
    const all = (jobs ?? []).flatMap((j) => (j.cities && j.cities.length ? j.cities : j.city ? [j.city] : []));
    return Array.from(new Set(all)).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    const band = EXPERIENCE_BANDS.find((b) => b.label === experienceBand);
    return jobs.filter((job) => {
      if (industry && job.category !== industry) return false;
      const jobCities = job.cities && job.cities.length ? job.cities : job.city ? [job.city] : [];
      if (location && !jobCities.includes(location)) return false;
      if (band) {
        const jMin = job.experience_min ?? 0;
        const jMax = job.experience_max ?? 99;
        if (jMax < band.min || jMin > band.max) return false;
      }
      return true;
    });
  }, [jobs, industry, location, experienceBand]);

  const hasFilters = industry || location || experienceBand;

  function clearFilters() {
    setIndustry("");
    setLocation("");
    setExperienceBand("");
  }

  return (
    <div className="bg-slate-50/60">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage: `radial-gradient(#E7E7E0 1px, transparent 1px)`,
            backgroundSize: "26px 26px",
            maskImage: "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-800">
            <Sparkles className="h-3.5 w-3.5" />
            StaffAnchor Careers
          </div>
          <h1 className="mt-4 font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Open Sales &amp; GTM Roles
          </h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500">
            Verified mandates from companies hiring B2B sales talent right now — quota history and deal context
            included, not a pile of unread resumes.
          </p>
          {jobs && jobs.length > 0 && (
            <p className="mt-4 text-xs font-medium text-slate-400">
              {jobs.length} open mandate{jobs.length === 1 ? "" : "s"}
              {locations.length > 0 && <> across {locations.length} location{locations.length === 1 ? "" : "s"}</>}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Filter toolbar */}
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.25)]">
          <Select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-40 rounded-full border-slate-200 bg-slate-50/70 text-[13px] focus-visible:ring-indigo-500">
            <option value="">Industry</option>
            <option value="b2b_sales">B2B Sales</option>
            <option value="b2c_sales">B2C Sales</option>
            <option value="non_sales">Non-Sales / Other</option>
          </Select>
          <Select value={location} onChange={(e) => setLocation(e.target.value)} className="w-40 rounded-full border-slate-200 bg-slate-50/70 text-[13px] focus-visible:ring-indigo-500">
            <option value="">Locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Select value={experienceBand} onChange={(e) => setExperienceBand(e.target.value)} className="w-36 rounded-full border-slate-200 bg-slate-50/70 text-[13px] focus-visible:ring-indigo-500">
            <option value="">Experience</option>
            {EXPERIENCE_BANDS.map((b) => (
              <option key={b.label} value={b.label}>
                {b.label}
              </option>
            ))}
          </Select>

          {hasFilters && (
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {industry && (
                <button
                  onClick={() => setIndustry("")}
                  className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  {categoryLabel(industry)} <X className="h-3 w-3" />
                </button>
              )}
              {location && (
                <button
                  onClick={() => setLocation("")}
                  className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  {location} <X className="h-3 w-3" />
                </button>
              )}
              {experienceBand && (
                <button
                  onClick={() => setExperienceBand("")}
                  className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                >
                  {experienceBand} <X className="h-3 w-3" />
                </button>
              )}
              <button onClick={clearFilters} className="px-2 text-xs font-semibold text-slate-500 hover:text-indigo-700">
                Clear all
              </button>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {!jobs && !error && (
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-5 w-5 text-indigo-500" />
          </div>
        )}

        {jobs && filtered.length === 0 && (
          <Card className="rounded-2xl border-dashed border-slate-300 bg-white/70">
            <CardContent className="py-14 text-center">
              <Briefcase className="mx-auto mb-3 h-6 w-6 text-slate-300" />
              <p className="text-sm text-slate-500">
                {jobs.length === 0 ? "No open roles right now — check back soon." : "No roles match these filters."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Job cards */}
        <div className="space-y-3">
          {filtered.map((job) => {
            const exp = experienceLabel(job.experience_min, job.experience_max);
            const cities = job.cities?.length ? job.cities : job.city ? [job.city] : [];
            const subDomains = job.sub_domains?.length ? job.sub_domains : job.sub_domain ? [job.sub_domain] : [];
            const Icon = CATEGORY_ICON[job.category ?? ""] ?? Briefcase;
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group relative flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_18px_40px_-24px_rgba(79,70,229,0.35)] sm:p-5"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    AVATAR_COLOR[job.category ?? ""] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon className="h-5.5 w-5.5" strokeWidth={1.75} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <h2 className="truncate text-[15px] font-bold leading-tight text-slate-950 group-hover:text-indigo-700">
                      {job.role_title ?? "Open Role"}
                      {job.client_display && (
                        <span className="ml-1.5 font-normal text-slate-400">— {job.client_display}</span>
                      )}
                    </h2>
                    <span className="shrink-0 text-[11px] font-medium text-slate-400">{timeAgo(job.created_at)}</span>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[12.5px] font-medium text-slate-500">
                      {exp && <>{exp} · </>}
                      {budgetLabel(job.budget_min, job.budget_max)}
                    </span>
                    {cities.length > 0 && (
                      <span className="flex items-center gap-1 text-[12.5px] text-slate-500">
                        <MapPin className="h-3 w-3" />
                        {cities.join(", ")}
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[10.5px] font-semibold text-indigo-700">
                      {categoryLabel(job.category)}
                    </span>
                    {subDomains.slice(0, 3).map((sd) => (
                      <span
                        key={sd}
                        className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-[10.5px] font-medium text-slate-600"
                      >
                        {sd}
                      </span>
                    ))}
                    {subDomains.length > 3 && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-[10.5px] font-medium text-slate-500">
                        +{subDomains.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 shrink-0 self-center text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-indigo-500" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
