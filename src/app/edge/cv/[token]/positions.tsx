"use client";

import { Plus, Trash2 } from "lucide-react";
import { LEVELS, newId, suggestLevel, syncJob, type Job, type Position } from "@/lib/cv-brief/config";
import { Field, IconButton, MonthYear, Select, Toggle, inputCls } from "./ui";

/** True when the end date is before the start date. */
const backwards = (p: Position) => !!p.start && !!p.end && !p.current && p.end < p.start;

/**
 * The roles someone held at one company, newest first. Several rows here is a promotion at the same company, which is one
 * job on the CV and not several. Used to check the timeline and again when filling a job in.
 */
export default function Positions({ job, onChange, withLevel = false }: { job: Job; onChange: (j: Job) => void; withLevel?: boolean }) {
  const ps = job.positions.length ? job.positions : [{ id: "new", title: "", level: "", start: "", end: "", current: false }];
  const set = (id: string, patch: Partial<Position>) => {
    const next = (job.positions.length ? job.positions : [{ id: newId(), title: "", level: "", start: "", end: "", current: false }]).map((p) => (p.id === id || id === "new" ? { ...p, ...patch } : p));
    onChange(syncJob({ ...job, positions: next }));
  };
  const add = () => onChange(syncJob({ ...job, positions: [...(job.positions.length ? job.positions : [{ id: newId(), title: "", level: "", start: "", end: "", current: false }]), { id: newId(), title: "", level: "", start: "", end: "", current: false }] }));
  const remove = (id: string) => onChange(syncJob({ ...job, positions: job.positions.filter((p) => p.id !== id) }));

  return (
    <div className="space-y-3">
      <ol className="relative space-y-4 border-l-2 border-slate-200 pl-5">
        {ps.map((p, i) => {
          const sug = withLevel && !p.level ? suggestLevel(p.title) : "";
          return (
            <li key={p.id} className="relative">
              <span className={`absolute -left-[27px] top-3 h-3 w-3 rounded-full border-2 border-white ${i === 0 ? "bg-slate-950" : "bg-slate-300"}`} />
              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{ps.length > 1 ? (i === 0 ? "Latest role here" : "Earlier role here") : "Your role"}</p>
                  {ps.length > 1 && <IconButton onClick={() => remove(p.id)} label="Remove this role"><Trash2 className="h-4 w-4" /></IconButton>}
                </div>
                <Field label="Job title"><input className={inputCls} value={p.title} onChange={(e) => set(p.id, { title: e.target.value })} placeholder="For example Senior Account Executive" /></Field>
                {withLevel && (
                  <Field label="Level">
                    <Select value={p.level} onChange={(v) => set(p.id, { level: v })} options={LEVELS} placeholder="Choose your level" />
                    {sug && (
                      <button type="button" onClick={() => set(p.id, { level: sug })} className="mt-2 text-left text-[13px] text-sky-800">
                        From the title this looks like <b>{sug}</b>. <span className="font-semibold underline underline-offset-2">Use it</span>
                      </button>
                    )}
                  </Field>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Started"><MonthYear label="Started" value={p.start} onChange={(v) => set(p.id, { start: v })} /></Field>
                  <Field label={p.current ? "Ended" : "Ended"}><MonthYear label="Ended" value={p.end} disabled={p.current} onChange={(v) => set(p.id, { end: v })} /></Field>
                </div>
                <Toggle on={p.current} onChange={(v) => set(p.id, { current: v, end: v ? "" : p.end })}>I am in this role now</Toggle>
                {backwards(p) && <p className="text-[13px] font-medium text-red-600">The end date is before the start date. Please check it.</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <button type="button" onClick={add} className="ml-5 inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-2 text-[13.5px] font-medium text-slate-500 transition hover:border-slate-900 hover:text-slate-950">
        <Plus className="h-3.5 w-3.5" /> I was promoted or moved roles here too
      </button>
    </div>
  );
}
