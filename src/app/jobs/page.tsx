"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, IndianRupee, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { listOpenJobs, categoryLabel, budgetLabel, type JobListing } from "@/modules/jobs/api";

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobListing[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listOpenJobs()
      .then(setJobs)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load jobs."));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Open roles</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Current openings</h1>
        <p className="mt-2 text-sm text-slate-500">
          Apply in under a minute — a StaffAnchor recruiter will follow up to complete the rest of your profile.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!jobs && !error && (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      )}

      {jobs && jobs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Briefcase className="mx-auto mb-3 h-6 w-6 text-slate-300" />
            <p className="text-sm text-slate-500">No open roles right now — check back soon.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {jobs?.map((job) => (
          <Card key={job.id} className="flex flex-col justify-between transition hover:shadow-md">
            <CardContent className="flex flex-1 flex-col gap-3 p-5">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">
                  {categoryLabel(job.category)}
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">{job.role_title ?? "Sales Role"}</h2>
                {job.sub_domain && <p className="text-sm text-slate-500">{job.sub_domain}</p>}
              </div>
              <div className="flex flex-wrap gap-3 text-[13px] text-slate-500">
                {job.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <IndianRupee className="h-3.5 w-3.5" /> {budgetLabel(job.budget_min, job.budget_max)}
                </span>
              </div>
              <div className="mt-auto pt-2">
                <Link href={`/jobs/${job.id}`}>
                  <Button className="w-full">
                    Quick Apply <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
