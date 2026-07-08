"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, ChevronRight, X } from "lucide-react";
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

const EXPERIENCE_BANDS: { label: string; min: number; max: number }[] = [
  { label: "0-3 Yrs", min: 0, max: 3 },
  { label: "3-6 Yrs", min: 3, max: 6 },
  { label: "6-10 Yrs", min: 6, max: 10 },
  { label: "10-15 Yrs", min: 10, max: 15 },
  { label: "15-20 Yrs", min: 15, max: 20 },
  { label: "20+ Yrs", min: 20, max: 999 },
];

function initialFor(job: JobListing) {
  const source = job.client_display && job.client_display !== "A confidential client" ? job.client_display : job.role_title ?? "?";
  return source.trim().charAt(0).toUpperCase() || "?";
}

const AVATAR_COLOR: Record<string, string> = {
  b2b_sales: "bg-blue-600",
  b2c_sales: "bg-fuchsia-600",
  non_sales: "bg-slate-600",
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">StaffAnchor Sales Careers</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Open Sales Roles</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-40">
            <option value="">Industry</option>
            <option value="b2b_sales">B2B Sales</option>
            <option value="b2c_sales">B2C Sales</option>
            <option value="non_sales">Non-Sales / Other</option>
          </Select>
          <Select value={location} onChange={(e) => setLocation(e.target.value)} className="w-40">
            <option value="">Locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Select value={experienceBand} onChange={(e) => setExperienceBand(e.target.value)} className="w-36">
            <option value="">Experience</option>
            {EXPERIENCE_BANDS.map((b) => (
              <option key={b.label} value={b.label}>
                {b.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {hasFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {industry && (
            <button
              onClick={() => setIndustry("")}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              {categoryLabel(industry)} <X className="h-3 w-3" />
            </button>
          )}
          {location && (
            <button
              onClick={() => setLocation("")}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              {location} <X className="h-3 w-3" />
            </button>
          )}
          {experienceBand && (
            <button
              onClick={() => setExperienceBand("")}
              className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              {experienceBand} <X className="h-3 w-3" />
            </button>
          )}
          <button onClick={clearFilters} className="text-xs font-medium text-blue-600 hover:underline">
            Clear all
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!jobs && !error && (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      )}

      {jobs && filtered.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto mb-3 h-6 w-6 text-slate-300" />
            <p className="text-sm text-slate-500">
              {jobs.length === 0 ? "No open roles right now — check back soon." : "No roles match these filters."}
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="divide-y divide-slate-100 overflow-hidden">
        {filtered.map((job) => {
          const exp = experienceLabel(job.experience_min, job.experience_max);
          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group flex items-start gap-4 p-5 transition-colors hover:bg-slate-50"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base font-bold text-white ${
                  AVATAR_COLOR[job.category ?? ""] ?? "bg-slate-500"
                }`}
              >
                {initialFor(job)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h2 className="text-[15px] font-semibold text-slate-900 group-hover:text-blue-600">
                    {job.role_title ?? "Sales Role"}
                    {job.client_display && (
                      <span className="ml-2 text-[13px] font-normal text-slate-500">— {job.client_display}</span>
                    )}
                  </h2>
                  <span className="shrink-0 text-[12px] text-slate-400">{timeAgo(job.created_at)}</span>
                </div>

                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-slate-500">
                  {exp && <span>{exp}</span>}
                  {exp && <span>·</span>}
                  <span>{budgetLabel(job.budget_min, job.budget_max)}</span>
                  {(job.cities?.length ? job.cities : job.city ? [job.city] : []).length > 0 && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {(job.cities?.length ? job.cities : job.city ? [job.city] : []).join(", ")}
                      </span>
                    </>
                  )}
                </p>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                    {categoryLabel(job.category)}
                  </span>
                  {(job.sub_domains?.length ? job.sub_domains : job.sub_domain ? [job.sub_domain] : []).map((sd) => (
                    <span
                      key={sd}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600"
                    >
                      {sd}
                    </span>
                  ))}
                </div>

                {job.job_description && (
                  <p className="mt-2 text-[12px] font-medium text-blue-600 group-hover:underline">
                    Click here to read Job description
                  </p>
                )}
              </div>

              <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500" />
            </Link>
          );
        })}
      </Card>
    </div>
  );
}
