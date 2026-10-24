"use client";

import { ArrowDown, ArrowUp, ArrowRight, Building2, Plus, Trash2 } from "lucide-react";
import { emptyJob, syncJob, type Job } from "@/lib/cv-brief/config";
import Positions from "./positions";
import { Field, IconButton, inputCls } from "./ui";

// Part 1 of the Experience step: is this the right list of companies, roles and dates? Roles at the same company sit together
// as one job. Everything can be corrected here before any detail is asked, so the details are never filled in for a wrong job.

function problems(j: Job): string[] {
  const out: string[] = [];
  if (!j.employer.trim()) out.push("the company name");
  if (!j.positions.some((p) => p.title.trim())) out.push("your job title");
  if (!j.start) out.push("when you started");
  if (!j.current && !j.end) out.push("when you left");
  return out;
}

export default function Timeline({ jobs, onChange, onContinue }: { jobs: Job[]; onChange: (jobs: Job[]) => void; onContinue: () => void }) {
  const update = (j: Job) => onChange(jobs.map((x) => (x.id === j.id ? j : x)));
  const add = () => onChange([...jobs, syncJob({ ...emptyJob(), positions: [{ id: Math.random().toString(36).slice(2, 10), title: "", level: "", start: "", end: "", current: false }] })]);
  const move = (i: number, by: -1 | 1) => {
    const to = i + by;
    if (to < 0 || to >= jobs.length) return;
    const next = [...jobs];
    [next[i], next[to]] = [next[to], next[i]];
    onChange(next);
  };
  const remove = (j: Job) => {
    if ((j.employer || j.positions.some((p) => p.title)) && !window.confirm(`Remove ${j.employer || "this job"} and everything entered for it?`)) return;
    onChange(jobs.filter((x) => x.id !== j.id));
  };
  const open = jobs.filter((j) => problems(j).length > 0);

  return (
    <div className="cv-in space-y-4">
      <div className="px-1 pb-1">
        <h1 className="text-[26px] font-bold leading-tight text-slate-950">Is this your career timeline?</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">
          {jobs.some((j) => j.fromCv) ? "We read this from your CV. Check each company, role and date, and fix anything that is off." : "List the companies you have worked for, newest first."} If you moved up inside one company, keep it as one job with two roles. A different company in between means a separate job.
        </p>
      </div>

      {jobs.length === 0 && (
        <div className="rounded-3xl border border-slate-200/70 bg-white p-6 text-center">
          <Building2 className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-[15px] text-slate-600">No jobs yet. Start with your current or most recent company.</p>
        </div>
      )}

      {jobs.map((j, i) => (
        <section key={j.id} className="rounded-3xl border border-slate-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-bold text-slate-600">{i + 1}</span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{i === 0 ? "Latest company" : "Earlier company"}</p>
                {j.fromCv && <p className="text-[11.5px] font-semibold text-sky-700">Read from your CV</p>}
              </div>
            </div>
            <div className="flex items-center">
              {jobs.length > 1 && (
                <>
                  <IconButton onClick={() => move(i, -1)} label="Move up"><ArrowUp className="h-4 w-4" /></IconButton>
                  <IconButton onClick={() => move(i, 1)} label="Move down"><ArrowDown className="h-4 w-4" /></IconButton>
                </>
              )}
              <IconButton onClick={() => remove(j)} label="Remove this company"><Trash2 className="h-4 w-4" /></IconButton>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Company"><input className={inputCls} value={j.employer} onChange={(e) => update({ ...j, employer: e.target.value })} placeholder="Where you worked" /></Field>
            <Field label="City"><input className={inputCls} value={j.city} onChange={(e) => update({ ...j, city: e.target.value })} /></Field>
          </div>
          <div className="mt-4"><Positions job={j} onChange={update} /></div>
        </section>
      ))}

      <button type="button" onClick={add} className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 py-5 text-[15px] font-semibold text-slate-600 transition hover:border-slate-900 hover:text-slate-950">
        <Plus className="h-5 w-5" /> {jobs.length ? "Add another company" : "Add your latest company"}
      </button>

      <div className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70">
        {open.length > 0 ? (
          <p className="mb-3 text-[13.5px] leading-relaxed text-amber-800">
            Still missing: {open.slice(0, 3).map((j) => `${j.employer || "a job"} (${problems(j).join(", ")})`).join("; ")}{open.length > 3 ? " and more" : ""}. You can carry on, and fix these later.
          </p>
        ) : jobs.length > 0 ? (
          <p className="mb-3 text-[13.5px] text-emerald-800">✓ Every company has a title and dates.</p>
        ) : null}
        <button type="button" onClick={onContinue} disabled={jobs.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 text-[16px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40">
          This looks right, add the details <ArrowRight className="h-5 w-5" />
        </button>
        <p className="mt-2 text-center text-xs text-slate-400">Next you will fill in what you sold, your numbers and your team, one job at a time.</p>
      </div>
    </div>
  );
}
