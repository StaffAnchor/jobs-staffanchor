"use client";

import { COPY } from "@/lib/paid-call";

// A small "Why ₹199?" that opens in place, so the reason for the fee is one tap away without crowding the buttons.
export default function WhyPrice({ className = "" }: { className?: string }) {
  return (
    <details className={`text-[11.5px] text-slate-500 ${className}`}>
      <summary className="cursor-pointer select-none text-center font-semibold text-slate-600 hover:text-slate-900">{COPY.whyLabel}</summary>
      <p className="mt-1 text-center leading-5">{COPY.whyLine}</p>
    </details>
  );
}
