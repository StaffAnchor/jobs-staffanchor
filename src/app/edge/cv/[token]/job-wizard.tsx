"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, FileText, Globe, Handshake, Lightbulb, MapPin, Megaphone, MessageCircle, Plus, PhoneIncoming, PhoneOutgoing, Repeat, Share2, Trash2, TrendingUp, UserPlus, Wallet } from "lucide-react";
import {
  BUYERS, COMPOSITION, CURRENCIES, CUSTOMERS, CYCLES, FUNCTIONS, INDUSTRIES, LEADER_LEVELS, LEAD_DUTIES, LEVELS, MODELS, PERIODS, PROCESS_GROUPS, PROC_ROLES, RANGES_INR, ROUTES, SCOPES, STAGES, TOOLS, VOLUMES, WIN_TEMPLATES,
  assembleWin, describeJob, isLeader, keyItems, metricFromPreset, newId, presetsFor, suggestLevel, type Job, type Metric, type Win,
} from "@/lib/cv-brief/config";
import { BigNumber, Field, IconButton, MultiChips, NumInput, PickChips, Reveal, Seg, Select, Tile, Toggle, inputCls } from "./ui";

export type StepId = "role" | "sold" | "process" | "numbers" | "team" | "wins" | "more";

const TEXT: Record<StepId, { title: string; sub: string }> = {
  role: { title: "The basics", sub: "Where you worked and the kind of role it was." },
  sold: { title: "What you sold", sub: "In plain words. This becomes the first line under the job title." },
  process: { title: "How you sold", sub: "Tap every sales process you ran. It is a key part of a sales CV." },
  numbers: { title: "Your revenue numbers", sub: "The figures your CV leads with. A rough number or a range is fine." },
  team: { title: "Your team", sub: "The size and shape of the team you led." },
  wins: { title: "Your best moments", sub: "Pick a starter and fill in the blanks. No writing needed." },
  more: { title: "Last details", sub: "Tools, who you reported to, and anything else." },
};

const ICON: Record<string, React.ReactNode> = {
  web: <Globe className="h-[18px] w-[18px]" />, chat: <MessageCircle className="h-[18px] w-[18px]" />, inbound_calls: <PhoneIncoming className="h-[18px] w-[18px]" />, campaign: <Megaphone className="h-[18px] w-[18px]" />,
  events: <CalendarDays className="h-[18px] w-[18px]" />, cold_calls: <PhoneOutgoing className="h-[18px] w-[18px]" />, cold_email: <FileText className="h-[18px] w-[18px]" />, social: <Share2 className="h-[18px] w-[18px]" />,
  field: <MapPin className="h-[18px] w-[18px]" />, upsell: <TrendingUp className="h-[18px] w-[18px]" />, renewals: <Repeat className="h-[18px] w-[18px]" />, collections: <Wallet className="h-[18px] w-[18px]" />,
  partners: <Handshake className="h-[18px] w-[18px]" />, referrals: <UserPlus className="h-[18px] w-[18px]" />, tenders: <FileText className="h-[18px] w-[18px]" />,
};

const UNITS_FOR = (cur: string) => (cur === "INR" ? ["Thousand", "Lakh", "Crore"] : ["Thousand", "Million", "Billion"]);
const SYMBOL: Record<string, string> = { INR: "₹", USD: "$", GBP: "£", EUR: "€", AED: "AED ", SGD: "S$" };
const MULT: Record<string, number> = { Thousand: 1e3, Lakh: 1e5, Crore: 1e7, Million: 1e6, Billion: 1e9 };

// The same figures are asked of everyone, so the numbers are never optional chips hidden in a tab.
type Core = { key: string; label: string; ask: string; scope: Metric["scope"]; hint?: string };
const OWN: Core[] = [
  { key: "target", label: "Sales target", ask: "What was your sales target?", scope: "own", hint: "The number you were set for the period." },
  { key: "achieved", label: "Target achieved", ask: "What did you actually achieve?", scope: "own", hint: "What you sold or booked against it." },
];
const TEAM: Core[] = [
  { key: "teamtarget", label: "Team target", ask: "What was your team's target?", scope: "team" },
  { key: "teamrev", label: "Team revenue achieved", ask: "What did your team achieve?", scope: "team" },
];
const BUSINESS: Core = { key: "business", label: "Business or portfolio revenue", ask: "Total revenue of the business or portfolio you were responsible for (optional)", scope: "business" };

const EXTRA_ORDER = ["deal", "deals", "leads", "conversion", "order", "arr", "pipeline"];

