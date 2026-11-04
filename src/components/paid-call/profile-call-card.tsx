"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PhoneCall, ShieldCheck } from "lucide-react";
import { logPaidCallClick, logPaidCallView } from "@/modules/jobs/api";
import { usePaidCallCheckout } from "./use-paid-call-checkout";
import { COPY, PAID_CALL_RUPEES, PAID_CALL_WORKING_DAYS, PROFILE_CALL_MANDATE_ID } from "@/lib/paid-call";

// The ₹199 recruiter call for someone who has built a profile but is not applying to a role: a call about future roles. It is
// paid and tracked exactly like a call on a role, and hidden once the person has booked it.
export default function ProfileCallCard({ candidateId, spot = "profile" as const, className = "" }: { candidateId: string; spot?: "registered" | "portal_home" | "profile"; className?: string }) {
  const { pay, status, error } = usePaidCallCheckout();
  const [done, setDone] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/paid-call/status?candidateId=${candidateId}&kind=profile`)
      .then((r) => r.json())
      .then((d: { paid?: boolean }) => live && d.paid && setDone(true))
      .catch(() => {})
      .finally(() => live && setChecked(true));
    return () => {
      live = false;
    };
  }, [candidateId]);

  useEffect(() => {
    if (checked && !done) logPaidCallView(PROFILE_CALL_MANDATE_ID, spot);
  }, [checked, done, spot]);

  if (!checked) return null;
  if (done) {
    return (
      <div className={`flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 text-emerald-800 ${className}`}>
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">{COPY.profileDone}</p>
      </div>
    );
  }
  return (
    <section className={`rounded-2xl border border-teal-200 bg-teal-50/60 p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white"><PhoneCall className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-extrabold leading-tight text-slate-900">{COPY.profileTitle}</p>
          <p className="mt-1 text-[13.5px] leading-6 text-slate-600">{COPY.profileLine}</p>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={async () => {
              logPaidCallClick(PROFILE_CALL_MANDATE_ID, spot);
              if (await pay({ candidateId })) setDone(true);
            }}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
          >
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />} {COPY.cardButton} · ₹{PAID_CALL_RUPEES}
          </button>
          <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-slate-500">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-teal-600" /> No call within {PAID_CALL_WORKING_DAYS} working days? Full refund. A profile discussion, not a job guarantee.
          </p>
          {error && <p className="mt-2 rounded-lg bg-white px-2.5 py-1.5 text-[12.5px] font-medium text-red-600">{error}</p>}
        </div>
      </div>
    </section>
  );
}
