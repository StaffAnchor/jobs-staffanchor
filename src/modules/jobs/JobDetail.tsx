"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, Check, CheckCircle2, FileText, IndianRupee, ListChecks, MapPin, UserCheck, Wallet, Zap, ShieldCheck, PhoneCall, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getOpenJob, listOpenJobs, logQuickApplyClick, categoryLabel, budgetLabel, experienceLabel, timeAgo, type JobListing } from "@/modules/jobs/api";
import CandidateIntakeForm from "@/modules/apply/CandidateIntakeForm";
import SignedInApplyCard from "@/modules/apply/SignedInApplyCard";
import WhatsAppChatButton from "@/components/WhatsAppChatButton";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import EmailGate from "@/modules/apply/EmailGate";
import JobMatchBanner from "@/modules/jobs/JobMatchBanner";
import { supabase } from "@/lib/supabaseClient";
import { recordJobView } from "@/lib/recentlyViewed";
import QuickInterest from "@/modules/jobs/QuickInterest";
import WhyPrice from "@/components/paid-call/why-price";
import { COPY, PAID_CALL_RUPEES } from "@/lib/paid-call";

const MONOGRAM_GRADIENT: Record<string, string> = {
  b2b_sales: "from-blue-500 to-indigo-600",
  b2c_sales: "from-violet-500 to-fuchsia-600",
  non_sales: "from-slate-500 to-slate-700",
};

function initials(title: string | null) {
  const words = (title ?? "Sales").split(/\s+/).filter(Boolean);
  return ((words[0]?.[0] ?? "S") + (words[1]?.[0] ?? "")).toUpperCase();
}

const HIRING_STEPS = [
  ["Apply", "One click if your profile is ready"],
  ["Recruiter review", "A recruiter reads your profile"],
  ["Shared with client", "If you fit, your profile goes to them"],
  ["Interviews", "We help you prepare"],
  ["Offer", "We support you through it"],
] as const;

function Section({ icon: Icon, tone, title, children }: { icon: typeof FileText; tone: string; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <h2 className="mb-4 flex items-center gap-3 text-lg font-extrabold tracking-tight text-slate-950">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ lines }: { lines: string[] }) {
  return (
    <ul className="space-y-2.5">
      {lines.map((line, i) => (
        <li key={i} className="flex items-start gap-3 text-[14.5px] leading-6 text-slate-700">
          <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <Check className="h-3 w-3" />
          </span>
          {line}
        </li>
      ))}
    </ul>
  );
}

