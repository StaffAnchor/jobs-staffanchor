"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  BellPlus,
  Briefcase,
  Check,
  Heart,
  History,
  IndianRupee,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import {
  listOpenJobs,
  categoryLabel,
  budgetLabel,
  experienceLabel,
  timeAgo,
  type JobListing,
} from "@/modules/jobs/api";
import { getRecentlyViewedJobs, type RecentlyViewedJob } from "@/lib/recentlyViewed";
import { supabase } from "@/lib/supabaseClient";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import {
  createJobAlert,
  loadJobMatches,
  loadSavedJobIds,
  MATCH_TIER_CLASSES,
  MATCH_TIER_LABEL,
  matchTier,
  toggleSavedJob,
  type JobMatch,
} from "@/modules/jobs/personal";

const EXPERIENCE_BANDS: { label: string; min: number; max: number }[] = [
  { label: "0-3 Yrs", min: 0, max: 3 },
  { label: "3-6 Yrs", min: 3, max: 6 },
  { label: "6-10 Yrs", min: 6, max: 10 },
  { label: "10-15 Yrs", min: 10, max: 15 },
  { label: "15-20 Yrs", min: 15, max: 20 },
  { label: "20+ Yrs", min: 20, max: 999 },
];

const CATEGORY_TABS: { value: string; label: string }[] = [
  { value: "", label: "All roles" },
  { value: "b2b_sales", label: "B2B Sales" },
  { value: "b2c_sales", label: "B2C Sales" },
  { value: "non_sales", label: "Non-Sales" },
];

const TAG_COLOR: Record<string, string> = {
  b2b_sales: "bg-blue-50 text-blue-700",
  b2c_sales: "bg-violet-50 text-violet-700",
  non_sales: "bg-slate-100 text-slate-600",
};

const MONOGRAM_GRADIENT: Record<string, string> = {
  b2b_sales: "from-blue-600 to-indigo-700 shadow-blue-600/25",
  b2c_sales: "from-violet-600 to-fuchsia-600 shadow-violet-600/25",
  non_sales: "from-slate-600 to-slate-800 shadow-slate-700/25",
};

function initials(title: string | null) {
  const words = (title ?? "Sales").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "S") + (words[1]?.[0] ?? "")).toUpperCase();
}

function jobCitiesOf(job: JobListing) {
  return job.cities?.length ? job.cities : job.city ? [job.city] : [];
}

function subDomainsOf(job: JobListing) {
  return job.sub_domains?.length ? job.sub_domains : job.sub_domain ? [job.sub_domain] : [];
}

function summaryOf(job: JobListing) {
  const text = job.jd_overview || job.job_description || "";
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "A recruiter will share the full role details when you apply.";
  return clean.length > 320 ? `${clean.slice(0, 320).trimEnd()}…` : clean;
}

