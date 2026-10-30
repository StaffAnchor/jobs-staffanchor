"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, CalendarClock, Check, ChevronDown, MapPin, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { usePaidCallCheckout } from "@/components/paid-call/use-paid-call-checkout";
import { PAID_CALL_RUPEES } from "@/lib/paid-call";
import {
  APPLICATION_STEPS,
  eventLabel,
  formatWhen,
  loadMyApplicationEvents,
  loadMyApplications,
  statusLabel,
  statusTone,
  stepIndexForStage,
  type ApplicationEvent,
  type ApplicationRow,
  type StatusTone,
} from "./applications";

const TONE_CLASSES: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/70",
  active: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/70",
  good: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70",
  warn: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70",
  bad: "bg-slate-100 text-slate-500 ring-1 ring-slate-200/70",
};

const CARD_CLASSES =
  "rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]";

// candidateId is threaded down from candidate-portal/page.tsx (already
// resolved there via get_or_create_my_candidate_profile) so this list can
// book the ₹99 recruiter call against a row without a second round trip
// just to find out who's logged in.
export default function MyPipeline({ candidateId }: { candidateId: string }) {
  const [rows, setRows] = useState<ApplicationRow[] | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const checkout = usePaidCallCheckout();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadMyApplications(), loadMyApplicationEvents()])
      .then(([apps, evts]) => {
        if (cancelled) return;
        setRows(apps);
        setEvents(evts);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const eventsByLink = useMemo(() => {
    const map = new Map<string, ApplicationEvent[]>();
    for (const e of events) {
      const list = map.get(e.link_id) ?? [];
      list.push(e);
      map.set(e.link_id, list);
    }
    return map;
  }, [events]);

  async function bookCall(linkId: string, mandateId: string) {
    setPayingId(linkId);
    const ok = await checkout.pay({ candidateId, mandateId });
    setPayingId(null);
    if (ok) setRows((prev) => (prev ? prev.map((r) => (r.link_id === linkId ? { ...r, call_paid_at: new Date().toISOString() } : r)) : prev));
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (rows === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-slate-100 bg-white/60 shadow-sm"
            style={{ animationDelay: `${i * 90}ms` }}
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card className={CARD_CLASSES}>
        <CardContent className="py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50">
            <Briefcase className="h-5.5 w-5.5 text-indigo-400" />
          </div>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500">
            No applications yet. Apply to a role, or wait for a recruiter to match you — every step will show up here, so
            you never have to wonder what happened.
          </p>
          <Link
            href="/jobs"
            className="mt-5 inline-flex h-10 items-center rounded-full bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Browse current openings
          </Link>
        </CardContent>
      </Card>
    );
  }

  const activeCount = rows.filter((r) => r.stage !== "rejected" && r.stage !== "placed" && r.stage !== "pulled_back").length;

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{activeCount} active</span> · {rows.length} in total. Every
          step, in plain words.
        </p>
      </div>

      {rows.map((r) => {
        const closed = r.stage === "rejected" || r.stage === "pulled_back";
        const activeIdx = stepIndexForStage(r.stage);
        const done = r.stage === "placed";
        const linkEvents = eventsByLink.get(r.link_id) ?? [];
        const open = openId === r.link_id;
        const interviewAt = r.confirmed_interview_at ? new Date(r.confirmed_interview_at) : null;
        const upcomingInterview = interviewAt && interviewAt.getTime() > Date.now() - 2 * 60 * 60 * 1000 ? interviewAt : null;
        return (
          <Card key={r.link_id} className={CARD_CLASSES}>
            <CardContent className="space-y-4 py-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-semibold text-slate-900">{r.role_title}</p>
                    {r.call_paid_at && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Zap className="h-2.5 w-2.5" /> Recruiter call booked
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span>{r.client_display}</span>
                    {r.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> {r.city}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
                    TONE_CLASSES[statusTone(r.stage)]
                  }`}
                >
                  {statusLabel(r.stage)}
                </span>
              </div>

              {!closed && (
                <ol className="grid grid-cols-5 gap-1.5" aria-label="Application progress">
                  {APPLICATION_STEPS.map((label, i) => {
                    const reached = i < activeIdx || (done && i === activeIdx);
                    const current = i === activeIdx && !done;
                    return (
                      <li key={label}>
                        <div
                          className={`h-1.5 rounded-full ${
                            reached ? "bg-emerald-500" : current ? "bg-blue-600" : "bg-slate-200"
                          }`}
                        />
                        <p
                          className={`mt-1.5 flex items-center gap-1 text-[11px] leading-tight ${
                            current ? "font-semibold text-blue-700" : reached ? "font-medium text-slate-700" : "text-slate-400"
                          }`}
                        >
                          {reached && <Check className="h-3 w-3 shrink-0 text-emerald-600" />}
                          {label}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              )}

              {closed && (
                <p className="text-xs leading-relaxed text-slate-500">
                  {r.stage === "rejected"
                    ? "This one is not moving forward. Your profile stays active for every other matching role."
                    : "This role is on hold. We will let you know if it reopens."}
                </p>
              )}

              {upcomingInterview && (
                <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3.5 py-3">
                  <CalendarClock className="h-5 w-5 shrink-0 text-blue-600" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-blue-900">Interview {formatWhen(upcomingInterview.toISOString())}</p>
                    <p className="text-xs text-blue-800/80">Your recruiter will share the joining details. Practise with Mock Interview.</p>
                  </div>
                  <Link
                    href="/mock-interview"
                    className="ml-auto shrink-0 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Prepare
                  </Link>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : r.link_id)}
                  aria-expanded={open}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  {open ? "Hide activity" : "View activity"}
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {!r.call_paid_at && !closed && (
                  <button
                    onClick={() => bookCall(r.link_id, r.mandate_id)}
                    disabled={payingId === r.link_id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 px-2.5 py-1 text-[11px] font-semibold text-teal-700 hover:bg-teal-50 disabled:opacity-50"
                  >
                    <Zap className="h-3 w-3" />
                    {payingId === r.link_id ? "Opening payment…" : `Book a recruiter call · ₹${PAID_CALL_RUPEES}`}
                  </button>
                )}
              </div>

              {open && (
                <ul className="space-y-0 border-t border-slate-100 pt-4">
                  {linkEvents.length === 0 ? (
                    <li className="text-xs text-slate-400">No activity recorded yet.</li>
                  ) : (
                    linkEvents.map((e, i) => (
                      <li key={`${e.created_at}-${e.to_stage}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                        <div className="flex flex-col items-center">
                          <span className={`mt-1 h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-blue-600 ring-4 ring-blue-100" : "bg-slate-300"}`} />
                          {i < linkEvents.length - 1 && <span className="mt-1 w-px flex-1 bg-slate-200" />}
                        </div>
                        <div>
                          <p className={`text-sm ${i === 0 ? "font-semibold text-slate-900" : "text-slate-700"}`}>{eventLabel(e.to_stage)}</p>
                          <p className="text-xs text-slate-400">{formatWhen(e.created_at)}</p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
