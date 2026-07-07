"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listOpenJobs, categoryLabel, budgetLabel, type JobListing } from "@/modules/jobs/api";

export function CurrentJobsTeaser() {
  const [jobs, setJobs] = useState<JobListing[] | null>(null);

  useEffect(() => {
    listOpenJobs()
      .then((data) => setJobs(data.slice(0, 3)))
      .catch(() => setJobs([]));
  }, []);

  if (jobs && jobs.length === 0) return null;

  return (
    <section id="jobs" className="border-b border-slate-200 bg-white/70">
      <div className="container-page py-14 md:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-800">
              <Briefcase className="h-3.5 w-3.5" />
              Current jobs
            </div>
            <h2 className="font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Open roles you can quick-apply to today
            </h2>
          </div>
          <Link href="/jobs">
            <Button variant="outline" className="rounded-full border-slate-300 bg-white">
              View all roles <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {!jobs && <p className="text-sm text-slate-400">Loading current openings...</p>}

        <div className="grid gap-4 md:grid-cols-3">
          {jobs?.map((job) => (
            <Card key={job.id} className="p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-[11px] font-medium uppercase tracking-wide text-sky-700">
                {categoryLabel(job.category)}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-950">{job.role_title ?? "Sales Role"}</h3>
              {job.client_display && <p className="text-sm font-medium text-slate-600">{job.client_display}</p>}
              <div className="mt-3 flex flex-wrap gap-3 text-[13px] text-slate-500">
                {job.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.city}
                  </span>
                )}
                <span>{budgetLabel(job.budget_min, job.budget_max)}</span>
              </div>
              <Link href={`/jobs/${job.id}`} className="mt-4 block">
                <Button className="w-full rounded-full">Quick Apply</Button>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
