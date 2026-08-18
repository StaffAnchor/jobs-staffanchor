"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Briefcase, CheckCircle2, IndianRupee, MapPin, Zap, ShieldCheck, PhoneCall, Clock } from "lucide-react";
import { logPriorityClick } from "@/lib/priority-click";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getOpenJob, listOpenJobs, logQuickApplyClick, categoryLabel, budgetLabel, experienceLabel, timeAgo, type JobListing } from "@/modules/jobs/api";
import ApplyForm from "@/modules/apply/ApplyForm";
import SignedInApplyCard from "@/modules/apply/SignedInApplyCard";
import EmailGate from "@/modules/apply/EmailGate";
import PriorityFloatingNudge from "@/components/priority/priority-floating-nudge";
import { supabase } from "@/lib/supabaseClient";
import { recordJobView } from "@/lib/recentlyViewed";

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
  // Recognize a persisted session the same way the navbar already does
  // (see components/layout/navbar.tsx) -- a signed-in candidate should never
  // hit the anonymous Apply form again, same as re-visiting Naukri while
  // still logged in drops you straight onto your own homepage instead of a
  // signup screen. `null` means "still checking", so we don't flash the
  // anonymous form for a split second before the session resolves.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  // Once a signed-in candidate is confirmed, resolved separately (and ahead
  // of SignedInApplyCard mounting) purely so the header/sidebar CTA can show
  // "Applied" immediately instead of only after they open the apply panel --
  // Naukri shows this the instant the page loads, not after an extra click.
  const [appliedAlready, setAppliedAlready] = useState(false);
  // Anonymous visitor only: set once EmailGate has confirmed this email has
  // no existing profile, so ApplyForm can mount pre-filled instead of asking
  // for the email a second time.
  const [gateEmail, setGateEmail] = useState<string | null>(null);
  const [similarJobs, setSimilarJobs] = useState<JobListing[]>([]);

  useEffect(() => {
    getOpenJob(mandateId)
      .then(setJob)
      .catch(() => setJob(null));
  }, [mandateId]);

  // Recently-viewed trail (localStorage) + a lightweight "Similar roles"
  // rail -- both computed client-side off the same open-listings RPC the
  // /jobs page already calls, so no new backend surface for either.
  useEffect(() => {
    if (!job) return;
    recordJobView({
      id: job.id,
      role_title: job.role_title,
      client_display: job.client_display,
      city: job.city,
    });
    listOpenJobs()
      .then((all) => {
        const matches = all
          .filter((j) => j.id !== job.id && j.category === job.category)
          .sort((a, b) => {
            const aSub = a.sub_domains?.length ? a.sub_domains : a.sub_domain ? [a.sub_domain] : [];
            const bSub = b.sub_domains?.length ? b.sub_domains : b.sub_domain ? [b.sub_domain] : [];
            const jobSub = job.sub_domains?.length ? job.sub_domains : job.sub_domain ? [job.sub_domain] : [];
            const aOverlap = aSub.filter((s) => jobSub.includes(s)).length;
            const bOverlap = bSub.filter((s) => jobSub.includes(s)).length;
            return bOverlap - aOverlap;
          })
          .slice(0, 3);
        setSimilarJobs(matches);
      })
      .catch(() => {
        // non-critical
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id]);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setSignedIn(!!data.user);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(!!session?.user);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: candidateId } = await supabase.rpc("get_or_create_my_candidate_profile");
        if (!candidateId) return;
        const { data: candidate } = await supabase.from("candidates").select("email").eq("id", candidateId).single();
        if (cancelled || !candidate?.email) return;
        const res = await fetch("/api/candidate-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: candidate.email, mandateId }),
        });
        const json = await res.json().catch(() => ({}));
        if (!cancelled) setAppliedAlready(!!json.alreadyApplied);
      } catch {
        // best-effort only -- SignedInApplyCard's own check is authoritative
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, mandateId]);

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

      <div
        className="mb-6 overflow-hidden rounded-2xl p-6 text-white shadow-lg shadow-slate-900/20 sm:p-8"
        style={{ backgroundImage: "linear-gradient(135deg, #12131A 0%, #3730B3 55%, #4F46E5 100%)" }}
      >
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
        {signedIn && appliedAlready ? (
          <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md">
            <CheckCircle2 className="h-4 w-4" /> Applied
          </span>
        ) : (
          <a
            href="#apply-form"
            onClick={() => logQuickApplyClick(mandateId)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-indigo-800 shadow-md transition hover:bg-indigo-50"
          >
            <Zap className="h-4 w-4" /> Apply
          </a>
        )}
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
                      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-indigo-700">
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
            {signedIn && appliedAlready ? (
              <span className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md">
                <CheckCircle2 className="h-4 w-4" /> Applied
              </span>
            ) : (
              <a
                href="#apply-form"
                onClick={() => logQuickApplyClick(mandateId)}
                className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-[#4F46E5] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#3730B3]"
              >
                <Zap className="h-4 w-4" /> Apply
              </a>
            )}
          </div>

          {/* Proof box -- addresses the skepticism a candidate has right at
              the moment of applying ("is this recruiter for real, will
              anyone actually get back to me"), instead of only making that
              case on the marketing site where a job-seeker rarely lands
              first. */}
          <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Why apply through us</p>
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
              <p className="text-[12px] leading-5 text-slate-600">
                Every profile is verified on a real call before it reaches an employer — not just a resume in a pile.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <PhoneCall className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
              <p className="text-[12px] leading-5 text-slate-600">
                A StaffAnchor recruiter reviews your application personally — no automated rejection emails.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
              <p className="text-[12px] leading-5 text-slate-600">
                We respond to every application within 1 business day, matched or not.
              </p>
            </div>
          </div>

          {/* Teaser for Priority Applicant -- plants the idea before the
              candidate applies, without competing with the main Apply CTA
              above. Deliberately louder than the flat proof-box list right
              above it (bigger icon badge, a real price pill, a distinct
              CTA chip) since a plain tinted strip reads as just more fine
              print next to that list -- this needs to look like an offer,
              not a disclaimer. Full explainer + purchase lives on the
              dedicated page every placement links to. */}
          <Link
            href={`/priority-applicant?mandateId=${mandateId}`}
            onClick={() => logPriorityClick("job_teaser", { mandateId })}
            className="group relative mt-4 block overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-fuchsia-600 p-4 shadow-md shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/40"
          >
            <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/15 blur-xl" />
            <div className="pointer-events-none absolute -bottom-8 left-10 h-16 w-16 rounded-full bg-white/10 blur-lg" />
            <div className="relative flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Zap className="h-5 w-5 text-white" fill="currentColor" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-white">Want to be seen first?</p>
                <p className="text-[11.5px] text-white/85">Get flagged for the recruiter&apos;s first review pass</p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11.5px] font-bold text-indigo-700 shadow-sm transition-transform group-hover:scale-105">
                From ₹79
              </span>
            </div>
          </Link>
        </div>
      </div>

      {similarJobs.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Similar roles</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {similarJobs.map((sj) => {
              const sjCities = sj.cities?.length ? sj.cities : sj.city ? [sj.city] : [];
              return (
                <Link
                  key={sj.id}
                  href={`/jobs/${sj.id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
                >
                  <p className="truncate text-[13.5px] font-semibold text-slate-900 group-hover:text-indigo-700">
                    {sj.role_title ?? "Open Role"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {sj.client_display ?? categoryLabel(sj.category)}
                    {sjCities.length ? ` · ${sjCities.join(", ")}` : ""}
                  </p>
                  <p className="mt-1.5 text-[11px] font-medium text-slate-400">{timeAgo(sj.created_at)}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* Quick Apply intentionally breaks out of the max-w-6xl wrapper above --
        ApplyForm's own internal 3-column grid wants ~1280px and was getting
        cramped inside the narrower page container (feedback: "this middle
        part... is very narrow"). Its own max-w keeps it from ever looking
        too wide on huge screens. */}
    <div className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6 lg:px-8">
      <Card id="apply-form" className="mt-6 scroll-mt-24">
        <CardContent className="p-5 sm:p-6">
          {signedIn === null ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : signedIn ? (
            <SignedInApplyCard mandateId={mandateId} mandateTitle={job.role_title ?? undefined} />
          ) : gateEmail === null ? (
            <EmailGate mandateId={mandateId} mandateTitle={job.role_title ?? undefined} onNewCandidate={setGateEmail} />
          ) : (
            <ApplyForm
              source="quick_apply"
              mandateId={mandateId}
              mandateTitle={job.role_title ?? undefined}
              initialEmail={gateEmail}
            />
          )}
        </CardContent>
      </Card>
    </div>

    {/* Same offer as the sidebar teaser above, but the sidebar scrolls out
        of view long before the candidate reaches the apply form below --
        exactly the stretch where they're spending the most time on the
        page (typing an email, filling multi-step fields) and the sidebar
        pitch has already disappeared. Fixed positioning keeps it on
        screen through that whole stretch instead. */}
    <PriorityFloatingNudge mandateId={mandateId} />
    </>
  );
}
