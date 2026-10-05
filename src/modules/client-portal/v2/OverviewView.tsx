"use client";

import Link from "next/link";
import { ArrowRight, CalendarClock, Plus, UserPlus } from "lucide-react";
import type { ClientOverview, OverviewMandate } from "./types";
import { LABEL, formatSlot, lakhLabel } from "./ui";

const STATUS: Record<string, string> = { open: "Open", on_hold: "On hold", closed: "Closed", filled: "Filled" };

function Funnel({ m }: { m: OverviewMandate }) {
  const parts = [
    { n: m.to_review, cls: "bg-[#e8896a]", label: "to review" },
    { n: m.interested, cls: "bg-emerald-500", label: "interested" },
    { n: m.interviewing, cls: "bg-indigo-500", label: "interviewing" },
    { n: m.hired, cls: "bg-slate-800", label: "hired" },
  ];
  const total = Math.max(1, m.shortlisted);
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-[#ece7de]">
        {parts.map((p) => p.n > 0 && <div key={p.label} className={p.cls} style={{ width: `${(p.n / total) * 100}%` }} />)}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[11.5px] text-slate-500">
        {parts.filter((p) => p.n > 0).map((p) => (
          <span key={p.label} className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${p.cls}`} />
            <span className="font-mono font-semibold text-slate-800">{p.n}</span> {p.label}
          </span>
        ))}
        {m.shortlisted === 0 && <span>No candidates yet</span>}
      </div>
    </div>
  );
}

export default function OverviewView({
  data,
  roleHref,
  requestHref,
  teamHref,
  banner,
}: {
  data: ClientOverview;
  roleHref: (id: string) => string;
  requestHref?: string;
  teamHref?: string;
  banner?: React.ReactNode;
}) {
  const open = data.mandates.filter((m) => m.status === "open");
  const closed = data.mandates.filter((m) => m.status !== "open");
  const toReview = data.mandates.reduce((s, m) => s + m.to_review, 0);
  const interviewing = data.mandates.reduce((s, m) => s + m.interviewing, 0);

  const Role = ({ m }: { m: OverviewMandate }) => {
    const budget = m.budget_max ? `${lakhLabel(m.budget_min) ?? ""}${m.budget_min ? " – " : "Up to "}${lakhLabel(m.budget_max)}` : null;
    return (
      <Link href={roleHref(m.id)} className="group block rounded-2xl border border-[#ece7de] bg-white p-5 shadow-[0_1px_2px_rgba(60,40,20,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(60,40,20,0.09)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[16px] font-semibold text-slate-900">{m.role_title}</h3>
            <p className="mt-0.5 text-[12.5px] text-slate-500">
              {[m.sub_domain, m.city, m.experience_min !== null || m.experience_max !== null ? `${m.experience_min ?? 0}–${m.experience_max ?? "+"} yrs` : null, budget].filter(Boolean).join(" · ")}
            </p>
          </div>
          <span className="rounded-full bg-[#f4efe6] px-2.5 py-0.5 text-[11px] font-medium text-slate-600">{STATUS[m.status] ?? m.status}</span>
        </div>
        <div className="mt-4">
          <Funnel m={m} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          {m.to_review > 0 ? (
            <span className="rounded-full bg-[#fdeee8] px-2.5 py-1 text-[12px] font-semibold text-[#c2563a]">
              {m.to_review} waiting for you
            </span>
          ) : (
            <span className="text-[12px] text-slate-400">Nothing waiting for you</span>
          )}
          <span className="inline-flex items-center gap-1 text-[12.5px] font-medium text-indigo-700 group-hover:gap-1.5">
            Open shortlist <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {banner}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={LABEL}>Client portal</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
            Your hiring, <span className="font-[family-name:var(--font-fraunces)] italic text-[#d9694a]">at a glance</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {teamHref && (
            <Link href={teamHref} className="inline-flex items-center gap-1.5 rounded-xl border border-[#e3ddd1] bg-white px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:bg-[#f4efe6]">
              <UserPlus className="h-3.5 w-3.5" /> Invite a colleague
            </Link>
          )}
          {requestHref && (
            <Link href={requestHref} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-slate-800">
              <Plus className="h-3.5 w-3.5" /> Request a new role
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Open roles", v: open.length, c: "text-slate-900" },
          { l: "Waiting for you", v: toReview, c: toReview > 0 ? "text-[#d9694a]" : "text-slate-900" },
          { l: "In interview", v: interviewing, c: "text-slate-900" },
          { l: "Hired", v: data.mandates.reduce((s, m) => s + m.hired, 0), c: "text-slate-900" },
        ].map((t) => (
          <div key={t.l} className="rounded-2xl border border-[#ece7de] bg-white px-4 py-3">
            <p className={LABEL}>{t.l}</p>
            <p className={`mt-0.5 font-mono text-[26px] font-semibold ${t.c}`}>{t.v}</p>
          </div>
        ))}
      </div>

      {data.upcoming.length > 0 && (
        <div className="mt-6 rounded-2xl border border-[#ece7de] bg-white p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
            <CalendarClock className="h-4 w-4 text-indigo-600" /> Upcoming interviews
          </h2>
          <div className="mt-3 divide-y divide-[#f1ece3]">
            {data.upcoming.map((u) => (
              <Link key={u.link_id} href={roleHref(u.mandate_id)} className="flex items-center justify-between gap-3 py-2.5 text-[13px] hover:text-indigo-700">
                <span>
                  <span className="font-medium text-slate-900">{u.full_name}</span>
                  <span className="text-slate-500"> · {u.role_title}</span>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ${u.confirmed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {formatSlot(u.at)} {u.confirmed ? "· confirmed" : "· awaiting confirmation"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {data.mandates.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[#d9d2c4] bg-white/60 px-6 py-16 text-center">
          <p className="text-[15px] font-medium text-slate-800">No roles yet</p>
          <p className="mt-1 text-[13px] text-slate-500">Your recruiter will add a role here as soon as it is live, or you can request one yourself.</p>
        </div>
      ) : (
        <>
          <h2 className="mt-8 text-[15px] font-semibold text-slate-900">Open roles</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">{open.map((m) => <Role key={m.id} m={m} />)}</div>
          {open.length === 0 && <p className="mt-3 text-[13px] text-slate-500">No open roles right now.</p>}
          {closed.length > 0 && (
            <>
              <h2 className="mt-8 text-[15px] font-semibold text-slate-900">Closed and on hold</h2>
              <div className="mt-3 grid gap-4 md:grid-cols-2">{closed.map((m) => <Role key={m.id} m={m} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
