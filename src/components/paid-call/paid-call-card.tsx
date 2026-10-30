"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, PhoneCall } from "lucide-react";
import { usePaidCallCheckout } from "./use-paid-call-checkout";
import { COPY, PAID_CALL_RUPEES } from "@/lib/paid-call";

// Shown right after an application is in: add a guaranteed recruiter call for ₹99. The free application stays as it is
// whether or not they pay.
export default function PaidCallCard({ candidateId, mandateId }: { candidateId: string; mandateId: string }) {
  const { pay, status, error } = usePaidCallCheckout();
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 text-emerald-800">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">{COPY.donePaid}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
          <PhoneCall className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900">Get a recruiter call · ₹{PAID_CALL_RUPEES}</p>
          <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{COPY.paidLine}</p>
          <p className="mt-1 text-[12px] text-slate-500">{COPY.refundLine}</p>
          <button
            type="button"
            disabled={status === "loading"}
            onClick={async () => {
              if (await pay({ candidateId, mandateId })) setDone(true);
            }}
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-500 disabled:opacity-60"
          >
            {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />} Pay ₹{PAID_CALL_RUPEES} and book the call
          </button>
          {error && <p className="mt-2 text-[12.5px] font-medium text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
