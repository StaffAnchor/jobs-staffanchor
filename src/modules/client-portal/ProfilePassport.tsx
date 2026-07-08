"use client";

import { useState } from "react";
import { X, Sparkles, BadgeCheck } from "lucide-react";
import type { AiPassport } from "@/modules/client-portal/api";

export default function ProfilePassportTrigger({
  fullName,
  currentJobTitle,
  currentEmployer,
  currentLocation,
  totalExperienceYears,
  subDomain,
  expectedFixedCtc,
  verifiedRelocation,
  verifiedNotice,
  industries,
  aiSummary,
  aiPassport,
}: {
  fullName: string;
  currentJobTitle: string | null;
  currentEmployer: string | null;
  currentLocation: string | null;
  totalExperienceYears: number | null;
  subDomain: string | null;
  expectedFixedCtc: number | null;
  verifiedRelocation: string | null;
  verifiedNotice: string | null;
  industries: string[] | null;
  aiSummary: string | null;
  aiPassport: AiPassport | null;
}) {
  const [open, setOpen] = useState(false);

  if (!aiSummary && !aiPassport) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        <Sparkles className="h-3 w-3" /> View profile passport
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-8"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">Profile passport</p>
                <h2 className="text-lg font-semibold text-slate-900">{fullName}</h2>
                <p className="text-sm text-slate-500">
                  {currentJobTitle}
                  {currentEmployer ? ` at ${currentEmployer}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {currentLocation} · {totalExperienceYears ?? "—"} yrs experience
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              {aiPassport?.headline && <p className="text-sm text-slate-800">{aiPassport.headline}</p>}
              {!aiPassport?.headline && aiSummary && <p className="text-sm text-slate-800">{aiSummary}</p>}

              {aiPassport?.compensation_line && <p className="text-sm text-slate-600">{aiPassport.compensation_line}</p>}
              {aiPassport?.targets_line && <p className="text-sm text-slate-600">{aiPassport.targets_line}</p>}

              {aiPassport?.resume_highlights && aiPassport.resume_highlights.length > 0 && (
                <div>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Resume highlights
                  </p>
                  <ul className="space-y-1.5">
                    {aiPassport.resume_highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-2 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Sub-domain</p>
                  <p className="text-slate-700">{subDomain ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Expected fixed CTC</p>
                  <p className="text-slate-700">{expectedFixedCtc ? `₹${expectedFixedCtc}L` : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Relocation — verified</p>
                  <p className="text-slate-700">{verifiedRelocation ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Notice period — verified</p>
                  <p className="text-slate-700">{verifiedNotice ?? "—"}</p>
                </div>
              </div>

              {industries && industries.length > 0 && (
                <div>
                  <p className="mb-1 text-xs text-slate-400">Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {industries.map((i) => (
                      <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
