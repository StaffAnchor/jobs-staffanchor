import type { BoardCandidate } from "./types";
import { closedReason, columnOf } from "./fit";

// The tabs a client sorts the list by. "Interested" is the client's own decision (and not the recruiter's shortlist), so the word
// matches the button they press on a card.
export type Tab = "review" | "interested" | "interview" | "passed" | "hired" | "all";
export const TABS: { key: Tab; label: string; empty: string }[] = [
  { key: "review", label: "To review", empty: "You are all caught up. New candidates appear here as soon as your recruiter shares them." },
  { key: "interested", label: "Interested", empty: "No one here yet. Press Interested on a candidate you would like to know more about." },
  { key: "interview", label: "Interviews", empty: "No interviews yet. Press Interview on a candidate and your recruiter will schedule it." },
  { key: "passed", label: "Passed", empty: "You have not passed on anyone." },
  { key: "hired", label: "Hired", empty: "No one hired yet." },
  { key: "all", label: "Overview", empty: "No candidates yet." },
];
export const tabOf = (c: BoardCandidate): Exclude<Tab, "all"> => {
  const col = columnOf(c);
  if (col === "closed") return closedReason(c) === "hired" ? "hired" : "passed";
  return col;
};
export const STATUS_LABEL = (c: BoardCandidate) => {
  const col = columnOf(c);
  if (col === "closed") {
    const r = closedReason(c);
    return r === "hired" ? "Hired" : r === "withdrawn" ? "Withdrawn" : "Passed";
  }
  return col === "review" ? "To review" : col === "interested" ? "Interested" : "Interview";
};
export const isNew = (c: BoardCandidate) => columnOf(c) === "review" && !!c.shortlisted_at && Date.now() - new Date(c.shortlisted_at).getTime() < 3 * 86_400_000;


// The colour each tab wears, so the open tab is unmistakable: the underline, the count and the banner under the bar all use it.
export const TAB_LOOK: Record<Tab, { dot: string; ink: string; soft: string; line: string; title: string }> = {
  review: { dot: "bg-[#e8896a]", ink: "text-[#c2553a]", soft: "bg-[#fdf1ec]", line: "border-[#e8896a]", title: "Waiting for your decision" },
  interested: { dot: "bg-emerald-500", ink: "text-emerald-700", soft: "bg-emerald-50", line: "border-emerald-500", title: "People you want to know more about" },
  interview: { dot: "bg-indigo-500", ink: "text-indigo-700", soft: "bg-indigo-50", line: "border-indigo-500", title: "Interviews in motion" },
  passed: { dot: "bg-rose-500", ink: "text-rose-700", soft: "bg-rose-50", line: "border-rose-500", title: "People you passed on" },
  hired: { dot: "bg-amber-500", ink: "text-amber-700", soft: "bg-amber-50", line: "border-amber-500", title: "Hired" },
  all: { dot: "bg-slate-700", ink: "text-slate-800", soft: "bg-[#f4efe6]", line: "border-slate-800", title: "The whole shortlist at a glance" },
};
