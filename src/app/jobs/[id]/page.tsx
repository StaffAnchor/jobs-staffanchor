"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, IndianRupee, MapPin, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getOpenJob, logQuickApplyClick, categoryLabel, budgetLabel, experienceLabel, type JobListing } from "@/modules/jobs/api";
import ApplyForm from "@/modules/apply/ApplyForm";

function bulletList(value: string) {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function QuickApplyPage() {
  const params = useParams<{ id: string }>();
  const mandateId = params.id;

  const [job, setJob] = useState<JobListing | null | undefined>(undefined);

  useEffect(() => {
    getOpenJob(mandateId)
      .then(setJob)
      .catch(() => setJob(null));
  }, [mandateId]);

  if (job === undefined) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <Briefcase className="mx-auto mb-3 h-6 w-6 text-slate-300" />
        <h1 className="text-lg font-semibold text-slate-900">This role isn&apos;t accepting applications</h1>
        <p className="mt-1 text-sm text-slate-500">It may have been filled or closed.</p>
        <Link href="/jobs" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to open roles
          </Button>
        </Link>
      </div>
    );
  }

  const hasStructuredJD = !!(
    job.jd_overview || job.jd_responsibilities || job.jd_candidate_profile || job.jd_compensation_benefits
  );

  const jobCities = job.cities?.length ? job.cities : job.city ? [job.city] : [];
  const jobSubDomains = job.sub_domains?.length ? job.sub_domains : job.sub_domain ? [job.sub_domain] : [];

  return (
    <>
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
      <Link href="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to open roles
      </Link>

      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-900/20 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
          {categoryLabel(job.category)}
          {jobSubDomains.length ? ` · ${jobSubDomains.join(", ")}` : ""}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{job.role_title ?? "Sales Role"}</h1>
        {job.client_display && <p className="mt-1 text-sm font-medium text-white/90">{job.client_display}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {jobCities.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5" /> {jobCities.join(", ")}
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
            <IndianRupee className="h-3.5 w-3.5" /> {budgetLabel(job.budget_min, job.budget_max)}
          </span>
          {experienceLabel(job.experience_min, job.experience_max) && (
            <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
              {experienceLabel(job.experience_min, job.experience_max)} experience
            </span>
          )}
        </div>
        <a
          href="#apply-form"
          onClick={() => logQuickApplyClick(mandateId)}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-50"
        >
          <Zap className="h-4 w-4" /> Quick Apply
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5 sm:p-6">
              {hasStructuredJD ? (
                <div className="space-y-5">
                  {job.jd_overview && <p className="text-[14px] leading-6 text-slate-600">{job.jd_overview}</p>}
                  {job.jd_responsibilities && (
                    <div>
                      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-blue-700">
                        Key Responsibilities
                      </h2>
                      <ul className="list-disc space-y-1.5 pl-4 text-[13.5px] leading-6 text-slate-700">
                        {bulletList(job.jd_responsibilities).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.jd_candidate_profile && (
                    <div>
                      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-indigo-700">
                        Candidate Profile
                      </h2>
                      <ul className="list-disc space-y-1.5 pl-4 text-[13.5px] leading-6 text-slate-700">
                        {bulletList(job.jd_candidate_profile).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.jd_compensation_benefits && (
                    <div>
                      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-emerald-700">
                        Compensation &amp; Benefits
                      </h2>
                      <ul className="list-disc space-y-1.5 pl-4 text-[13.5px] leading-6 text-slate-700">
                        {bulletList(job.jd_compensation_benefits).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : job.job_description ? (
                <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-slate-600">{job.job_description}</p>
              ) : (
                <p className="text-sm text-slate-400">No job description yet — a recruiter will share full details.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">At a glance</p>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Experience</dt>
                <dd className="font-medium text-slate-800">{experienceLabel(job.experience_min, job.experience_max) ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Compensation</dt>
                <dd className="font-medium text-slate-800">{budgetLabel(job.budget_min, job.budget_max)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Location</dt>
                <dd className="font-medium text-slate-800">{jobCities.length ? jobCities.join(", ") : "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Function</dt>
                <dd className="font-medium text-slate-800">{categoryLabel(job.category)}</dd>
              </div>
            </dl>
            <a
              href="#apply-form"
              onClick={() => logQuickApplyClick(mandateId)}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              <Zap className="h-4 w-4" /> Quick Apply
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Quick Apply intentionally breaks out of the max-w-6xl wrapper above --
        ApplyForm's own internal 3-column grid wants ~1280px and was getting
        cramped inside the narrower page container (feedback: "this middle
        part... is very narrow"). Its own max-w keeps it from ever looking
        too wide on huge screens. */}
    <div className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6 lg:px-8">
      <Card id="apply-form" className="mt-6 scroll-mt-24">
        <CardContent className="p-5 sm:p-6">
          <ApplyForm source="quick_apply" mandateId={mandateId} mandateTitle={job.role_title ?? undefined} />
        </CardContent>
      </Card>
    </div>
    </>
  );
}
