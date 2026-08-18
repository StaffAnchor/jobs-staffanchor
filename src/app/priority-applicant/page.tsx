"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Zap, CheckCircle2, ShieldCheck, Eye, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import PriorityPackPicker from "@/components/priority/priority-pack-picker";
import PriorityEmailGate from "@/components/priority/priority-email-gate";
import type { PurchaseResult } from "@/components/priority/use-priority-checkout";
import { logPriorityClick } from "@/lib/priority-click";

type JobListing = { role_title: string | null; client_display: string | null };

// Canonical explainer + purchase surface for Priority Applicant. Every
// promotional placement (job page, apply-flow upsell, confirmation card,
// portal tile) links here rather than repeating the pitch. Two entry
// shapes:
//  - ?candidateId=...&mandateId=... -- arrived from a context that already
//    knows the candidate (confirmation page, portal), buys/spends a credit
//    on that specific application, no login required.
//  - no params -- arrived cold (job page banner, direct link); resolves the
//    candidate from the current auth session, or prompts to log in / apply
//    first if there isn't one.
function PriorityApplicantContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const candidateIdParam = searchParams.get("candidateId");
  const mandateId = searchParams.get("mandateId");
  const returnTo = searchParams.get("returnTo");

  const [candidateId, setCandidateId] = useState<string | null>(candidateIdParam);
  const [resolving, setResolving] = useState(!candidateIdParam);
  const [result, setResult] = useState<PurchaseResult | null>(null);
  const [jobListing, setJobListing] = useState<JobListing | null>(null);

  // Funnel visibility: log that a candidate actually landed on the checkout
  // page itself (distinct from the upstream CTA click that got them here) --
  // lets Reports show how many people bounce between clicking a promo and
  // seeing the real pack picker/price.
  useEffect(() => {
    logPriorityClick("checkout_landed", {
      mandateId,
      candidateId: candidateIdParam,
      eventType: "checkout_started",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Best-effort -- lets both the pack-picker headline and the post-payment
  // confirmation name the actual job ("...for Chief Revenue Officer at
  // Acme") instead of a generic "credits added" message. Public RPC, no
  // auth needed, same one the job detail page itself uses.
  useEffect(() => {
    if (!mandateId) return;
    let cancelled = false;
    supabase
      .rpc("get_open_job_listing", { p_mandate_id: mandateId })
      .then(({ data }) => {
        if (cancelled) return;
        const row = Array.isArray(data) ? data[0] : data;
        if (row) setJobListing(row as JobListing);
      });
    return () => {
      cancelled = true;
    };
  }, [mandateId]);

  useEffect(() => {
    if (candidateIdParam) return;
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setResolving(false);
        return;
      }
      const { data } = await supabase.rpc("get_or_create_my_candidate_profile");
      if (!cancelled) {
        setCandidateId((data as string) ?? null);
        setResolving(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateIdParam]);

  function handlePurchased(r: PurchaseResult) {
    setResult(r);
  }

  if (resolving) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-bold text-slate-950">
          {result.autoAppliedToLinkId
            ? jobListing?.role_title
              ? `Your application for ${jobListing.role_title}${jobListing.client_display ? ` at ${jobListing.client_display}` : ""} is now Priority.`
              : "This application is now Priority."
            : "Credits added to your account."}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {result.autoAppliedToLinkId
            ? `1 credit consumed. You have ${result.remainingBalance} left for future applications.`
            : `You now have ${result.remainingBalance} priority credit${result.remainingBalance === 1 ? "" : "s"} to use on any application, now or later.`}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href={returnTo || "/jobs"}
            className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800"
          >
            {returnTo ? "Back to where you were" : "Browse Open Roles"}
          </Link>
          <Link
            href="/candidate-portal"
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 px-5 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Go to My Portal
          </Link>
        </div>
      </div>
    );
  }

  if (!candidateId) {
    // No profile on file yet -- this used to be a dead end ("go log in" /
    // "go build a full profile first"), which for a brand-new visitor meant
    // a multi-field form before they could even reach checkout. Payment is
    // the priority: one email field resolves to a candidateId in a single
    // round trip (see PriorityEmailGate for why that's schema-safe), then
    // it's the exact same pack picker as every other entry point.
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <PriorityEmailGate mandateId={mandateId} onReady={setCandidateId} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="mb-8 text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
          <Zap className="h-3.5 w-3.5" /> Priority Applicant
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {jobListing?.role_title
            ? `Flag your application for ${jobListing.role_title}${jobListing.client_display ? ` at ${jobListing.client_display}` : ""}`
            : "Get your application flagged for the recruiter's first pass"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Every application is reviewed either way. Priority Applicant flags yours so a recruiter sees it before the
          rest of the queue for that role — it doesn&apos;t guarantee an interview or outcome, it gets you seen
          sooner.
        </p>
      </div>

      <Card className="p-6">
        <PriorityPackPicker candidateId={candidateId} mandateId={mandateId} onPurchased={handlePurchased} />
      </Card>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-start gap-2.5">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p className="text-xs text-slate-600">Seen first in the recruiter&apos;s queue for that role.</p>
        </div>
        <div className="flex items-start gap-2.5">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p className="text-xs text-slate-600">Credits are valid for 90 days, use them whenever you apply.</p>
        </div>
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
          <p className="text-xs text-slate-600">Doesn&apos;t affect the recruiter&apos;s actual assessment of fit.</p>
        </div>
      </div>
    </div>
  );
}

export default function PriorityApplicantPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Spinner /></div>}>
      <PriorityApplicantContent />
    </Suspense>
  );
}
