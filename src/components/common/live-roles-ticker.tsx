"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin } from "lucide-react";
import { listOpenJobs, categoryLabel, type JobListing } from "@/modules/jobs/api";

// Ambient, always-moving strip of real open roles just under the hero --
// StaffAnchor has no client logos to do the "who trusts us" marquee other
// job boards use, so this does the same job (the page feels alive, not
// static) with something more honest: actual current openings pulled live
// off get_open_job_listings(), the same RPC every other jobs-site listing
// already uses. Renders nothing if there are no open roles or the fetch
// fails -- never blocks or visually breaks the homepage.
export function LiveRolesTicker() {
  const [jobs, setJobs] = useState<JobListing[]>([]);

  useEffect(() => {
    listOpenJobs()
      .then((data) => setJobs(data.slice(0, 12)))
      .catch(() => setJobs([]));
  }, []);

  if (jobs.length === 0) return null;

  // Duplicate the list once so the CSS animation can scroll exactly -50%
  // and loop seamlessly with no visible seam or reset-jump.
  const items = [...jobs, ...jobs];

  return (
    <div className="overflow-hidden border-b border-slate-200 bg-slate-950 py-3">
      <div
        className="ticker-track flex w-max items-center gap-3"
        style={{ animationDuration: `${jobs.length * 4}s` }}
      >
        {items.map((job, i) => (
          <Link
            key={`${job.id}-${i}`}
            href={`/jobs/${job.id}`}
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-white/10"
          >
            <Briefcase className="h-3 w-3 text-indigo-400" />
            <span className="font-semibold text-white">{job.role_title ?? "Sales Role"}</span>
            {job.client_display && <span className="text-slate-400">· {job.client_display}</span>}
            <span className="text-slate-500">· {categoryLabel(job.category)}</span>
            {job.city && (
              <span className="flex items-center gap-1 text-slate-400">
                <MapPin className="h-2.5 w-2.5" /> {job.city}
              </span>
            )}
          </Link>
        ))}
      </div>

      <style>{`
        .ticker-track {
          animation-name: ticker-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .ticker-track {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
