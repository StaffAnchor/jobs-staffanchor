"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  BUYERS, CHANNELS, CURRENCIES, CUSTOMERS, CYCLES, FUNCTIONS, INDUSTRIES, LEVELS, MODELS, MOTIONS, PERIODS, ROUTES, SCOPES, TOOLS, UNITS, WIN_TYPES,
  isLeader, metricFromPreset, newId, presetsFor, type Job, type Metric,
} from "@/lib/cv-brief/config";
import { Field, IconButton, MultiChips, NumInput, PickChips, Select, Seg, Toggle, inputCls } from "./ui";

type Tab = "role" | "sold" | "numbers" | "team";

const FULL_TABS: { id: Tab; label: string }[] = [
  { id: "role", label: "The role" },
  { id: "sold", label: "What you sold" },
  { id: "numbers", label: "Numbers" },
  { id: "team", label: "Team and wins" },
];
const LITE_TABS: { id: Tab; label: string }[] = [
  { id: "role", label: "The role" },
  { id: "team", label: "Highlights" },
];

const unitsFor = (cur: string) => (cur === "INR" ? ["", "Thousand", "Lakh", "Crore"] : UNITS.filter((u) => u !== "Lakh" && u !== "Crore"));

function MetricRow({ m, onChange, onRemove }: { m: Metric; onChange: (m: Metric) => void; onRemove: () => void }) {
  const money = m.kind === "money";
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex items-start justify-between gap-2">
        <input value={m.label} onChange={(e) => onChange({ ...m, label: e.target.value })} placeholder="What is this number?" className="w-full bg-transparent text-[14.5px] font-semibold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400" />
        <IconButton onClick={onRemove} label="Remove this number" />
      </div>
      <div className={`mt-3 grid gap-2.5 ${money ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 sm:grid-cols-2"}`}>
        <div className={money ? "col-span-2 sm:col-span-1" : ""}>
          <NumInput value={m.amount} onChange={(v) => onChange({ ...m, amount: v })} placeholder={m.kind === "percent" ? "For example 112" : "Amount"} />
        </div>
        {money && (
          <>
            <Select value={m.currency} onChange={(v) => onChange({ ...m, currency: v || "INR", unit: v === "INR" || !v ? m.unit : m.unit === "Lakh" || m.unit === "Crore" ? "Million" : m.unit })} options={CURRENCIES} />
            <Select value={m.unit} onChange={(v) => onChange({ ...m, unit: v })} options={unitsFor(m.currency)} placeholder="Unit" />
            <Select value={m.period} onChange={(v) => onChange({ ...m, period: v })} options={PERIODS} placeholder="Per" />
          </>
        )}
      </div>
      <div className="mt-3 space-y-2.5">
        <div>
          <p className="mb-1 text-xs font-medium text-slate-500">Whose number is this?</p>
          <Seg options={SCOPES.map((s) => ({ value: s.value, label: s.value === "own" ? "Mine" : s.value === "team" ? "My team's" : "Whole business" }))} value={m.scope} onChange={(v) => onChange({ ...m, scope: v })} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Seg options={[{ value: "actual", label: "Exact" }, { value: "estimate", label: "Approximate" }]} value={m.basis} onChange={(v) => onChange({ ...m, basis: v })} />
          <input value={m.note} onChange={(e) => onChange({ ...m, note: e.target.value })} placeholder="Anything to explain? (optional)" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[13px] outline-none focus:border-slate-900" />
        </div>
      </div>
    </div>
  );
}

