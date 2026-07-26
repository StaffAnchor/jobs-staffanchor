"use client";

import { Check } from "lucide-react";

// Shared stage vocabulary with MyPipeline.tsx -- deliberately the same
// STAGE_ORDER/labels so a candidate sees the identical status language in
// both places (right after applying, and later on their pipeline tab).
const STAGE_ORDER = ["sourced", "screened", "shortlisted", "submitted", "client_interview", "offer", "placed"];

// Collapsed to the handful of steps a candidate actually cares about --
// "sourced"/"screened" are internal-only and both fold into "Applied".
const STEPS: { key: string; label: string }[] = [
  { key: "sourced", label: "Applied" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "submitted", label: "Submitted to client" },
  { key: "client_interview", label: "Interview" },
  { key: "offer", label: "Decision" },
];

function stepIndexForStage(stage: string | null | undefined): number {
  if (!stage) return 0;
  if (stage === "screened") return 0; // folds into "Applied"
  if (stage === "placed") return STEPS.length - 1;
  const idx = STEPS.findIndex((s) => s.key === stage);
  return idx >= 0 ? idx : 0;
}

// A visual stepper replacing a flat "Applied ✓" badge, so a candidate has
// some sense of where their application actually stands instead of total
// silence between "applied" and "a recruiter calls." Real stage-driven,
// not decorative -- pass the actual `stage` value from get_my_pipeline /
// candidate_mandate_links when known; defaults to step 0 ("Applied") right
// after a fresh submission.
export default function ApplicationTimeline({
  stage,
  rejected,
}: {
  stage?: string | null;
  rejected?: boolean;
}) {
  const activeIdx = stepIndexForStage(stage);

  return (
    <div className="mx-auto mt-6 max-w-md">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i < activeIdx || (i === activeIdx && !rejected && stage === "placed");
          const isActive = i === activeIdx && !done;
          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    rejected && i === activeIdx
                      ? "bg-red-100 text-red-600"
                      : done
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-blue-600 text-white ring-4 ring-blue-100"
                          : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                <p
                  className={`mt-1.5 w-16 text-center text-[10px] leading-tight ${
                    i <= activeIdx ? "font-medium text-slate-700" : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`-mt-4 h-0.5 flex-1 ${i < activeIdx ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>
      {rejected && (
        <p className="mt-4 text-center text-xs text-slate-500">
          This one didn&apos;t move forward — your profile stays active for every other matching role.
        </p>
      )}
    </div>
  );
}

export { STAGE_ORDER };