function Banner({ tone = "info", children }: { tone?: "info" | "warn"; children: React.ReactNode }) {
  return <p className={`flex gap-2.5 rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed ${tone === "warn" ? "bg-amber-50 text-amber-900" : "bg-sky-50 text-sky-900"}`}><Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />{children}</p>;
}

/** The little "= ₹3,20,000" under a figure, so a wrong unit (lakh for crore) is caught as it is typed. */
const echo = (m: Metric): string => {
  if (m.kind !== "money" || m.amount === null || !m.unit) return "";
  const full = Math.round(m.amount * (MULT[m.unit] ?? 1));
  return `= ${SYMBOL[m.currency] ?? m.currency + " "}${full.toLocaleString(m.currency === "INR" ? "en-IN" : "en-US")}${m.period === "Per month" ? " a month" : m.period === "Per quarter" ? " a quarter" : m.period === "Per year" ? " a year" : ""}`;
};

// ---------- Step: the basics ----------
function RoleStep({ job, set, onChange }: { job: Job; set: <K extends keyof Job>(k: K, v: Job[K]) => void; onChange: (j: Job) => void }) {
  const suggestion = suggestLevel(job.title);
  const pick = (v: string) => onChange({ ...job, level: v, manages: LEADER_LEVELS.includes(v) ? "yes" : isLeader(job) && job.manages === "yes" ? "" : job.manages });
  return (
    <div className="space-y-6">
      {job.fromCv && <Banner>We read these from your CV. Please check them and fix anything that is off.</Banner>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company"><input className={inputCls} value={job.employer} onChange={(e) => set("employer", e.target.value)} placeholder="Where you worked" /></Field>
        <Field label="Your title"><input className={inputCls} value={job.title} onChange={(e) => set("title", e.target.value)} placeholder="For example Senior Account Executive" /></Field>
        <Field label="Started"><input type="month" className={inputCls} value={job.start} onChange={(e) => set("start", e.target.value)} /></Field>
        <Field label="Ended"><input type="month" className={`${inputCls} disabled:bg-slate-50 disabled:text-slate-400`} value={job.end} disabled={job.current} onChange={(e) => set("end", e.target.value)} /></Field>
      </div>
      <Toggle on={job.current} onChange={(v) => onChange({ ...job, current: v, end: v ? "" : job.end })}>I work here now</Toggle>
      <Field label="What kind of sales role?"><PickChips options={FUNCTIONS} value={job.fn} onChange={(v) => set("fn", v)} /></Field>
      <Field label="Your level" hint="This decides which questions come next, so a team lead is asked about the team and a seller is not.">
        {!job.level && suggestion && (
          <button type="button" onClick={() => pick(suggestion)} className="cv-in mb-3 flex w-full items-center justify-between gap-3 rounded-2xl bg-sky-50 px-4 py-3 text-left text-[13.5px] text-sky-900 transition hover:bg-sky-100">
            <span>From your title, this looks like <b>{suggestion}</b>. Is that right?</span>
            <span className="shrink-0 rounded-full bg-sky-900 px-3 py-1 text-xs font-semibold text-white">Yes</span>
          </button>
        )}
        <PickChips options={LEVELS} value={job.level} onChange={pick} />
      </Field>
      {(LEADER_LEVELS.includes(job.level) || job.manages === "yes") && <Banner>Since you led a team, we will ask about its size and results in a moment.</Banner>}
      {!LEADER_LEVELS.includes(job.level) && job.manages !== "yes" && job.level && (
        <Field label="Did you manage or lead people in this job?">
          <Seg<Job["manages"]> options={[{ value: "no", label: "No, I sold on my own" }, { value: "yes", label: "Yes, I managed people" }]} value={job.manages} onChange={(v) => set("manages", v)} />
        </Field>
      )}
      <Field label="Industry"><PickChips options={INDUSTRIES} value={job.industry} onChange={(v) => set("industry", v)} /></Field>
      <Field label="City"><input className={inputCls} value={job.city} onChange={(e) => set("city", e.target.value)} /></Field>
    </div>
  );
}

// ---------- Step: what you sold ----------
function SoldStep({ job, set }: { job: Job; set: <K extends keyof Job>(k: K, v: Job[K]) => void }) {
  return (
    <div className="space-y-6">
      <Field label="What did you sell?" hint="Products or services, in a line or two.">
        <textarea rows={3} className={inputCls} value={job.sells} onChange={(e) => set("sells", e.target.value)} placeholder="For example Cloud HR software to mid-size companies" />
      </Field>
      <Field label="Who bought from you?"><MultiChips options={CUSTOMERS} value={job.customers} onChange={(v) => set("customers", v)} /></Field>
      <Field label="Business model"><MultiChips options={MODELS} value={job.model} onChange={(v) => set("model", v)} own={false} /></Field>
      <Field label="How long did a sale usually take?"><PickChips options={CYCLES} value={job.cycle} onChange={(v) => set("cycle", v)} /></Field>
      <Field label="Direct, or through partners?"><PickChips options={ROUTES} value={job.route} onChange={(v) => set("route", v)} /></Field>
    </div>
  );
}

// ---------- Step: sales processes ----------
const volumeQuestion = (key: string) => (["renewals", "upsell", "collections"].includes(key) ? "Roughly how many accounts a month?" : key === "partners" ? "Roughly how many partners did you handle?" : "Roughly how many leads or conversations a month?");

function ProcessStep({ job, set }: { job: Job; set: <K extends keyof Job>(k: K, v: Job[K]) => void }) {
  const has = (key: string) => job.processes.some((p) => p.key === key);
  const toggle = (key: string, label: string) => set("processes", has(key) ? job.processes.filter((p) => p.key !== key) : [...job.processes, { key, label, volume: "", role: "" }]);
  const patch = (key: string, p: Partial<Job["processes"][number]>) => set("processes", job.processes.map((x) => (x.key === key ? { ...x, ...p } : x)));
  return (
    <div className="space-y-7">
      {PROCESS_GROUPS.map((g) => (
        <div key={g.group}>
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">{g.group}</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {g.items.map((i) => <Tile key={i.key} on={has(i.key)} onClick={() => toggle(i.key, i.label)} icon={ICON[i.key]} label={i.label} />)}
          </div>
        </div>
      ))}
      {job.processes.length > 0 && (
        <div className="space-y-3">
          <p className="text-[15px] font-bold text-slate-950">A little more about each <span className="font-normal text-slate-400">(optional, one tap each)</span></p>
          {job.processes.map((p) => (
            <div key={p.key} className="cv-in space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <p className="flex items-center gap-2 text-[14px] font-semibold text-slate-900"><span className="text-slate-500">{ICON[p.key]}</span>{p.label}</p>
              <div><p className="mb-1.5 text-xs font-medium text-slate-500">{volumeQuestion(p.key)}</p><PickChips options={VOLUMES} value={p.volume} onChange={(v) => patch(p.key, { volume: v })} /></div>
              <div><p className="mb-1.5 text-xs font-medium text-slate-500">Your part in it</p><PickChips options={PROC_ROLES} value={p.role} onChange={(v) => patch(p.key, { role: v })} /></div>
            </div>
          ))}
        </div>
      )}
      <Field label="Which parts of the sale did you own?"><MultiChips options={STAGES} value={job.stages} onChange={(v) => set("stages", v)} own={false} /></Field>
      <Field label="Any process you built or ran that has a name?" hint="For example lead allocation, weekly pipeline review, onboarding playbook.">
        <textarea rows={2} className={inputCls} value={job.process} onChange={(e) => set("process", e.target.value)} />
      </Field>
    </div>
  );
}

// ---------- Step: revenue numbers ----------
function MoneyOrNumber({ m, ask, hint, mode, onChange }: { m: Metric; ask: string; hint?: string; mode: "exact" | "roughly" | "range"; onChange: (m: Metric) => void }) {
  const money = m.kind === "money";
  const sym = SYMBOL[m.currency] ?? "";
  return (
    <div>
      <p className="mb-1.5 text-[14px] font-semibold text-slate-900">{ask}</p>
      {money && mode === "range" ? (
        <PickChips options={RANGES_INR} value={m.range} onChange={(v) => onChange({ ...m, range: v, amount: null })} />
      ) : (
        <div className="flex items-center gap-2">
          {money && <span className="flex h-[46px] min-w-10 items-center justify-center rounded-xl bg-slate-100 px-2 text-[15px] font-semibold text-slate-600">{sym.trim() || m.currency}</span>}
          <NumInput value={m.amount} onChange={(v) => onChange({ ...m, amount: v, range: v === null ? m.range : "" })} placeholder={m.kind === "percent" ? "For example 112" : "Amount"} className="max-w-[220px] text-[18px] font-semibold" />
          {m.kind === "percent" && <span className="text-[15px] font-semibold text-slate-500">%</span>}
        </div>
      )}
      {money && mode !== "range" && echo(m) && <p className="mt-1.5 text-xs font-medium text-emerald-700">{echo(m)}</p>}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function NumbersStep({ job, onChange }: { job: Job; onChange: (j: Job) => void }) {
  const leader = isLeader(job);
  const first = job.metrics.find((m) => m.kind === "money");
  const currency = first?.currency || "INR";
  const unit = first?.unit || "Lakh";
  const period = first?.period || "Per year";
  const [mode, setMode] = useState<"exact" | "roughly" | "range">(job.metrics.some((m) => m.range && m.amount === null) ? "range" : job.metrics.some((m) => m.basis === "estimate") ? "roughly" : "exact");
  const [more, setMore] = useState(false);
  const ref = useRef(job);
  ref.current = job;

  // Two extra figures that fit how they sold. If we do not know yet, deal size and deals closed are asked, so there is always a second line of numbers.
  const extras = useMemo(() => {
    const avail = presetsFor(job).filter((p) => EXTRA_ORDER.includes(p.key)).sort((a, b) => EXTRA_ORDER.indexOf(a.key) - EXTRA_ORDER.indexOf(b.key));
    const fallback = [
      { key: "deal", label: "Typical deal or order size", kind: "money" as const, scope: "own" as const, hint: "A usual one, not the biggest." },
      { key: "deals", label: "Deals or orders closed", kind: "count" as const, scope: "own" as const, hint: "Roughly, in the period above." },
    ].filter((f) => !avail.some((a) => a.key === f.key));
    return [...avail, ...fallback].slice(0, 2);
  }, [job]);

  // Make sure the core figures exist, so the shared currency, unit and period have somewhere to live.
  useEffect(() => {
    const j = ref.current;
    const wanted = [...OWN, ...(isLeader(j) ? TEAM : [])];
    const missing = wanted.filter((c) => !j.metrics.some((m) => m.key === c.key));
    if (!missing.length) return;
    const base = j.metrics.find((m) => m.kind === "money");
    const made = missing.map((c) => ({ ...metricFromPreset({ key: c.key, label: c.label, kind: "money", scope: c.scope, hint: "" }), currency: base?.currency || "INR", unit: base?.unit || "Lakh", period: base?.period || "Per year", basis: mode === "roughly" ? ("estimate" as const) : ("actual" as const) }));
    onChange({ ...j, metrics: [...j.metrics, ...made] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leader]);

  const get = (key: string) => job.metrics.find((m) => m.key === key);
  const put = (m: Metric) => onChange({ ...job, metrics: job.metrics.some((x) => x.id === m.id) ? job.metrics.map((x) => (x.id === m.id ? m : x)) : [...job.metrics, m] });
  const settings = (patch: Partial<Pick<Metric, "currency" | "unit" | "period">>) => onChange({ ...job, metrics: job.metrics.map((m) => (m.kind === "money" ? { ...m, ...patch } : m)) });
  const setMode2 = (v: "exact" | "roughly" | "range") => {
    setMode(v);
    onChange({ ...job, metrics: job.metrics.map((m) => ({ ...m, basis: v === "roughly" ? "estimate" : "actual" })) });
  };
  const cur = (c: Core): Metric => get(c.key) ?? { ...metricFromPreset({ key: c.key, label: c.label, kind: "money", scope: c.scope, hint: "" }), currency, unit, period };
  const target = get("target");
  const got = get("achieved");
  const pct = target?.amount && got?.amount !== null && got?.amount !== undefined ? Math.round(Math.round((got.amount / target.amount) * 1000) / 10) : null;
  const customs = job.metrics.filter((m) => ![...OWN, ...TEAM, BUSINESS].some((c) => c.key === m.key) && !extras.some((e) => e.key === m.key));
  const unknown = !first?.unit;

  return (
    <div className="space-y-6">
      <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-[13px] font-bold text-slate-800">First, how do you count your numbers?</p>
        <div className="flex flex-wrap items-center gap-2">
          <select aria-label="Currency" value={currency} onChange={(e) => settings({ currency: e.target.value, unit: UNITS_FOR(e.target.value).includes(unit) ? unit : UNITS_FOR(e.target.value)[1] })} className="h-9 rounded-full border border-slate-200 bg-white px-3 text-[13.5px] font-semibold outline-none focus:border-slate-900">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex rounded-full bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
            {UNITS_FOR(currency).map((u) => <button key={u} type="button" onClick={() => settings({ unit: u })} className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${unit === u ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-900"}`}>{u}</button>)}
          </div>
          <div className="flex rounded-full bg-white p-0.5 shadow-sm ring-1 ring-slate-200">
            {PERIODS.map((p) => <button key={p} type="button" onClick={() => settings({ period: p })} className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${period === p ? "bg-slate-950 text-white" : "text-slate-500 hover:text-slate-900"}`}>{p.replace("Total over my time there", "Whole tenure").replace("Per ", "")}</button>)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Seg<"exact" | "roughly" | "range"> options={[{ value: "exact", label: "Exact" }, { value: "roughly", label: "Roughly" }, ...(currency === "INR" ? [{ value: "range" as const, label: "Pick a range" }] : [])]} value={mode} onChange={setMode2} />
          <span className="text-xs text-slate-500">{mode === "range" ? "Not comfortable with exact figures? Pick a band." : mode === "roughly" ? "We will mark these as approximate." : "Use the figures as you remember them."}</span>
        </div>
        {unknown && <p className="text-xs text-slate-500">Check the unit above before you type: 3.2 Lakh and 3.2 Crore are very different.</p>}
      </div>

      <div className="space-y-5 rounded-2xl border border-slate-200 p-4 md:p-5">
        <p className="text-[13px] font-bold uppercase tracking-wider text-slate-400">Your own numbers</p>
        {OWN.map((c) => <MoneyOrNumber key={c.key} m={cur(c)} ask={c.ask} hint={c.hint} mode={mode} onChange={put} />)}
        {pct !== null && (
          <div className={`cv-in inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13.5px] font-bold ${pct >= 100 ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
            {pct >= 100 ? "🎯" : "📊"} That is {pct}% of target
          </div>
        )}
        {extras.map((p) => {
          const m = get(p.key) ?? { ...metricFromPreset(p), currency, unit, period };
          return <MoneyOrNumber key={p.key} m={m} ask={p.label.endsWith("%") ? `${p.label.replace(", %", "")} (%)` : p.label} hint={p.hint} mode={mode} onChange={put} />;
        })}
      </div>

      {leader && (
        <div className="space-y-5 rounded-2xl border border-slate-200 p-4 md:p-5">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wider text-slate-400">Your team&apos;s numbers</p>
            <p className="mt-1 text-xs text-slate-500">Kept separate from your own, so the CV never claims the team&apos;s revenue as yours.</p>
          </div>
          {TEAM.map((c) => <MoneyOrNumber key={c.key} m={cur(c)} ask={c.ask} mode={mode} onChange={put} />)}
          <MoneyOrNumber m={get("business") ?? cur(BUSINESS)} ask={BUSINESS.ask} mode={mode} onChange={put} />
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 p-4 md:p-5">
        <p className="text-[15px] font-bold text-slate-950">Did the number grow while you were there?</p>
        <p className="mt-0.5 text-xs text-slate-500">For example from ₹2 Cr to ₹5 Cr in 18 months. Skip it if it does not apply.</p>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          <input className={inputCls} placeholder="From" value={job.growth.from} onChange={(e) => onChange({ ...job, growth: { ...job.growth, from: e.target.value } })} />
          <input className={inputCls} placeholder="To" value={job.growth.to} onChange={(e) => onChange({ ...job, growth: { ...job.growth, to: e.target.value } })} />
          <input className={inputCls} placeholder="In (for example 18 months)" value={job.growth.period} onChange={(e) => onChange({ ...job, growth: { ...job.growth, period: e.target.value } })} />
        </div>
      </div>

      <div>
        <button type="button" onClick={() => setMore(!more)} className="flex items-center gap-1.5 text-[13.5px] font-semibold text-slate-600 hover:text-slate-950">
          <ChevronDown className={`h-4 w-4 transition ${more ? "rotate-180" : ""}`} /> More numbers {customs.length ? `(${customs.length})` : ""}
        </button>
        {more && (
          <div className="mt-3 space-y-3">
            {customs.map((m) => (
              <div key={m.id} className="space-y-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <input value={m.label} onChange={(e) => put({ ...m, label: e.target.value })} placeholder="What is this number?" className="w-full bg-transparent text-[14.5px] font-semibold outline-none placeholder:font-normal placeholder:text-slate-400" />
                  <IconButton onClick={() => onChange({ ...job, metrics: job.metrics.filter((x) => x.id !== m.id) })} label="Remove this number" />
                </div>
                <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <NumInput value={m.amount} onChange={(v) => put({ ...m, amount: v })} placeholder="Amount" />
                  <Select value={m.kind} onChange={(v) => put({ ...m, kind: (v || "money") as Metric["kind"], currency: v === "money" ? currency : "", unit: v === "money" ? unit : "", period: v === "money" ? period : "" })} options={["money", "count", "percent"]} />
                </div>
                <Seg options={SCOPES.map((s) => ({ value: s.value, label: s.value === "own" ? "Mine" : s.value === "team" ? "My team's" : "Whole business" }))} value={m.scope} onChange={(v) => put({ ...m, scope: v })} />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              {presetsFor(job).filter((p) => !job.metrics.some((m) => m.key === p.key)).map((p) => (
                <button key={p.key} type="button" onClick={() => put({ ...metricFromPreset(p), currency: p.kind === "money" ? currency : "", unit: p.kind === "money" ? unit : "", period: p.kind === "money" ? period : "" })} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700 transition hover:border-slate-900">
                  <Plus className="h-3.5 w-3.5" /> {p.label}
                </button>
              ))}
              <button type="button" onClick={() => put({ ...metricFromPreset({ key: "custom-" + newId(), label: "", kind: "money", scope: "own", hint: "" }), currency, unit, period })} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-2 text-[13px] font-medium text-slate-500 hover:border-slate-500">
                <Plus className="h-3.5 w-3.5" /> Something else
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Step: the team (asked of anyone who leads) ----------
function TeamStep({ job, set }: { job: Job; set: <K extends keyof Job>(k: K, v: Job[K]) => void }) {
  const t = job.team;
  const bad = t.direct !== null && t.total !== null && t.total < t.direct;
  return (
    <div className="space-y-7">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="People reporting directly to you"><BigNumber value={t.direct} onChange={(v) => set("team", { ...t, direct: v })} quick={[2, 3, 5, 8, 10, 15]} label="direct reports" /></Field>
        <Field label="Whole team under you" hint="Include the teams of your managers, if you led through managers."><BigNumber value={t.total} onChange={(v) => set("team", { ...t, total: v })} quick={[5, 10, 15, 25, 50, 100]} label="team size" /></Field>
      </div>
      {bad && <Banner tone="warn">Your whole team is smaller than your direct reports. Please check the two numbers.</Banner>}
      <Field label="Who was in your team?"><MultiChips options={COMPOSITION} value={job.composition} onChange={(v) => set("composition", v)} /></Field>
      <Field label="Layers between you and the salespeople"><PickChips options={["None", "1 layer", "2 layers", "3 or more"]} value={t.layers} onChange={(v) => set("team", { ...t, layers: v })} /></Field>
      <Field label="What did you do as their leader?"><MultiChips options={LEAD_DUTIES} value={job.leads} onChange={(v) => set("leads", v)} own={false} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="People you hired (roughly)"><input className={inputCls} value={t.hired} onChange={(e) => set("team", { ...t, hired: e.target.value })} placeholder="For example 15 in a year" /></Field>
        <Field label="Team attrition"><input className={inputCls} value={t.attrition} onChange={(e) => set("team", { ...t, attrition: e.target.value })} placeholder="For example down from 40% to 22%" /></Field>
      </div>
      <Field label="Anything else about the team"><input className={inputCls} value={t.note} onChange={(e) => set("team", { ...t, note: e.target.value })} placeholder="Training, coaching, promotions you made" /></Field>
    </div>
  );
}

// ---------- Step: achievements as fill-in-the-blank sentences ----------
function WinCard({ w, onChange, onRemove }: { w: Win; onChange: (w: Win) => void; onRemove: () => void }) {
  const tpl = WIN_TEMPLATES.find((t) => t.id === w.tpl);
  if (!tpl) {
    return (
      <div className="cv-in space-y-2.5 rounded-2xl border border-slate-200 p-4">
        <div className="flex justify-end"><IconButton onClick={onRemove} label="Remove this achievement"><Trash2 className="h-4 w-4" /></IconButton></div>
        <textarea rows={3} className={inputCls} value={w.text} onChange={(e) => onChange({ ...w, text: e.target.value })} placeholder="What was happening, what did you do, and what changed?" />
      </div>
    );
  }
  const parts = tpl.tpl.split("{}");
  const setBlank = (i: number, v: string) => {
    const blanks = [...w.blanks];
    while (blanks.length < parts.length - 1) blanks.push("");
    blanks[i] = v;
    onChange({ ...w, blanks, text: assembleWin(tpl.tpl, blanks) });
  };
  return (
    <div className="cv-in rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{tpl.type}</p>
        <IconButton onClick={onRemove} label="Remove this achievement"><Trash2 className="h-4 w-4" /></IconButton>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[16px] font-medium leading-relaxed text-slate-900">
        {parts.map((p, i) => (
          <span key={i} className="contents">
            {p && <span>{p}</span>}
            {i < parts.length - 1 && (
              tpl.id === "custom" ? (
                <textarea rows={3} className={`${inputCls} basis-full`} value={w.blanks[i] ?? ""} placeholder={tpl.ph[i]} onChange={(e) => setBlank(i, e.target.value)} />
              ) : (
                <input value={w.blanks[i] ?? ""} placeholder={tpl.ph[i]} onChange={(e) => setBlank(i, e.target.value)} size={Math.max(10, (w.blanks[i]?.length ?? 0) + 2)} className="min-w-[8.5rem] max-w-full rounded-lg border-b-2 border-slate-300 bg-slate-50 px-2.5 py-1 text-[15px] font-semibold text-slate-950 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-slate-950" />
              )
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

function WinsStep({ job, set }: { job: Job; set: <K extends keyof Job>(k: K, v: Job[K]) => void }) {
  const add = (id: string) => {
    const t = WIN_TEMPLATES.find((x) => x.id === id)!;
    set("wins", [...job.wins, { id: newId(), type: t.type, tpl: t.id, blanks: [], text: assembleWin(t.tpl, []), result: "" }]);
  };
  return (
    <div className="space-y-5">
      {job.wins.length > 0 && <div className="space-y-3">{job.wins.map((w) => <WinCard key={w.id} w={w} onChange={(nw) => set("wins", job.wins.map((x) => (x.id === w.id ? nw : x)))} onRemove={() => set("wins", job.wins.filter((x) => x.id !== w.id))} />)}</div>}
      {job.wins.length < 3 ? (
        <div>
          <p className="mb-2.5 text-[13px] font-bold text-slate-800">{job.wins.length ? "Add another" : "Pick a starter"} <span className="font-normal text-slate-400">(up to 3)</span></p>
          <div className="flex flex-wrap gap-2">
            {WIN_TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => add(t.id)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13.5px] font-medium text-slate-700 transition hover:border-slate-900 active:scale-[0.97]">
                <Plus className="h-3.5 w-3.5" /> {t.id === "custom" ? "Write my own" : t.type}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">Three is plenty. Remove one to add a different one.</p>
      )}
    </div>
  );
}

// ---------- Step: last details ----------
function MoreStep({ job, set }: { job: Job; set: <K extends keyof Job>(k: K, v: Job[K]) => void }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="You reported to (their role)"><input className={inputCls} value={job.reportsTo} onChange={(e) => set("reportsTo", e.target.value)} placeholder="For example Regional Sales Head" /></Field>
        <Field label="Area or markets you covered"><input className={inputCls} value={job.geography} onChange={(e) => set("geography", e.target.value)} placeholder="For example North India" /></Field>
      </div>
      <Field label="Who did you deal with at the customer?"><MultiChips options={BUYERS} value={job.buyers} onChange={(v) => set("buyers", v)} /></Field>
      <Field label="Tools you worked in"><MultiChips options={TOOLS} value={job.tools} onChange={(v) => set("tools", v)} /></Field>
      <Field label="Promotions or awards in this job"><input className={inputCls} value={job.promoted} onChange={(e) => set("promoted", e.target.value)} placeholder="For example Promoted to Manager in 2023, President's Club twice" /></Field>
      <Field label="Anything else about this job"><textarea rows={2} className={inputCls} value={job.extra} onChange={(e) => set("extra", e.target.value)} /></Field>
    </div>
  );
}

// ---------- The live preview: how this job will read, built only from what has been entered ----------
function Preview({ job, full, onJump }: { job: Job; full: boolean; onJump: (s: StepId) => void }) {
  const d = describeJob(job, full);
  const items = keyItems(job, full);
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">How this will read on your CV</p>
      <h3 className="mt-3 text-[16px] font-bold leading-snug text-slate-950">{d.head}</h3>
      {d.sub && <p className="text-xs text-slate-500">{d.sub}</p>}
      <ul className="mt-3 space-y-2">
        {d.lines.map((l, i) => (
          <li key={i} className={`flex gap-2 text-[13.5px] leading-relaxed ${l.ghost ? "italic text-slate-300" : "text-slate-700"}`}>
            <span className={`mt-2 h-1 w-1 shrink-0 rounded-full ${l.ghost ? "bg-slate-300" : "bg-slate-500"}`} />
            <span>{l.text}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3.5">
        {items.map((k) => (
          <button key={k.id} type="button" onClick={() => onJump(k.id as StepId)} className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition ${k.done ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800 hover:bg-amber-100"}`}>
            {k.done ? "✓" : "+"} {k.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- The wizard ----------
export default function JobWizard({ job, index, total, onChange, onClose, initialStep }: { job: Job; index: number; total: number; onChange: (j: Job) => void; onClose: () => void; initialStep?: StepId }) {
  const [full, setFull] = useState(index < 2);
  const leader = isLeader(job);
  const steps = useMemo<StepId[]>(() => (full ? ["role", "sold", "process", "numbers", ...(leader ? (["team"] as StepId[]) : []), "wins", "more"] : ["role", "sold", "numbers", "wins"]), [full, leader]);
  const [stepId, setStepId] = useState<StepId>(initialStep ?? "role");
  const [nudge, setNudge] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  const cur: StepId = steps.includes(stepId) ? stepId : steps[0];
  const at = steps.indexOf(cur);
  const items = keyItems(job, full);
  const doneOf = (s: StepId) => items.find((k) => k.id === s)?.done ?? false;
  const set = <K extends keyof Job>(k: K, v: Job[K]) => onChange({ ...job, [k]: v });

  const go = (s: StepId) => {
    setNudge(false);
    setStepId(s);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const last = at === steps.length - 1;
  const next = () => (last ? onClose() : go(steps[at + 1]));
  // The three things a sales CV cannot do without get one gentle question before they can be skipped.
  const skip = () => {
    if (["process", "numbers", "team"].includes(cur) && !doneOf(cur) && !nudge) return setNudge(true);
    next();
  };
  const jump = (s: StepId) => {
    if (!steps.includes(s)) setFull(true);
    go(s);
  };

  const nudgeText: Partial<Record<StepId, string>> = {
    process: "Your sales processes are a big part of a sales CV. Even tapping two or three helps.",
    numbers: "Your CV is much weaker without a revenue number. A rough figure or a range is fine.",
    team: "Team size is the first thing a reader looks for in a leadership role. A rough number is fine.",
  };

  return (
    <div ref={top} className="grid gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> All my jobs</button>
          <span className="text-xs font-semibold text-slate-400">Job {index + 1} of {total}</span>
        </div>

        <div>
          <div className="flex gap-1.5" role="tablist" aria-label="Steps for this job">
            {steps.map((s, i) => (
              <button key={s} role="tab" aria-selected={s === cur} aria-label={TEXT[s].title} type="button" onClick={() => go(s)} className="group flex-1 py-2">
                <span className={`block h-1.5 rounded-full transition-all ${s === cur ? "bg-slate-950" : doneOf(s) ? "bg-emerald-500" : i < at ? "bg-slate-400" : "bg-slate-200"}`} />
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-400">Step {at + 1} of {steps.length}</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight text-slate-950">{TEXT[cur].title}</h1>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-600">{TEXT[cur].sub}</p>
        </div>

        <div className="lg:hidden">
          <button type="button" onClick={() => setShowPreview(!showPreview)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-[13.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-slate-200">
            <span>See how this job will read</span>
            <span className="flex items-center gap-2 text-xs text-slate-400">{items.filter((k) => k.done).length} of {items.length} key details<ChevronDown className={`h-4 w-4 transition ${showPreview ? "rotate-180" : ""}`} /></span>
          </button>
          {showPreview && <div className="cv-in mt-2"><Preview job={job} full={full} onJump={jump} /></div>}
        </div>

        <Reveal id={cur} className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-7">
          {cur === "role" && <RoleStep job={job} set={set} onChange={onChange} />}
          {cur === "sold" && <SoldStep job={job} set={set} />}
          {cur === "process" && <ProcessStep job={job} set={set} />}
          {cur === "numbers" && <NumbersStep job={job} onChange={onChange} />}
          {cur === "team" && <TeamStep job={job} set={set} />}
          {cur === "wins" && <WinsStep job={job} set={set} />}
          {cur === "more" && <MoreStep job={job} set={set} />}
        </Reveal>

        {nudge && nudgeText[cur] && (
          <div className="cv-in space-y-3 rounded-2xl bg-amber-50 p-4">
            <p className="flex gap-2.5 text-[14px] leading-relaxed text-amber-900"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />{nudgeText[cur]}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setNudge(false)} className="rounded-xl bg-slate-950 px-4 py-2 text-[13.5px] font-semibold text-white">Add it now</button>
              <button type="button" onClick={next} className="rounded-xl px-4 py-2 text-[13.5px] font-semibold text-amber-900 hover:bg-amber-100">Skip anyway</button>
            </div>
          </div>
        )}

        {!full && cur === "wins" && (
          <button type="button" onClick={() => setFull(true)} className="text-[13px] font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-950">Add the full detail for this job (processes, team, more)</button>
        )}
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-[168px]"><Preview job={job} full={full} onJump={jump} /></div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <button type="button" onClick={() => (at === 0 ? onClose() : go(steps[at - 1]))} className="rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-600 hover:bg-slate-100">Back</button>
          <div className="flex items-center gap-2">
            {!last && !doneOf(cur) && <button type="button" onClick={skip} className="rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-500 hover:bg-slate-100">Skip</button>}
            <button type="button" onClick={next} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98]">
              {last ? "Finish this job" : "Next"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
