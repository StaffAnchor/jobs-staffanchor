"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BellRing, Heart, X } from "lucide-react";
import { listOpenJobs, type JobListing } from "@/modules/jobs/api";
import {
  deleteJobAlert,
  describeAlert,
  loadJobAlerts,
  loadSavedJobIds,
  toggleSavedJob,
  type JobAlert,
} from "@/modules/jobs/personal";

// Saved roles and job alerts in one place on Home, so a candidate can come
// back to what they bookmarked and see what they're being alerted about.
export default function SavedAndAlerts() {
  const [saved, setSaved] = useState<JobListing[] | null>(null);
  const [alerts, setAlerts] = useState<JobAlert[]>([]);

  const load = useCallback(async () => {
    try {
      const [jobs, ids, al] = await Promise.all([listOpenJobs(), loadSavedJobIds(), loadJobAlerts()]);
      const byId = new Map(jobs.map((j) => [j.id, j]));
      setSaved(ids.map((id) => byId.get(id)).filter((j): j is JobListing => !!j));
      setAlerts(al);
    } catch {
      setSaved([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (!saved || (saved.length === 0 && alerts.length === 0)) return null;

  async function unsave(id: string) {
    setSaved((prev) => (prev ? prev.filter((j) => j.id !== id) : prev));
    try {
      await toggleSavedJob(id);
    } catch {
      toast.error("Couldn't remove that role. Please try again.");
      void load();
    }
  }

  async function removeAlert(id: string) {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteJobAlert(id);
    } catch {
      toast.error("Couldn't remove that alert. Please try again.");
      void load();
    }
  }

  return (
    <section className="mb-6 grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <Heart className="h-4 w-4 text-rose-500" /> Saved roles
        </h2>
        {saved.length === 0 ? (
          <p className="text-sm text-slate-500">
            Tap the heart on any role to keep it here.{" "}
            <Link href="/jobs" className="font-semibold text-blue-600 hover:underline">
              Browse roles
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {saved.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <Link href={`/jobs/${j.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 hover:text-blue-700">{j.role_title ?? "Open role"}</p>
                  <p className="truncate text-xs text-slate-500">{j.client_display}</p>
                </Link>
                <button
                  type="button"
                  onClick={() => unsave(j.id)}
                  aria-label={`Remove ${j.role_title ?? "role"} from saved`}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
          <BellRing className="h-4 w-4 text-amber-500" /> Job alerts
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-slate-500">
            Set up an alert from the{" "}
            <Link href="/jobs" className="font-semibold text-blue-600 hover:underline">
              jobs page
            </Link>{" "}
            and new matching roles will show up in your updates.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <p className="min-w-0 truncate text-sm font-medium text-slate-800">{describeAlert(a)}</p>
                <button
                  type="button"
                  onClick={() => removeAlert(a.id)}
                  aria-label="Remove this alert"
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
