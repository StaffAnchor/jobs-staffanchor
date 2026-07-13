"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, Building2, TrendingUp, Users, ChevronRight, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
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
  b2b_sales: "bg-blue-50 text-blue-600",
  b2c_sales: "bg-fuchsia-50 text-fuchsia-600",
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">StaffAnchor Careers</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Current Open Mandates</h1>
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

      <Card className="divide-y divide-slate-100 overflow-hidden p-0">
        {filtered.map((job) => {
          const exp = experienceLabel(job.experience_min, job.experience_max);
          const cities = job.cities?.length ? job.cities : job.city ? [job.city] : [];
          const subDomains = job.sub_domains?.length ? job.sub_domains : job.sub_domain ? [job.sub_domain] : [];
          const Icon = CATEGORY_ICON[job.category ?? ""] ?? Briefcase;
          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="group flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-slate-50/80"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  AVATAR_COLOR[job.category ?? ""] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <h2 className="truncate text-[14.5px] font-semibold leading-tight text-slate-900 group-hover:text-blue-600">
                    {job.role_title ?? "Open Role"}
                    {job.client_display && (
                      <span className="ml-1.5 font-normal text-slate-400">— {job.client_display}</span>
                    )}
                  </h2>
                  <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(job.created_at)}</span>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className="text-[12.5px] text-slate-500">
                    {exp && <>{exp} · </>}
                    {budgetLabel(job.budget_min, job.budget_max)}
                  </span>
                  {cities.length > 0 && (
                    <span className="flex items-center gap-1 text-[12.5px] text-slate-500">
                      <MapPin className="h-3 w-3" />
                      {cities.join(", ")}
                    </span>
                  )}
                  <span className="flex flex-wrap gap-1">
                    <Badge className="bg-blue-50 px-2 py-0.5 text-[10.5px] font-semibold text-blue-700">
                      {categoryLabel(job.category)}
                    </Badge>
                    {subDomains.slice(0, 3).map((sd) => (
                      <Badge key={sd} className="px-2 py-0.5 text-[10.5px]">
                        {sd}
                      </Badge>
                    ))}
                    {subDomains.length > 3 && (
                      <Badge className="px-2 py-0.5 text-[10.5px]">+{subDomains.length - 3}</Badge>
                    )}
                  </span>
                </div>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-500" />
            </Link>
          );
        })}
      </Card>
    </div>
  );
}
