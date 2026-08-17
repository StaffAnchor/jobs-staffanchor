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
    <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-indigo-50/50">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
            <Zap className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Make this application Priority</p>
            <p className="text-xs text-slate-500">Get flagged for the recruiter&apos;s first review pass — from ₹79.</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {expanded && (
        <div className="border-t border-indigo-100 px-5 py-4">
          <PriorityPackPicker candidateId={candidateId} mandateId={mandateId} onPurchased={() => setDone(true)} compact />
        </div>
      )}
    </div>
  );
}
