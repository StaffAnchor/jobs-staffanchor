"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowRight,
  BellPlus,
  Briefcase,
  Building2,
  Flame,
  Share2,
  SlidersHorizontal,
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
import QuickInterest from "@/modules/jobs/QuickInterest";
import { COPY, PAID_CALL_RUPEES, PAID_CALL_WORKING_DAYS } from "@/lib/paid-call";
import WhyPrice from "@/components/paid-call/why-price";
import {
  listOpenJobs,
  categoryLabel,
  budgetLabel,
  experienceLabel,
  salesFacts,
  jobPath,
  timeAgo,
  type JobListing,
  logPaidCallClick,
} from "@/modules/jobs/api";
import { getRecentlyViewedJobs, type RecentlyViewedJob } from "@/lib/recentlyViewed";
import { supabase } from "@/lib/supabaseClient";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import EdgePromo from "@/components/edge/edge-promo";
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

const PAY_BANDS: { label: string; min: number }[] = [
  { label: "₹10L and above", min: 10 },
  { label: "₹15L and above", min: 15 },
  { label: "₹20L and above", min: 20 },
  { label: "₹30L and above", min: 30 },
  { label: "₹50L and above", min: 50 },
];

const POSTED_WINDOWS: { label: string; days: number }[] = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
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

