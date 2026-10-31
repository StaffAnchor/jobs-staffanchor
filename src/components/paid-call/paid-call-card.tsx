"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PhoneCall, ShieldCheck } from "lucide-react";
import { logPaidCallClick } from "@/modules/jobs/api";
import { usePaidCallCheckout } from "./use-paid-call-checkout";
import { COPY, PAID_CALL_RUPEES } from "@/lib/paid-call";
import WhyPrice from "./why-price";

// Shown right after a free application is in: turn it into a guaranteed recruiter call for ₹199. Paying converts this same
// application (it is not a second one), and the card disappears for anyone who has already paid.
export default function PaidCallCard({ candidateId, mandateId }: { candidateId: string; mandateId: string }) {
  const { pay, status, error } = usePaidCallCheckout();
  const [done, setDone] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/paid-call/status?candidateId=${candidateId}&mandateId=${mandateId}`)
      .then((r) => r.json())
      .then((d: { paid?: boolean }) => live && d.paid && setDone(true))
      .catch(() => {})
      .finally(() => live && setChecked(true));
    return () => {
      live = false;
    };
  }, [candidateId, mandateId]);

  if (!checked) return null;

  if (done) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 text-emerald-800">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">{COPY.donePaid}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 p-5 text-white shadow-lg shadow-teal-600/25">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
          <PhoneCall className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-extrabold leading-tight">{COPY.cardTitle}</p>
          <p className="mt-1 text-[13.5px] leading-5 text-teal-50">
            Get a profile discussion with a recruiter within 3 working days, whether or not this role is a match. It also helps with future roles.
          </p>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={async () => {
              logPaidCallClick(mandateId, "confirm");
              if (await pay({ candidateId, mandateId })) setDone(true);
            }}
            className="mt-3.5 inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-teal-700 shadow-sm transition hover:bg-teal-50 disabled:opacity-60"
          >
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />} {COPY.cardButton} · ₹{PAID_CALL_RUPEES}
          </button>
          <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-teal-50/90">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> No call within 3 working days? Full refund. A profile discussion, not a job guarantee.
          </p>
          {error && <p className="mt-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-[12.5px] font-medium text-red-600">{error}</p>}
          <WhyPrice className="mt-2 text-left [&_summary]:text-left [&_summary]:text-teal-50 [&_p]:text-left [&_p]:text-teal-50/90" />
        </div>
      </div>
    </div>
  );
}
