"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutGrid, List, MapPin, Search } from "lucide-react";
import { toast } from "sonner";
import type { BoardCandidate, FeedbackValue, RoleBoard } from "./types";
import { columnOf, computeFit, type Column } from "./fit";
import { Chip, LABEL, lakhLabel } from "./ui";
import CandidateCard from "./CandidateCard";
import CandidateDrawer from "./CandidateDrawer";

const COLUMNS: { key: Column; title: string; hint: string; dot: string }[] = [
  { key: "review", title: "To review", hint: "Waiting for your decision", dot: "bg-[#e8896a]" },
  { key: "interested", title: "Interested", hint: "You want to know more", dot: "bg-emerald-500" },
  { key: "interview", title: "Interview", hint: "Being scheduled or scheduled", dot: "bg-indigo-500" },
  { key: "closed", title: "Closed", hint: "Hired or passed", dot: "bg-slate-400" },
];

const budget = (min: unknown, max: unknown) => {
  const a = lakhLabel(min as number | string | null);
  const b = lakhLabel(max as number | string | null);
  return a && b ? `${a} – ${b}` : b ? `Up to ${b}` : a ? `${a}+` : null;
};

export default function RoleBoardView({
  board,
  onFeedback,
  getResumeUrl,
  backHref,
  banner,
}: {
  board: RoleBoard;
  onFeedback: (linkId: string, value: FeedbackValue, interviewAt?: string) => Promise<void>;
  getResumeUrl?: (path: string) => Promise<string | null>;
  backHref: string;
  banner?: React.ReactNode;
}) {
  const { role } = board;
  const [cands, setCands] = useState<BoardCandidate[]>(board.candidates);
  const [view, setView] = useState<"board" | "list">("board");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  async function handleFeedback(linkId: string, value: FeedbackValue, at?: string) {
    const prev = cands;
    setCands((list) =>
      list.map((c) =>
        c.link_id !== linkId
          ? c
          : {
              ...c,
              client_feedback: value,
              stage: value === "interview_requested" ? "client_interview" : c.stage,
              requested_interview_at: value === "interview_requested" ? at ?? c.requested_interview_at : c.requested_interview_at,
            }
      )
    );
    try {
      await onFeedback(linkId, value, at);
      toast.success(value === "interview_requested" ? "Interview request sent to your recruiter." : value === "interested" ? "Marked as interested." : "Marked as passed.");
    } catch (e) {
      setCands(prev);
      throw e;
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = cands.filter(
      (c) => !q || c.full_name.toLowerCase().includes(q) || (c.current_job_title ?? "").toLowerCase().includes(q) || (c.current_employer ?? "").toLowerCase().includes(q)
    );
    return list
      .map((c) => ({ c, fit: computeFit(role, c) }))
      .sort((a, b) => (b.fit.pct ?? -1) - (a.fit.pct ?? -1))
      .map((x) => x.c);
  }, [cands, query, role]);

  const byCol = (col: Column) => visible.filter((c) => columnOf(c) === col);
  const counts = {
    review: cands.filter((c) => columnOf(c) === "review").length,
    interested: cands.filter((c) => columnOf(c) === "interested").length,
    interview: cands.filter((c) => columnOf(c) === "interview").length,
    hired: cands.filter((c) => c.stage === "placed").length,
  };
  const ctcValues = cands.map((c) => Number(c.expected_fixed_ctc)).filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  const median = ctcValues.length ? (ctcValues.length % 2 ? ctcValues[(ctcValues.length - 1) / 2] : (ctcValues[ctcValues.length / 2 - 1] + ctcValues[ctcValues.length / 2]) / 2) : null;
  const opened = cands.find((c) => c.link_id === openId) ?? null;

  const facts = [
    role.sub_domain && role.sub_domain,
    (role.cities?.length ? role.cities.join(", ") : role.city) && (
      <span key="c" className="inline-flex items-center gap-1">
        <MapPin className="h-3 w-3" />
        {role.cities?.length ? role.cities.join(", ") : role.city}
      </span>
    ),
    role.experience_min !== null || role.experience_max !== null ? `${role.experience_min ?? 0}–${role.experience_max ?? "+"} yrs` : null,
    budget(role.budget_min, role.budget_max),
    role.work_mode,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      {banner}
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> All your roles
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={LABEL}>Shortlist</p>
          <h1 className="mt-1 text-[26px] font-semibold tracking-tight text-slate-900">{role.role_title}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-slate-500">
            {facts.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {f}
              </span>
            ))}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-2xl border border-[#ece7de] bg-white px-4 py-2.5">
            <p className={LABEL}>To review</p>
            <p className="font-mono text-[22px] font-semibold text-[#d9694a]">{counts.review}</p>
          </div>
          <div className="rounded-2xl border border-[#ece7de] bg-white px-4 py-2.5">
            <p className={LABEL}>Interested</p>
            <p className="font-mono text-[22px] font-semibold text-slate-900">{counts.interested}</p>
          </div>
          <div className="rounded-2xl border border-[#ece7de] bg-white px-4 py-2.5">
            <p className={LABEL}>Interviews</p>
            <p className="font-mono text-[22px] font-semibold text-slate-900">{counts.interview}</p>
          </div>
          {median !== null && (
            <div className="rounded-2xl border border-[#ece7de] bg-white px-4 py-2.5">
              <p className={LABEL}>Median expected</p>
              <p className="font-mono text-[22px] font-semibold text-slate-900">{lakhLabel(median)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, title or company"
            className="w-full rounded-xl border border-[#e3ddd1] bg-white py-2 pl-9 pr-3 text-[13px] outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <div className="inline-flex rounded-xl border border-[#e3ddd1] bg-white p-0.5">
          {(["board", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12.5px] font-medium ${view === v ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-[#f4efe6]"}`}
            >
              {v === "board" ? <LayoutGrid className="h-3.5 w-3.5" /> : <List className="h-3.5 w-3.5" />}
              {v === "board" ? "Board" : "List"}
            </button>
          ))}
        </div>
      </div>

      {cands.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#d9d2c4] bg-white/60 px-6 py-16 text-center">
          <p className="text-[15px] font-medium text-slate-800">No candidates shortlisted yet</p>
          <p className="mt-1 text-[13px] text-slate-500">Your recruiter adds people here as soon as they have spoken to them. You will see why each one fits before you decide.</p>
        </div>
      ) : view === "board" ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((col) => {
            const items = byCol(col.key);
            return (
              <div key={col.key} className="min-w-0 rounded-2xl bg-[#f3eee4]/70 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <h2 className="text-[13px] font-semibold text-slate-800">{col.title}</h2>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[11px] text-slate-500">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? (
                    <p className="px-2 py-6 text-center text-[12px] text-slate-400">{col.hint}</p>
                  ) : (
                    items.map((c) => <CandidateCard key={c.link_id} role={role} c={c} onOpen={() => setOpenId(c.link_id)} onFeedback={handleFeedback} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto mt-5 max-w-3xl space-y-3">
          {visible.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-slate-500">No one matches that search.</p>
          ) : (
            visible.map((c) => (
              <div key={c.link_id}>
                <div className="mb-1.5 ml-1">
                  <Chip tone="info">{COLUMNS.find((x) => x.key === columnOf(c))?.title}</Chip>
                </div>
                <CandidateCard role={role} c={c} onOpen={() => setOpenId(c.link_id)} onFeedback={handleFeedback} />
              </div>
            ))
          )}
        </div>
      )}

      {opened && <CandidateDrawer role={role} c={opened} onClose={() => setOpenId(null)} onFeedback={handleFeedback} getResumeUrl={getResumeUrl} />}
    </div>
  );
}