function bulletList(value: string) {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export default function JobDetail({ mandateId }: { mandateId: string }) {

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
  const [paidOpen, setPaidOpen] = useState(false);

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

  const exp = experienceLabel(job.experience_min, job.experience_max);

  return (
    <>
    {/* ───────── Hero ───────── */}
    <section className="relative overflow-hidden bg-[#0A1630] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_80%_at_90%_0%,rgba(76,123,255,0.32),transparent_60%),radial-gradient(40%_60%_at_0%_100%,rgba(16,185,129,0.12),transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
        <Link href="/jobs" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-blue-200 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> All open roles
        </Link>
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <span
            className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br text-2xl font-extrabold text-white shadow-xl shadow-black/30 ${
              MONOGRAM_GRADIENT[job.category ?? ""] ?? MONOGRAM_GRADIENT.non_sales
            }`}
          >
            {initials(job.role_title)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-200">
              {categoryLabel(job.category)}
              {jobSubDomains.length ? ` · ${jobSubDomains.slice(0, 3).join(", ")}` : ""}
            </p>
            <h1 className="mt-2 font-(family-name:--font-space-grotesk) text-3xl font-black leading-tight tracking-tight md:text-5xl">
              {job.role_title ?? "Sales Role"}
            </h1>
            {job.client_display && <p className="mt-2 text-base text-blue-100/90">{job.client_display}</p>}
            {job.listing_kind === "pipeline" && (
              <p className="mt-3 max-w-xl rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-6 text-blue-50">
                <span className="font-bold">Pipeline role.</span> We are building a shortlist for companies hiring in this space. Apply and a
                recruiter will contact you when a matching role opens.
              </p>
            )}
          </div>
          {signedIn && appliedAlready && (
            <div className="shrink-0">
              <span className="inline-flex h-12 items-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-bold text-white shadow-lg">
                <CheckCircle2 className="h-4 w-4" /> Applied
              </span>
            </div>
          )}
        </div>
        <div className="mt-7 flex flex-wrap gap-2.5">
          {jobCities.length > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5" /> {jobCities.join(", ")}
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur-sm">
            {(job.budget_min || job.budget_max) && <IndianRupee className="h-3.5 w-3.5" />} {budgetLabel(job.budget_min, job.budget_max)}
          </span>
          {exp && (
            <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur-sm">{exp} experience</span>
          )}
          <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur-sm">{timeAgo(job.created_at)}</span>
        </div>
      </div>
    </section>

    <JobMatchBanner mandateId={mandateId} />

    <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 md:pb-10 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {hasStructuredJD ? (
            <>
              {job.jd_overview && (
                <Section icon={FileText} tone="bg-blue-50 text-blue-600" title="About the role">
                  <p className="text-[14.5px] leading-7 text-slate-600">{job.jd_overview}</p>
                </Section>
              )}
              {job.jd_responsibilities && (
                <Section icon={ListChecks} tone="bg-indigo-50 text-indigo-600" title="Key responsibilities">
                  <Bullets lines={bulletList(job.jd_responsibilities)} />
                </Section>
              )}
              {job.jd_candidate_profile && (
                <Section icon={UserCheck} tone="bg-violet-50 text-violet-600" title="Who they are looking for">
                  <Bullets lines={bulletList(job.jd_candidate_profile)} />
                </Section>
              )}
              {job.jd_compensation_benefits && (
                <Section icon={Wallet} tone="bg-emerald-50 text-emerald-600" title="Compensation and benefits">
                  <Bullets lines={bulletList(job.jd_compensation_benefits)} />
                </Section>
              )}
            </>
          ) : (
            <Section icon={FileText} tone="bg-blue-50 text-blue-600" title="About the role">
              {job.job_description ? (
                <p className="whitespace-pre-wrap text-[14.5px] leading-7 text-slate-600">{job.job_description}</p>
              ) : (
                <p className="text-sm text-slate-400">No job description yet. A recruiter will share full details.</p>
              )}
            </Section>
          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-950">How hiring works</h2>
            <p className="mt-1 text-sm text-slate-500">We update you at every step, and you can follow it in your account.</p>
            <ol className="mt-6 grid gap-5 sm:grid-cols-5">
              {HIRING_STEPS.map(([title, text], i) => (
                <li key={title}>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold ${i === 0 ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"}`}>
                    {i + 1}
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {signedIn && appliedAlready ? (
              <span className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-sm font-bold text-white">
                <CheckCircle2 className="h-4 w-4" /> Applied
              </span>
            ) : (
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">How would you like to apply?</p>
                <a
                  href="#apply-form"
                  onClick={() => logQuickApplyClick(mandateId)}
                  className="group/free flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-3.5 text-left text-white shadow-lg shadow-emerald-600/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-600/35"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold leading-tight">{COPY.freeTitle}</span>
                    <span className="block text-[12.5px] font-medium text-emerald-50">{COPY.freeLine}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition group-hover/free:translate-x-0.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setPaidOpen(true)}
                  className="group/paid flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-3.5 text-left text-white shadow-lg shadow-blue-600/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
                    <Zap className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 whitespace-nowrap"><span className="text-[14.5px] font-extrabold leading-tight">{COPY.paidCardTitle}</span><span className="shrink-0 rounded-full bg-white/25 px-1.5 py-0.5 text-[12px] font-extrabold">{COPY.paidPrice}</span></span>
                    <span className="block text-[12.5px] font-medium text-blue-100">{COPY.paidLine}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 transition group-hover/paid:translate-x-0.5" />
                </button>
                <p className="text-center text-[11.5px] leading-4 text-slate-500">{COPY.refundLine}</p>
                <WhyPrice />
              </div>
            )}
            <WhatsAppChatButton
              source="job_page"
              variant="outline"
              label="Ask about this role on WhatsApp"
              className="mt-3 w-full"
              text={`Hi StaffAnchor, I'm interested in the ${job.role_title ?? "Sales"} role${jobCities.length ? ` in ${jobCities.join(", ")}` : ""}. Could you tell me more?`}
            />
          </div>

          {/* Addresses the skepticism a candidate has right at the moment of
              applying ("is this recruiter for real, will anyone get back to me"). */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Why apply through us</p>
            {[
              [ShieldCheck, "Every profile is verified on a real call before it reaches an employer, not just a resume in a pile."],
              [PhoneCall, "A StaffAnchor recruiter reviews your application personally. No automated rejection emails."],
              [Clock, "We respond to every application within 1 business day, matched or not."],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof ShieldCheck;
              return (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <I className="h-4 w-4" />
                  </span>
                  <p className="text-[13px] leading-5 text-slate-600">{text as string}</p>
                </div>
              );
            })}
          </div>

        </aside>
      </div>

      {similarJobs.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-extrabold tracking-tight text-slate-950">Similar roles</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {similarJobs.map((sj) => {
              const sjCities = sj.cities?.length ? sj.cities : sj.city ? [sj.city] : [];
              return (
                <Link
                  key={sj.id}
                  href={`/jobs/${sj.id}`}
                  className="group min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                >
                  <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-extrabold text-white ${MONOGRAM_GRADIENT[sj.category ?? ""] ?? MONOGRAM_GRADIENT.non_sales}`}>
                    {initials(sj.role_title)}
                  </span>
                  <p className="mt-4 truncate text-[15px] font-extrabold text-slate-900 group-hover:text-blue-700">{sj.role_title ?? "Open Role"}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {sj.client_display ?? categoryLabel(sj.category)}
                    {sjCities.length ? ` · ${sjCities.join(", ")}` : ""}
                  </p>
                  <p className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-400">
                    {timeAgo(sj.created_at)}
                    <span className="flex items-center gap-1 font-bold text-blue-600">
                      View <ArrowRight className="h-3 w-3" />
                    </span>
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* The apply area breaks out of the narrower wrapper above: the long
        profile form wants width, and its own max-w keeps it from ever looking
        too wide on huge screens. */}
    <div className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 md:pb-10 lg:px-8">
      <div id="apply-form" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {signedIn !== null && !(signedIn && appliedAlready) && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                <PhoneCall className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[15px] font-extrabold text-slate-900">Don&apos;t want to wait? Get a guaranteed call.</p>
                <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{COPY.paidLine} {COPY.refundLine}</p>
                <WhyPrice className="mt-1 text-left [&_summary]:text-left [&_p]:text-left" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPaidOpen(true)}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-500"
            >
              Book recruiter call · ₹{PAID_CALL_RUPEES}
            </button>
          </div>
        )}
        {signedIn === null ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : signedIn ? (
          <SignedInApplyCard mandateId={mandateId} mandateTitle={job.role_title ?? undefined} />
        ) : gateEmail === null ? (
          <EmailGate mandateId={mandateId} mandateTitle={job.role_title ?? undefined} onNewCandidate={setGateEmail} />
        ) : (
          <CandidateIntakeForm mandateId={mandateId} mandateTitle={job.role_title ?? undefined} email={gateEmail} />
        )}
      </div>
    </div>

    {paidOpen && (
      <QuickInterest paid jobId={mandateId} roleTitle={job.role_title ?? "Open role"} client={job.client_display ?? null} onClose={() => setPaidOpen(false)} />
    )}

    {/* Always-visible WhatsApp button; lifted above the phone apply bar. */}
    <FloatingWhatsApp
      source="job_page_floating"
      bottomClass={!(signedIn && appliedAlready) ? "bottom-24 md:bottom-6" : "bottom-6"}
      text={`Hi StaffAnchor, I'm interested in the ${job.role_title ?? "Sales"} role${jobCities.length ? ` in ${jobCities.join(", ")}` : ""}. Could you tell me more?`}
    />

    {/* Phone: the apply action stays within thumb reach while reading. */}
    {!(signedIn && appliedAlready) && (
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-3 pb-4 pt-3 backdrop-blur md:hidden">
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href="#apply-form"
            onClick={() => logQuickApplyClick(mandateId)}
            className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/25"
          >
            {COPY.listFree}
          </a>
          <button
            type="button"
            onClick={() => setPaidOpen(true)}
            className="flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-extrabold text-white shadow-lg shadow-blue-600/30"
          >
            {COPY.listPaid}
          </button>
        </div>
      </div>
    )}

    </>
  );
}
