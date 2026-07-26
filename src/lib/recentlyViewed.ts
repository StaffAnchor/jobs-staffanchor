// Lightweight "recently viewed jobs" tracker for jobs.staffanchor.com.
// Deliberately client-only (localStorage, no auth, no DB write) -- it's a
// convenience trail for a browsing session, not a record that needs to
// survive a device switch or feed recruiter-facing data anywhere. Purely
// additive: nothing here touches the candidate/application schema.

const KEY = "sa_recently_viewed_jobs";
const MAX_ITEMS = 6;

export type RecentlyViewedJob = {
  id: string;
  role_title: string | null;
  client_display: string | null;
  city: string | null;
};

export function getRecentlyViewedJobs(excludeId?: string): RecentlyViewedJob[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentlyViewedJob[]) : [];
    return excludeId ? parsed.filter((j) => j.id !== excludeId) : parsed;
  } catch {
    return [];
  }
}

export function recordJobView(job: RecentlyViewedJob) {
  if (typeof window === "undefined") return;
  try {
    const existing = getRecentlyViewedJobs().filter((j) => j.id !== job.id);
    const next = [job, ...existing].slice(0, MAX_ITEMS);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort only
  }
}