export default function JobEditor({ job, onChange, defaultFull }: { job: Job; onChange: (j: Job) => void; defaultFull: boolean }) {
  const [full, setFull] = useState(defaultFull);
  const tabs = full ? FULL_TABS : LITE_TABS;
  const [tab, setTab] = useState<Tab>("role");
  const active = tabs.some((t) => t.id === tab) ? tab : "role";
  const set = <K extends keyof Job>(k: K, v: Job[K]) => onChange({ ...job, [k]: v });
  const presets = presetsFor(job).filter((p) => !job.metrics.some((m) => m.key === p.key));
  const leader = isLeader(job);

  const done: Record<Tab, boolean> = {
    role: !!(job.employer && job.title),
    sold: !!(job.sells.trim() || job.customers.length || job.motion.length),
    numbers: job.metrics.some((m) => m.amount !== null),
    team: job.wins.some((w) => w.text.trim()),
  };

  const wins = job.wins.length ? job.wins : [{ id: newId(), type: "", text: "", result: "" }];
  const setWin = (i: number, patch: Partial<Job["wins"][number]>) => set("wins", wins.map((w, x) => (x === i ? { ...w, ...patch } : w)));

  return (
    <div className="space-y-5">
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={active === t.id} type="button" onClick={() => setTab(t.id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${active === t.id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t.label}
            {done[t.id] && <span className={`h-1.5 w-1.5 rounded-full ${active === t.id ? "bg-emerald-300" : "bg-emerald-500"}`} />}
          </button>
        ))}
      </div>

      {active === "role" && (
        <div className="space-y-5">
          {job.fromCv && <p className="rounded-xl bg-sky-50 px-3.5 py-2.5 text-[13px] text-sky-900">We read these from your CV. Please check them and fix anything that is off.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company"><input className={inputCls} value={job.employer} onChange={(e) => set("employer", e.target.value)} placeholder="Where you worked" /></Field>
            <Field label="Your title"><input className={inputCls} value={job.title} onChange={(e) => set("title", e.target.value)} placeholder="For example Senior Account Executive" /></Field>
            <Field label="Started"><input type="month" className={inputCls} value={job.start} onChange={(e) => set("start", e.target.value)} /></Field>
            <Field label="Ended">
              <input type="month" className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`} value={job.end} disabled={job.current} onChange={(e) => set("end", e.target.value)} />
            </Field>
          </div>
          <Toggle on={job.current} onChange={(v) => onChange({ ...job, current: v, end: v ? "" : job.end })}>I work here now</Toggle>
          <Field label="Type of role"><PickChips options={FUNCTIONS} value={job.fn} onChange={(v) => set("fn", v)} /></Field>
          <Field label="Your level"><PickChips options={LEVELS} value={job.level} onChange={(v) => set("level", v)} /></Field>
          <Field label="Industry"><PickChips options={INDUSTRIES} value={job.industry} onChange={(v) => set("industry", v)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City"><input className={inputCls} value={job.city} onChange={(e) => set("city", e.target.value)} /></Field>
            <Field label="Reported to (their role)"><input className={inputCls} value={job.reportsTo} onChange={(e) => set("reportsTo", e.target.value)} placeholder="For example Regional Sales Head" /></Field>
          </div>
          {full && <Field label="Area or markets you covered" hint="For example North India, Mumbai and Pune, or Global accounts."><input className={inputCls} value={job.geography} onChange={(e) => set("geography", e.target.value)} /></Field>}
        </div>
      )}

      {active === "sold" && (
        <div className="space-y-5">
          <Field label="What did you sell?" hint="Products or services, in a line or two.">
            <textarea rows={3} className={inputCls} value={job.sells} onChange={(e) => set("sells", e.target.value)} placeholder="For example Cloud HR software to mid-size companies" />
          </Field>
          <Field label="Who bought from you?"><MultiChips options={CUSTOMERS} value={job.customers} onChange={(v) => set("customers", v)} /></Field>
          <Field label="Who did you deal with at the customer?"><MultiChips options={BUYERS} value={job.buyers} onChange={(v) => set("buyers", v)} /></Field>
          <Field label="Business model"><MultiChips options={MODELS} value={job.model} onChange={(v) => set("model", v)} own={false} /></Field>
          <Field label="How did you sell?"><MultiChips options={MOTIONS} value={job.motion} onChange={(v) => set("motion", v)} /></Field>
          <Field label="Where did the sale happen?"><MultiChips options={CHANNELS} value={job.channels} onChange={(v) => set("channels", v)} /></Field>
          <Field label="Did you sell directly or through partners?"><PickChips options={ROUTES} value={job.route} onChange={(v) => set("route", v)} /></Field>
          <Field label="How long did a sale usually take?"><PickChips options={CYCLES} value={job.cycle} onChange={(v) => set("cycle", v)} /></Field>
        </div>
      )}

      {active === "numbers" && (
        <div className="space-y-5">
          <div>
            <p className="text-[14px] leading-relaxed text-slate-600">Add the numbers you remember. A broad figure is fine, and you can mark it as approximate. Team and business figures stay separate from your own, so the CV never claims them as yours.</p>
          </div>
          {job.metrics.length > 0 && (
            <div className="space-y-3">
              {job.metrics.map((m) => (
                <MetricRow key={m.id} m={m} onChange={(nm) => set("metrics", job.metrics.map((x) => (x.id === m.id ? nm : x)))} onRemove={() => set("metrics", job.metrics.filter((x) => x.id !== m.id))} />
              ))}
            </div>
          )}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{job.metrics.length ? "Add another" : "Tap to add"}</p>
            <div className="flex flex-wrap gap-2">
              {presets.map((p) => (
                <button key={p.key} type="button" title={p.hint} onClick={() => set("metrics", [...job.metrics, metricFromPreset(p)])} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13.5px] font-medium text-slate-700 transition hover:border-slate-900 active:scale-[0.97]">
                  <Plus className="h-3.5 w-3.5" /> {p.label}
                </button>
              ))}
              <button type="button" onClick={() => set("metrics", [...job.metrics, { ...metricFromPreset({ key: "custom-" + newId(), label: "", kind: "money", scope: "own", hint: "" }) }])} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-2 text-[13.5px] font-medium text-slate-500 transition hover:border-slate-500">
                <Plus className="h-3.5 w-3.5" /> Something else
              </button>
            </div>
            {presets.length > 0 && <p className="mt-2 text-xs text-slate-400">These suggestions change with what you told us you sold.</p>}
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-[14px] font-semibold text-slate-900">Did the number grow while you were there?</p>
            <p className="mt-0.5 text-xs text-slate-500">For example from 2 crore to 5 crore in 18 months. Skip it if it does not apply.</p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              <input className={inputCls} placeholder="From (for example ₹2 Cr)" value={job.growth.from} onChange={(e) => set("growth", { ...job.growth, from: e.target.value })} />
              <input className={inputCls} placeholder="To (for example ₹5 Cr)" value={job.growth.to} onChange={(e) => set("growth", { ...job.growth, to: e.target.value })} />
              <input className={inputCls} placeholder="In (for example 18 months)" value={job.growth.period} onChange={(e) => set("growth", { ...job.growth, period: e.target.value })} />
            </div>
          </div>
        </div>
      )}

      {active === "team" && (
        <div className="space-y-6">
          {full && (
            <>
              <Field label="Did you manage people in this job?">
                <Seg<Job["manages"]> options={[{ value: "yes", label: "Yes" }, { value: "no", label: "No" }]} value={job.manages} onChange={(v) => set("manages", v)} />
              </Field>
              {job.manages === "yes" && (
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="People reporting directly to you"><NumInput value={job.team.direct} onChange={(v) => set("team", { ...job.team, direct: v })} step="1" /></Field>
                    <Field label="Whole team under you" hint="Include managers' teams if you led through managers."><NumInput value={job.team.total} onChange={(v) => set("team", { ...job.team, total: v })} step="1" /></Field>
                  </div>
                  <Field label="Layers between you and the salespeople"><PickChips options={["None", "1 layer", "2 layers", "3 or more"]} value={job.team.layers} onChange={(v) => set("team", { ...job.team, layers: v })} /></Field>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="People you hired (roughly)"><input className={inputCls} value={job.team.hired} onChange={(e) => set("team", { ...job.team, hired: e.target.value })} placeholder="For example 15 in a year" /></Field>
                    <Field label="Team attrition"><input className={inputCls} value={job.team.attrition} onChange={(e) => set("team", { ...job.team, attrition: e.target.value })} placeholder="For example down from 40% to 22%" /></Field>
                  </div>
                  <Field label="Anything about the team worth saying"><input className={inputCls} value={job.team.note} onChange={(e) => set("team", { ...job.team, note: e.target.value })} placeholder="Training, coaching, promotions you made" /></Field>
                </div>
              )}
              {!leader && job.manages === "" && <p className="-mt-3 text-xs text-slate-400">Skip this if you were an individual seller.</p>}
              <Field label="Tools you worked in"><MultiChips options={TOOLS} value={job.tools} onChange={(v) => set("tools", v)} /></Field>
              <Field label="Processes you built or ran" hint="Names are fine, for example lead allocation, weekly pipeline review, onboarding playbook.">
                <textarea rows={2} className={inputCls} value={job.process} onChange={(e) => set("process", e.target.value)} />
              </Field>
            </>
          )}
          <div>
            <p className="text-[14px] font-semibold text-slate-900">Your best achievements here</p>
            <p className="mt-0.5 text-xs text-slate-500">One to three. Say what the situation was, what you did and what changed. A number helps, but only if you are sure of it.</p>
            <div className="mt-3 space-y-3">
              {wins.map((w, i) => (
                <div key={w.id} className="space-y-3 rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <PickChips options={WIN_TYPES} value={w.type} onChange={(v) => setWin(i, { type: v })} />
                    {wins.length > 1 && <IconButton onClick={() => set("wins", wins.filter((_, x) => x !== i))} label="Remove this achievement"><Trash2 className="h-4 w-4" /></IconButton>}
                  </div>
                  <textarea rows={3} className={inputCls} value={w.text} onChange={(e) => setWin(i, { text: e.target.value })} placeholder="What was happening, and what did you do?" />
                  <input className={inputCls} value={w.result} onChange={(e) => setWin(i, { result: e.target.value })} placeholder="The result (for example Took the region from ₹3 Cr to ₹5.5 Cr in a year)" />
                </div>
              ))}
              {wins.length < 3 && w_add(wins, (x) => set("wins", x))}
            </div>
          </div>
          {full && (
            <div className="grid gap-4">
              <Field label="Promotions or awards in this job"><input className={inputCls} value={job.promoted} onChange={(e) => set("promoted", e.target.value)} placeholder="For example Promoted to Manager in 2023, President's Club twice" /></Field>
              <Field label="Anything else about this job"><textarea rows={2} className={inputCls} value={job.extra} onChange={(e) => set("extra", e.target.value)} /></Field>
            </div>
          )}
        </div>
      )}

      {!full && (
        <button type="button" onClick={() => setFull(true)} className="text-[13px] font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-950">
          Add the full detail for this job
        </button>
      )}
    </div>
  );
}

function w_add(wins: Job["wins"], set: (w: Job["wins"]) => void) {
  return (
    <button type="button" onClick={() => set([...wins, { id: newId(), type: "", text: "", result: "" }])} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-2 text-[13.5px] font-medium text-slate-500 transition hover:border-slate-500">
      <Plus className="h-3.5 w-3.5" /> Add another achievement
    </button>
  );
}