export default function JobsPage() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<Map<string, JobMatch>>(new Map());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [matchesOnly, setMatchesOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "match">("newest");
  const [alertBusy, setAlertBusy] = useState(false);
  const [jobs, setJobs] = useState<JobListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [experienceBand, setExperienceBand] = useState("");
  const [search, setSearch] = useState("");
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedJob[]>([]);

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load jobs."));
    setRecentlyViewed(getRecentlyViewedJobs());
    // The homepage search lands here as /jobs?q=... -- start with it applied.
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  // Personalisation only exists for a signed-in candidate; everyone else sees
  // the plain list.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      const isIn = !!data.user;
      setSignedIn(isIn);
      if (!isIn) return;
      try {
        const [m, s] = await Promise.all([loadJobMatches(), loadSavedJobIds()]);
        if (cancelled) return;
        setMatches(new Map(m.map((x) => [x.mandate_id, x])));
        setSaved(new Set(s));
        if (m.some((x) => x.score >= 40)) setSortBy("match");
      } catch {
        // Personalisation is a bonus -- the list still works without it.
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggleSave(e: React.MouseEvent, jobId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!signedIn) {
      router.push("/candidate-login?returnTo=/jobs");
      return;
    }
    const wasSaved = saved.has(jobId);
    setSaved((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
    try {
      await toggleSavedJob(jobId);
    } catch {
      setSaved((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(jobId);
        else next.delete(jobId);
        return next;
      });
      toast.error("Couldn't update your saved roles. Please try again.");
    }
  }

  async function handleCreateAlert() {
    if (!signedIn) {
      router.push("/candidate-login?returnTo=/jobs");
      return;
    }
    setAlertBusy(true);
    try {
      await createJobAlert({ category: industry, city: location, keyword: search });
      toast.success("Alert saved. You'll see new matching roles in your updates.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the alert.");
    } finally {
      setAlertBusy(false);
    }
  }

  const locations = useMemo(() => {
    const all = (jobs ?? []).flatMap(jobCitiesOf);
    return Array.from(new Set(all)).sort();
  }, [jobs]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "": jobs?.length ?? 0 };
    for (const j of jobs ?? []) counts[j.category ?? ""] = (counts[j.category ?? ""] ?? 0) + 1;
    return counts;
  }, [jobs]);

  const filtered = useMemo(() => {
    if (!jobs) return [];
    const band = EXPERIENCE_BANDS.find((b) => b.label === experienceBand);
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (industry && job.category !== industry) return false;
      const cities = jobCitiesOf(job);
      if (location && !cities.includes(location)) return false;
      if (band) {
        const jMin = job.experience_min ?? 0;
        const jMax = job.experience_max ?? 99;
        if (jMax < band.min || jMin > band.max) return false;
      }
      if (q) {
        const haystack = [job.role_title, job.client_display, categoryLabel(job.category), ...cities, ...subDomainsOf(job)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (savedOnly && !saved.has(job.id)) return false;
      if (matchesOnly) {
        const m = matches.get(job.id);
        if (!m || m.score < 55) return false;
      }
      return true;
    });
  }, [jobs, industry, location, experienceBand, search, savedOnly, matchesOnly, saved, matches]);

  const ordered = useMemo(() => {
    if (sortBy !== "match" || matches.size === 0) return filtered;
    return [...filtered].sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0));
  }, [filtered, sortBy, matches]);

  const selected = ordered.find((j) => j.id === selectedId) ?? ordered[0] ?? null;
  const hasFilters = industry || location || experienceBand || search;

  function clearFilters() {
    setIndustry("");
    setLocation("");
    setExperienceBand("");
    setSearch("");
  }

  // On wide screens a click previews the role beside the list; on phones it
  // opens the role, as before.
  function handleCardClick(e: React.MouseEvent, id: string) {
    if (typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches) {
      e.preventDefault();
      setSelectedId(id);
    }
  }

  return (
    <div className="bg-slate-50/70">
      <FloatingWhatsApp source="jobs_list_floating" text="Hi StaffAnchor, I'm looking for sales roles. Could you help me find the right one?" />
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden bg-[#0A1630] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_90%_0%,rgba(76,123,255,0.32),transparent_60%),radial-gradient(40%_60%_at_0%_100%,rgba(16,185,129,0.14),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 md:pt-16 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-100">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" /> StaffAnchor careers
          </div>
          <h1 className="mt-5 max-w-3xl font-(family-name:--font-space-grotesk) text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
            Find your next{" "}
            <span className="font-(family-name:--font-fraunces) font-medium italic text-[#8FB0FF]">sales role.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-blue-100/80">
            Verified mandates from companies hiring right now, with role context included, not a pile of unread resumes.
          </p>

          <div className="mt-8 flex max-w-3xl gap-2 rounded-2xl border border-white/15 bg-white p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
            <div className="flex flex-1 items-center gap-3 px-3">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search roles"
                placeholder="Search role, company or city"
                className="h-12 w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
              {search && (
                <button onClick={() => setSearch("")} aria-label="Clear search" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {CATEGORY_TABS.map((t) => {
              const active = industry === t.value;
              return (
                <button
                  key={t.value || "all"}
                  onClick={() => setIndustry(t.value)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active ? "border-white bg-white text-slate-950" : "border-white/20 bg-white/5 text-blue-100 hover:bg-white/15"
                  }`}
                >
                  {t.label}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${active ? "bg-slate-100 text-slate-600" : "bg-white/10 text-blue-200"}`}>
                    {categoryCounts[t.value] ?? 0}
                  </span>
                </button>
              );
            })}
            <span className="mx-1 hidden h-6 w-px bg-white/15 sm:block" />
            <Select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              aria-label="Location"
              className="h-10 w-44 rounded-full border-white/20 bg-white/10 text-sm text-white focus-visible:ring-white/50 [&>option]:text-slate-900"
            >
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
            <Select
              value={experienceBand}
              onChange={(e) => setExperienceBand(e.target.value)}
              aria-label="Experience"
              className="h-10 w-40 rounded-full border-white/20 bg-white/10 text-sm text-white focus-visible:ring-white/50 [&>option]:text-slate-900"
            >
              <option value="">Any experience</option>
              {EXPERIENCE_BANDS.map((b) => (
                <option key={b.label} value={b.label}>
                  {b.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {recentlyViewed.length > 0 && (
          <div className="mb-5">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              <History className="h-3.5 w-3.5" /> Recently viewed
            </p>
            <div className="flex flex-wrap gap-2">
              {recentlyViewed.map((j) => (
                <Link
                  key={j.id}
                  href={`/jobs/${j.id}`}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700"
                >
                  {j.role_title ?? "Role"}
                  {j.client_display ? ` — ${j.client_display}` : ""}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Results bar + personalisation */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm text-slate-500">
            {jobs ? (
              <>
                <span className="font-bold text-slate-900">{ordered.length}</span> role{ordered.length === 1 ? "" : "s"}
                {hasFilters && " match your filters"}
              </>
            ) : (
              "Loading roles…"
            )}
            {hasFilters && (
              <button onClick={clearFilters} className="ml-3 font-semibold text-blue-600 hover:underline">
                Clear all
              </button>
            )}
          </p>
          {signedIn && (
            <>
              <button
                onClick={() => setMatchesOnly((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  matchesOnly ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                {matchesOnly && <Check className="h-3.5 w-3.5" />} Matches me
              </button>
              <button
                onClick={() => setSavedOnly((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                  savedOnly ? "border-rose-500 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                }`}
              >
                <Heart className="h-3.5 w-3.5" /> Saved{saved.size > 0 ? ` (${saved.size})` : ""}
              </button>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "newest" | "match")}
                aria-label="Sort roles"
                className="h-9 w-40 rounded-full border-slate-200 bg-white text-[13px] focus-visible:ring-blue-500"
              >
                <option value="newest">Newest first</option>
                <option value="match">Best match first</option>
              </Select>
            </>
          )}
          <button
            onClick={handleCreateAlert}
            disabled={alertBusy}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 hover:border-slate-300 disabled:opacity-60"
          >
            <BellPlus className="h-3.5 w-3.5" />
            {alertBusy ? "Saving…" : hasFilters ? "Alert me for this search" : "Alert me for new roles"}
          </button>
        </div>

        {signedIn === false && (
          <p className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-[13px] text-blue-900">
            <Link href="/candidate-login?returnTo=/jobs" className="font-bold underline">
              Sign in
            </Link>{" "}
            to see how well each role fits you, save roles and get alerts for new ones.
          </p>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {jobs && ordered.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Briefcase className="mx-auto mb-3 h-7 w-7 text-slate-300" />
            <p className="text-base font-semibold text-slate-800">
              {jobs.length === 0 ? "No open roles right now" : "No roles match these filters"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {jobs.length === 0 ? "New roles are added regularly. Create a profile and we will match you." : "Try a broader search, or clear the filters."}
            </p>
            {hasFilters ? (
              <button onClick={clearFilters} className="mt-5 inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white">
                Clear filters
              </button>
            ) : (
              <Link href="/register" className="mt-5 inline-flex h-10 items-center rounded-full bg-blue-600 px-5 text-sm font-semibold text-white">
                Create free profile
              </Link>
            )}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
          {/* ───────── List ───────── */}
          <div className="min-w-0 space-y-4">
            {jobs === null && !error && [0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-slate-100" />)}
            {ordered.map((job) => {
              const exp = experienceLabel(job.experience_min, job.experience_max);
              const cities = jobCitiesOf(job);
              const subDomains = subDomainsOf(job);
              const m = matches.get(job.id);
              const tier = m && !m.applied ? matchTier(m.score) : null;
              const isSelected = selected?.id === job.id;
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  onClick={(e) => handleCardClick(e, job.id)}
                  className={`group relative block rounded-3xl border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-28px_rgba(37,87,230,0.35)] sm:p-6 ${
                    isSelected ? "border-blue-500 ring-2 ring-blue-500/15 lg:shadow-[0_24px_50px_-28px_rgba(37,87,230,0.35)]" : "border-slate-200 hover:border-blue-200"
                  }`}
                >
                  <div className="flex gap-4">
                    <span
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-extrabold text-white shadow-md ${
                        MONOGRAM_GRADIENT[job.category ?? ""] ?? MONOGRAM_GRADIENT.non_sales
                      }`}
                    >
                      {initials(job.role_title)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="text-[17px] font-extrabold leading-snug tracking-tight text-slate-950 group-hover:text-blue-700">
                            {job.role_title ?? "Open role"}
                          </h2>
                          {job.client_display && <p className="mt-0.5 text-sm text-slate-500">{job.client_display}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {m?.applied ? (
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">Applied</span>
                          ) : tier ? (
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${MATCH_TIER_CLASSES[tier]}`}>
                              {MATCH_TIER_LABEL[tier]} · {m!.score}%
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={(e) => handleToggleSave(e, job.id)}
                            aria-label={saved.has(job.id) ? "Remove from saved roles" : "Save this role"}
                            aria-pressed={saved.has(job.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Heart className={`h-[18px] w-[18px] ${saved.has(job.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-slate-600">
                        {cities.length > 0 && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-slate-400" /> {cities.slice(0, 3).join(", ")}
                            {cities.length > 3 && ` +${cities.length - 3}`}
                          </span>
                        )}
                        {exp && <span>{exp}</span>}
                        {job.budget_min || job.budget_max ? (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3.5 w-3.5 text-slate-400" />
                            {budgetLabel(job.budget_min, job.budget_max).replace("₹", "")}
                          </span>
                        ) : (
                          <span className="text-slate-400">Pay on request</span>
                        )}
                      </div>

                      {tier && m && m.reasons.length > 0 && (
                        <p className="mt-2.5 text-[12.5px] font-medium text-emerald-700">{m.reasons.slice(0, 2).join(" · ")}</p>
                      )}

                      <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${TAG_COLOR[job.category ?? ""] ?? "bg-slate-100 text-slate-600"}`}>
                          {categoryLabel(job.category)}
                        </span>
                        {subDomains.slice(0, 2).map((sd) => (
                          <span key={sd} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                            {sd}
                          </span>
                        ))}
                        {subDomains.length > 2 && <span className="text-[11px] font-medium text-slate-400">+{subDomains.length - 2}</span>}
                        <span className="ml-auto text-[11px] font-medium text-slate-400">{timeAgo(job.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* ───────── Preview (desktop) ───────── */}
          {selected && (
            <aside className="sticky top-24 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_30px_70px_-40px_rgba(15,23,42,0.4)] lg:block">
              <div className="bg-gradient-to-br from-[#0A1630] to-[#14306b] p-6 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">
                  {categoryLabel(selected.category)}
                  {subDomainsOf(selected).length > 0 && ` · ${subDomainsOf(selected).slice(0, 2).join(", ")}`}
                </p>
                <h2 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight">{selected.role_title ?? "Open role"}</h2>
                {selected.client_display && <p className="mt-1 text-sm text-blue-100/90">{selected.client_display}</p>}
              </div>
              <div className="space-y-5 p-6">
                <dl className="grid grid-cols-2 gap-3 text-[13px]">
                  <div className="rounded-2xl bg-slate-50 p-3.5">
                    <dt className="text-xs text-slate-400">Location</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{jobCitiesOf(selected).slice(0, 2).join(", ") || "—"}</dd>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3.5">
                    <dt className="text-xs text-slate-400">Experience</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{experienceLabel(selected.experience_min, selected.experience_max) ?? "—"}</dd>
                  </div>
                  <div className="col-span-2 rounded-2xl bg-slate-50 p-3.5">
                    <dt className="text-xs text-slate-400">Compensation</dt>
                    <dd className="mt-0.5 font-semibold text-slate-800">{budgetLabel(selected.budget_min, selected.budget_max)}</dd>
                  </div>
                </dl>

                {(() => {
                  const m = matches.get(selected.id);
                  const tier = m && !m.applied ? matchTier(m.score) : null;
                  return tier && m ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                      <p className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${MATCH_TIER_CLASSES[tier]}`}>
                          {MATCH_TIER_LABEL[tier]} · {m.score}%
                        </span>
                        Why you match
                      </p>
                      <ul className="mt-2.5 space-y-1.5 text-[13px] text-emerald-900">
                        {m.reasons.slice(0, 4).map((r) => (
                          <li key={r} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 text-emerald-600" /> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null;
                })()}

                <p className="text-[13.5px] leading-6 text-slate-600">{summaryOf(selected)}</p>

                <div className="flex gap-3">
                  <Link
                    href={`/jobs/${selected.id}#apply-form`}
                    className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700"
                  >
                    {matches.get(selected.id)?.applied ? "View application" : "Apply now"}
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => handleToggleSave(e, selected.id)}
                    aria-label={saved.has(selected.id) ? "Remove from saved roles" : "Save this role"}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Heart className={`h-5 w-5 ${saved.has(selected.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                  </button>
                </div>
                <Link href={`/jobs/${selected.id}`} className="flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
                  View full details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
