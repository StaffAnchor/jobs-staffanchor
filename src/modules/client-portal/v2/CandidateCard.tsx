"use client";

import { MapPin } from "lucide-react";
import type { BoardCandidate, FeedbackValue, Role } from "./types";
import { computeFit, closedReason, columnOf } from "./fit";
import { Chip, FitRing, initials, lakhLabel } from "./ui";
import FeedbackBar from "./FeedbackBar";

function firstSentence(s: string | null) {
  if (!s) return null;
  const m = s.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : s).trim();
}

export default function CandidateCard({
  role,
  c,
  onOpen,
  onFeedback,
}: {
  role: Role;
  c: BoardCandidate;
  onOpen: () => void;
  onFeedback: (linkId: string, value: FeedbackValue, interviewAt?: string) => Promise<void>;
}) {
  const fit = computeFit(role, c);
  const col = columnOf(c);
  const ctc = lakhLabel(c.expected_fixed_ctc);
  const notice = c.notice_period;
  const summary = firstSentence(c.ai_summary);

  return (
    <div className="min-w-0 rounded-2xl border border-[#ece7de] bg-white p-4 shadow-[0_1px_2px_rgba(60,40,20,0.04)] transition-shadow hover:shadow-[0_6px_20px_rgba(60,40,20,0.08)]">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f1e9dc] text-[13px] font-semibold text-[#7a5b34]">{initials(c.full_name)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14.5px] font-semibold text-slate-900">{c.full_name}</p>
            <p className="truncate text-[12.5px] text-slate-500">
              {c.current_job_title ?? "—"}
              {c.current_employer ? ` · ${c.current_employer}` : ""}
            </p>
          </div>
          <FitRing fit={fit} size={46} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.recommendation === "Strong Fit" && <Chip tone="good">Recommended</Chip>}
          {col === "closed" && <Chip tone={closedReason(c) === "hired" ? "good" : "neutral"}>{closedReason(c) === "hired" ? "Hired" : closedReason(c) === "withdrawn" ? "Withdrawn" : "Passed"}</Chip>}
          {c.total_experience_years !== null && c.total_experience_years !== "" && <Chip>{Number(c.total_experience_years)} yrs</Chip>}
          {ctc && <Chip>{ctc} expected</Chip>}
          {notice && <Chip>{notice}</Chip>}
        </div>

        {c.current_location && (
          <p className="mt-2 flex items-center gap-1 text-[12px] text-slate-500">
            <MapPin className="h-3 w-3" /> {c.current_location}
          </p>
        )}
        {summary && <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-slate-600">{summary}</p>}
      </button>

      {col !== "closed" && (
        <div className="mt-3 border-t border-[#f1ece3] pt-3">
          <FeedbackBar candidate={c} onFeedback={onFeedback} compact onOpenProfile={onOpen} />
        </div>
      )}
    </div>
  );
}