function shareLink(job: JobListing) {
  const url = `https://jobs.staffanchor.com${jobPath(job)}`;
  const text = `${job.role_title ?? "A sales role"}${job.client_display ? ` — ${job.client_display}` : ""}. Take a look: ${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function isPipeline(job: { listing_kind?: string | null }) {
  return job.listing_kind === "pipeline";
}

function isFresh(createdAt: string) {
  return new Date().getTime() - new Date(createdAt).getTime() < 3 * 86_400_000;
}

function jobCitiesOf(job: JobListing) {
  return job.cities?.length ? job.cities : job.city ? [job.city] : [];
}

function subDomainsOf(job: JobListing) {
  return job.sub_domains?.length ? job.sub_domains : job.sub_domain ? [job.sub_domain] : [];
}

export default function JobsPage() {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<Map<string, JobMatch>>(new Map());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [matchesOnly, setMatchesOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "match" | "pay" | "experience">("newest");
  const [alertBusy, setAlertBusy] = useState(false);
  const [jobs, setJobs] = useState<JobListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [interestFor, setInterestFor] = useState<{ job: JobListing; paid: boolean } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState<"live" | "pipeline">("live");

  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [experienceBand, setExperienceBand] = useState("");
  const [payBand, setPayBand] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [posted, setPosted] = useState("");
  const [search, setSearch] = useState("");
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedJob[]>([]);

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load jobs."));
    setRecentlyViewed(getRecentlyViewedJobs());
    // The homepage search lands here as /jobs?q=... -- start with it applied.
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q");
    if (q) setSearch(q);
    if (sp.get("view") === "pipeline") setView("pipeline");
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

  const workModes = useMemo(() => {
    const all = (jobs ?? []).map((j) => j.work_mode).filter((v): v is string => !!v);
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
      const pay = PAY_BANDS.find((b) => b.label === payBand);
      if (pay && (job.budget_max ?? job.budget_min ?? 0) < pay.min) return false;
      if (workMode && job.work_mode !== workMode) return false;
      const win = POSTED_WINDOWS.find((w) => w.label === posted);
      if (win && new Date().getTime() - new Date(job.created_at).getTime() > win.days * 86_400_000) return false;
      if (savedOnly && !saved.has(job.id)) return false;
      if (matchesOnly) {
        const m = matches.get(job.id);
        if (!m || m.score < 55) return false;
      }
      return true;
    });
  }, [jobs, industry, location, experienceBand, payBand, workMode, posted, search, savedOnly, matchesOnly, saved, matches]);

  const ordered = useMemo(() => {
    const liveFirst = (list: JobListing[]) => [...list.filter((j) => !isPipeline(j)), ...list.filter(isPipeline)];
    if (sortBy === "pay") return liveFirst([...filtered].sort((a, b) => (b.budget_max ?? b.budget_min ?? 0) - (a.budget_max ?? a.budget_min ?? 0)));
    if (sortBy === "experience") return liveFirst([...filtered].sort((a, b) => (b.experience_max ?? b.experience_min ?? 0) - (a.experience_max ?? a.experience_min ?? 0)));
    if (sortBy !== "match" || matches.size === 0) return liveFirst(filtered);
    return liveFirst([...filtered].sort((a, b) => (matches.get(b.id)?.score ?? 0) - (matches.get(a.id)?.score ?? 0)));
  }, [filtered, sortBy, matches]);

  const liveCount = ordered.filter((j) => !isPipeline(j)).length;
  const pipelineCount = ordered.length - liveCount;
  const hasPipeline = (jobs ?? []).some(isPipeline);
  const hasLive = (jobs ?? []).some((j) => !isPipeline(j));
  // With no live roles at all, open on the pipeline tab so the page is never empty.
  const activeView: "live" | "pipeline" = hasPipeline && (view === "pipeline" || !hasLive) ? "pipeline" : "live";
  const shown = hasPipeline ? ordered.filter((j) => isPipeline(j) === (activeView === "pipeline")) : ordered;

  const stats = useMemo(() => {
    const list = (jobs ?? []).filter((j) => !isPipeline(j));
    const cities = new Set(list.flatMap(jobCitiesOf));
    const top = list.reduce((m, j) => Math.max(m, j.budget_max ?? j.budget_min ?? 0), 0);
    return { roles: list.length, cities: cities.size, top };
  }, [jobs]);

  const activeFilterCount = [location, experienceBand, payBand, workMode, posted].filter(Boolean).length;
  const hasFilters = industry || location || experienceBand || payBand || workMode || posted || search;

  function clearFilters() {
    setIndustry("");
    setLocation("");
    setExperienceBand("");
    setPayBand("");
    setWorkMode("");
    setPosted("");
    setSearch("");
  }

  return (
    <div className="bg-slate-50/70">
      <FloatingWhatsApp compact source="jobs_list_floating" text="Hi StaffAnchor, I'm looking for sales roles. Could you help me find the right one?" />
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden bg-[#0A1630] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_70%_at_90%_0%,rgba(76,123,255,0.38),transparent_60%),radial-gradient(40%_60%_at_0%_100%,rgba(16,185,129,0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="jobs-drift pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#4C7BFF]/25 blur-3xl" />
        <div className="relative mx-auto max-w-[1360px] px-4 pb-10 pt-12 sm:px-6 md:pt-16 lg:px-8">
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

          {stats.roles > 0 && (
            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              <div>
                <p className="font-(family-name:--font-space-grotesk) text-3xl font-black leading-none">{stats.roles}</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-wider text-blue-200/70">Live roles</p>
              </div>
              {stats.cities > 0 && (
                <div>
                  <p className="font-(family-name:--font-space-grotesk) text-3xl font-black leading-none">{stats.cities}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-blue-200/70">Cities</p>
                </div>
              )}
              {stats.top > 0 && (
                <div>
                  <p className="font-(family-name:--font-space-grotesk) text-3xl font-black leading-none text-emerald-300">₹{stats.top}L</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-blue-200/70">Top pay on offer</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex max-w-3xl gap-2 rounded-2xl border border-white/20 bg-white p-2 shadow-[0_30px_80px_-24px_rgba(76,123,255,0.65)] ring-4 ring-white/10 transition focus-within:ring-[#8FB0FF]/40">
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
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                showFilters || activeFilterCount > 0 ? "border-[#8FB0FF] bg-[#8FB0FF]/15 text-white" : "border-white/20 bg-white/5 text-blue-100 hover:bg-white/15"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {activeFilterCount > 0 && <span className="rounded-full bg-white px-1.5 text-[11px] font-bold text-slate-900">{activeFilterCount}</span>}
            </button>
          </div>
          <div className={`mt-3 flex-wrap items-center gap-2 ${showFilters ? "flex" : "hidden"}`}>
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
            <Select value={payBand} onChange={(e) => setPayBand(e.target.value)} aria-label="Pay" className="h-10 w-44 rounded-full border-white/20 bg-white/10 text-sm text-white focus-visible:ring-white/50 [&>option]:text-slate-900">
              <option value="">Any pay</option>
              {PAY_BANDS.map((b) => (
                <option key={b.label} value={b.label}>
                  {b.label}
                </option>
              ))}
            </Select>
            {workModes.length > 0 && (
              <Select value={workMode} onChange={(e) => setWorkMode(e.target.value)} aria-label="Work mode" className="h-10 w-40 rounded-full border-white/20 bg-white/10 text-sm text-white focus-visible:ring-white/50 [&>option]:text-slate-900">
                <option value="">Any work mode</option>
                {workModes.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            )}
            <Select value={posted} onChange={(e) => setPosted(e.target.value)} aria-label="Posted" className="h-10 w-40 rounded-full border-white/20 bg-white/10 text-sm text-white focus-visible:ring-white/50 [&>option]:text-slate-900">
              <option value="">Posted any time</option>
              {POSTED_WINDOWS.map((w) => (
                <option key={w.label} value={w.label}>
                  {w.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1360px] px-4 py-8 sm:px-6 lg:px-8">
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

        {hasPipeline && (
          <div className="mb-6">
            <div role="tablist" aria-label="Current openings" className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
              {([
                { key: "live", label: "Live jobs", count: liveCount },
                { key: "pipeline", label: "Pipeline roles", count: pipelineCount },
              ] as const).map((t) => {
                const on = activeView === t.key;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={on}
                    onClick={() => {
                      setView(t.key);
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-[15px] font-extrabold transition sm:text-base ${
                      on ? "bg-slate-950 text-white shadow-md" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {t.label}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${on ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}>{t.count}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2.5 px-1 text-[13px] text-slate-500">
              {activeView === "pipeline"
                ? "Roles we regularly place into. Apply and we'll shortlist you for companies hiring in this space."
                : "Open now with a hiring company. Apply and a recruiter will get back to you."}
            </p>
          </div>
        )}

        {/* Results bar + personalisation */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm text-slate-500">
            {jobs ? (
              <>
                <span className="font-bold text-slate-900">{shown.length}</span> role{shown.length === 1 ? "" : "s"}
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
            </>
          )}
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "match" | "pay" | "experience")}
            aria-label="Sort roles"
            className="h-9 w-44 rounded-full border-slate-200 bg-white text-[13px] focus-visible:ring-blue-500"
          >
            <option value="newest">Newest first</option>
            <option value="pay">Highest pay first</option>
            <option value="experience">Most senior first</option>
            {signedIn && matches.size > 0 && <option value="match">Best match first</option>}
          </Select>
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

        {jobs && shown.length === 0 && (
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

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          {/* ───────── List ───────── */}
          <div className="min-w-0 space-y-4">
            {jobs === null && !error && [0, 1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-3xl bg-slate-100" />)}
            {shown.map((job) => {
              const exp = experienceLabel(job.experience_min, job.experience_max);
              const cities = jobCitiesOf(job);
              const subDomains = subDomainsOf(job);
              const m = matches.get(job.id);
              const tier = m && !m.applied ? matchTier(m.score) : null;
              const applied = !!m?.applied;
              const openApply = (e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`${jobPath(job)}#apply-form`, "_blank", "noopener,noreferrer");
              };
              const iconButtons = (
                <div className="flex shrink-0 items-center gap-0.5">
                  <a
                    href={shareLink(job)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Share this role on WhatsApp"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                  >
                    <Share2 className="h-[18px] w-[18px]" />
                  </a>
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
              );
              const badges = [
                isPipeline(job) && (
                  <span key="p" className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200">
                    Pipeline role
                  </span>
                ),
                isFresh(job.created_at) && !isPipeline(job) && !applied && (
                  <span key="n" className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 ring-1 ring-amber-200">
                    <Flame className="h-3 w-3" /> New
                  </span>
                ),
                applied ? (
                  <span key="a" className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">Applied</span>
                ) : tier ? (
                  <span key="m" className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${MATCH_TIER_CLASSES[tier]}`}>
                    {MATCH_TIER_LABEL[tier]} · {m!.score}%
                  </span>
                ) : null,
              ].filter(Boolean);
              // Every action lives on the card: apply free, or apply and get a recruiter call. One block, shown under the card on a
              // phone and in the right-hand column on a laptop.
              const actions = applied ? (
                <button type="button" onClick={openApply} className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-50 text-[14px] font-extrabold text-blue-700">
                  Already applied · view application <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div>
                  <div className="grid grid-cols-[5fr_7fr] gap-2.5 lg:grid-cols-1 lg:gap-2">
                    <button
                      type="button"
                      onClick={openApply}
                      className="flex min-h-14 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-2 py-1.5 text-white shadow-md shadow-emerald-600/25 transition active:scale-[0.98] lg:min-h-11 lg:rounded-lg lg:py-1 lg:shadow-sm"
                    >
                      <span className="flex flex-col items-center leading-[1.15]">
                        <span className="text-[13px] font-extrabold lg:text-[13px]">{COPY.listFree}</span>
                        <span className="mt-0.5 text-[10px] font-medium opacity-90 lg:text-[10.5px]">{COPY.listFreeSub}</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        logPaidCallClick(job.id, "list");
                        setInterestFor({ job, paid: true });
                      }}
                      className="flex min-h-14 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-2 py-1.5 text-white shadow-md shadow-blue-600/25 transition active:scale-[0.98] lg:min-h-11 lg:rounded-lg lg:py-1 lg:shadow-sm"
                    >
                      <span className="flex flex-col items-center leading-[1.15]">
                        <span className="whitespace-nowrap text-[13px] font-extrabold lg:text-[13px]">{COPY.listPaid}</span>
                        <span className="mt-0.5 whitespace-nowrap text-[10px] font-medium opacity-90 lg:text-[10.5px]">{COPY.listPaidSub}</span>
                      </span>
                    </button>
                  </div>
                  <p className="mt-2 text-center text-[11.5px] leading-4 text-slate-500 lg:mt-1.5 lg:text-[11px]">No call in {PAID_CALL_WORKING_DAYS} working days? Full refund.</p>
                </div>
              );
              return (
                <div
                  key={job.id}
                  style={{ animationDelay: `${Math.min(shown.indexOf(job), 8) * 55}ms` }}
                  className="jobs-rise group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_24px_50px_-28px_rgba(37,87,230,0.35)] sm:p-5 lg:p-6"
                >
                  <span
                    aria-hidden
                    className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b opacity-0 transition group-hover:opacity-100 ${
                      MONOGRAM_GRADIENT[job.category ?? ""]?.split(" shadow")[0] ?? "from-slate-600 to-slate-800"
                    }`}
                  />
                  <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_216px] lg:gap-6">
                    <div className="flex gap-3.5 sm:gap-4">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-[15px] font-extrabold text-white shadow-md sm:h-14 sm:w-14 sm:text-base ${
                          MONOGRAM_GRADIENT[job.category ?? ""] ?? MONOGRAM_GRADIENT.non_sales
                        }`}
                      >
                        {initials(job.role_title)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {/* The title is the link; its stretched area makes the whole card open the role, while the buttons sit above it. */}
                            <h2 className="text-[17px] font-extrabold leading-snug tracking-tight text-slate-950 group-hover:text-blue-700 lg:text-[19px]">
                              <Link href={jobPath(job)} className="after:absolute after:inset-0 after:z-0 after:content-['']">
                                {job.role_title ?? "Open role"}
                              </Link>
                            </h2>
                            {job.client_display && (
                              <p className="mt-0.5 flex items-center gap-1.5 text-[13.5px] text-slate-500">
                                <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" /> <span className="truncate">{job.client_display}</span>
                              </p>
                            )}
                          </div>
                          <div className="relative z-10 -mr-1 -mt-1 lg:hidden">{iconButtons}</div>
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
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 ring-1 ring-emerald-200">
                              <IndianRupee className="h-3.5 w-3.5" />
                              {budgetLabel(job.budget_min, job.budget_max).replace("₹", "")}
                            </span>
                          ) : (
                            <span className="text-slate-400">Pay on request</span>
                          )}
                        </div>

                        {badges.length > 0 && <div className="mt-2.5 flex flex-wrap items-center gap-1.5 lg:hidden">{badges}</div>}

                        {salesFacts(job).length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {salesFacts(job).map((f) => (
                              <span key={f.label} className="inline-flex items-baseline gap-1.5 rounded-xl bg-slate-50 px-2.5 py-1.5 text-[12px] ring-1 ring-slate-100">
                                <span className="text-slate-400">{f.label}</span>
                                <span className="font-semibold text-slate-800">{f.value}</span>
                              </span>
                            ))}
                          </div>
                        )}

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
                          <span className="ml-auto text-[11px] font-medium text-slate-400 lg:hidden">{timeAgo(job.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Laptop: the card's own column of actions. */}
                    <div className="hidden lg:flex lg:flex-col lg:border-l lg:border-slate-100 lg:pl-6">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-medium text-slate-400">{timeAgo(job.created_at)}</span>
                        <div className="relative z-10 -mr-2">{iconButtons}</div>
                      </div>
                      {badges.length > 0 && <div className="mt-2 flex flex-wrap items-center gap-1.5">{badges}</div>}
                      <div className="relative z-10 mt-auto pt-4">{actions}</div>
                    </div>
                  </div>

                  {/* Phone: the same actions under the card. */}
                  <div className="relative z-10 mt-4 lg:hidden">{actions}</div>
                </div>
              );
            })}
          </div>

          {/* ───────── Right rail (laptop): how applying works, and Edge ───────── */}
          <aside className="sticky top-24 hidden space-y-4 lg:block">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Two ways to apply</p>
              <ul className="mt-3 space-y-3.5 text-[13.5px] leading-5 text-slate-600">
                <li>
                  <span className="font-extrabold text-slate-900">{COPY.listFree}.</span> {COPY.freeLine}
                </li>
                <li>
                  <span className="font-extrabold text-slate-900">{COPY.listPaid} · ₹{PAID_CALL_RUPEES}.</span> {COPY.paidLine}
                </li>
              </ul>
              <p className="mt-3 text-[12px] leading-5 text-slate-500">{COPY.refundLine}</p>
              <WhyPrice className="mt-2 text-left [&_summary]:text-left [&_p]:text-left" />
            </section>
            <EdgePromo variant="job" page="jobs-rail" />
          </aside>
        </div>
      </div>
      <div className="mx-auto max-w-[1360px] px-4 pb-12 sm:px-6 lg:px-8">
        <EdgePromo variant="strip" page="jobs-list" />
      </div>
      {interestFor && (
        <QuickInterest paid={interestFor.paid} pipeline={isPipeline(interestFor.job)} jobId={interestFor.job.id} roleTitle={interestFor.job.role_title ?? "Open role"} client={interestFor.job.client_display ?? null} onClose={() => setInterestFor(null)} />
      )}
    </div>
  );
}
