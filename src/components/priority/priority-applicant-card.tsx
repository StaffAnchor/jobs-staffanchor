"use client";

import { useState } from "react";
import { Zap, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import PriorityPackPicker from "./priority-pack-picker";

// The retroactive-conversion surface: a candidate who just submitted an
// application (and may not even have a session yet -- their account is
// created server-side on submit) sees this right on the confirmation
// screen, where they're already primed by "boost your shortlisting odds."
// Expanding it and paying spends a credit directly on THIS application via
// mandateId, no separate "My Applications" trip required.
export default function PriorityApplicantCard({ candidateId, mandateId }: { candidateId: string; mandateId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-4 text-emerald-800">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">This application is now flagged Priority for the recruiter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm shadow-indigo-500/10">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="relative flex w-full items-center justify-between gap-3 overflow-hidden bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 text-left"
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
            <Zap className="h-4.5 w-4.5 animate-pulse" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Make this application Priority</p>
            <p className="text-xs text-white/80">Get flagged for the recruiter&apos;s first review pass — from ₹79.</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-white/80" /> : <ChevronDown className="h-4 w-4 shrink-0 text-white/80" />}
      </button>
      {expanded && (
        <div className="border border-t-0 border-indigo-100 bg-indigo-50/50 px-5 py-4">
          <PriorityPackPicker candidateId={candidateId} mandateId={mandateId} onPurchased={() => setDone(true)} compact />
        </div>
      )}
    </div>
  );
}
