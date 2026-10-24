"use client";

import { useState } from "react";
import { Check, Minus, Plus, X } from "lucide-react";

// Small building blocks for the Sales CV form: everything is a tap or a short field, never a wall of inputs.

export const inputCls = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5";

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-[13px] font-semibold text-slate-800">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  );
}

export function Card({ title, sub, children }: { title?: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:p-7">
      {title && <h2 className="text-[18px] font-bold leading-snug text-slate-950">{title}</h2>}
      {sub && <p className="mt-1 text-sm leading-relaxed text-slate-500">{sub}</p>}
      <div className={`${title || sub ? "mt-5" : ""} space-y-5`}>{children}</div>
    </section>
  );
}

const chipBase = "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition active:scale-[0.97]";
const chipOn = "border-slate-950 bg-slate-950 text-white";
const chipOff = "border-slate-200 bg-white text-slate-700 hover:border-slate-400";

/** Pick several. Anything not in the list can be added with "Add your own". */
export function MultiChips({ options, value, onChange, own = true }: { options: string[]; value: string[]; onChange: (v: string[]) => void; own?: boolean }) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const extra = value.filter((v) => !options.includes(v));
  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  const add = () => {
    const t = draft.trim().slice(0, 60);
    if (t && !value.includes(t)) onChange([...value, t]);
    setDraft("");
    setAdding(false);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {[...options, ...extra].map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" onClick={() => toggle(o)} className={`${chipBase} ${on ? chipOn : chipOff}`} aria-pressed={on}>
            {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            {o}
          </button>
        );
      })}
      {own &&
        (adding ? (
          <span className="inline-flex items-center gap-1">
            <input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} onBlur={add} placeholder="Type and press Enter" className="w-44 rounded-full border border-slate-300 px-3.5 py-2 text-[13.5px] outline-none focus:border-slate-900" />
          </span>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className={`${chipBase} border-dashed border-slate-300 text-slate-500 hover:border-slate-500`}>
            <Plus className="h-3.5 w-3.5" /> Add your own
          </button>
        ))}
    </div>
  );
}

/** Pick one. Tapping the chosen one again clears it, so nothing is ever forced. */
export function PickChips({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  const all = value && !options.includes(value) ? [...options, value] : options;
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((o) => {
        const on = value === o;
        return (
          <button key={o} type="button" onClick={() => onChange(on ? "" : o)} className={`${chipBase} ${on ? chipOn : chipOff}`} aria-pressed={on}>
            {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

/** A short either/or control, for things like Actual or approximate. */
export function Seg<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex w-full rounded-xl bg-slate-100 p-1 sm:w-auto">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={`flex-1 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition sm:flex-none ${value === o.value ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function NumInput({ value, onChange, placeholder, step = "any", className = "" }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string; step?: string; className?: string }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step={step}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
      className={`${inputCls} ${className}`}
    />
  );
}

export function Select({ value, onChange, options, placeholder = "Choose", className = "" }: { value: string; onChange: (v: string) => void; options: string[]; placeholder?: string; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} ${className}`}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o || "none"} value={o}>
          {o || "(no unit)"}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-center gap-3 text-left text-[14px] text-slate-700" aria-pressed={on}>
      <span className={`flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition ${on ? "bg-slate-950" : "bg-slate-300"}`}>
        <span className={`h-5 w-5 rounded-full bg-white shadow transition ${on ? "translate-x-4" : ""}`} />
      </span>
      {children}
    </button>
  );
}

export function IconButton({ onClick, label, children }: { onClick: () => void; label: string; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
      {children ?? <X className="h-4 w-4" />}
    </button>
  );
}

// ---- v2 building blocks: bigger, friendlier, one idea per screen ----

/** Fades a screen in when it changes, so moving between steps feels like turning a page. */
export function Reveal({ id, children, className = "" }: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <div key={id} className={`cv-in ${className}`}>
      {children}
    </div>
  );
}

export const CV_CSS = `@keyframes cvIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}.cv-in{animation:cvIn .32s cubic-bezier(.2,.7,.2,1) both}@media (prefers-reduced-motion:reduce){.cv-in{animation:none}}`;

/** A big tap target with an icon. Selecting it ticks it; the label says what it is. */
export function Tile({ on, onClick, icon, label, sub }: { on: boolean; onClick: () => void; icon?: React.ReactNode; label: string; sub?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`group relative flex items-center gap-3 rounded-2xl border p-3.5 text-left transition active:scale-[0.98] ${on ? "border-slate-950 bg-slate-950 text-white shadow-md" : "border-slate-200 bg-white text-slate-800 hover:border-slate-400"}`}>
      {icon && <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${on ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600"}`}>{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold leading-snug">{label}</span>
        {sub && <span className={`mt-0.5 block text-xs leading-snug ${on ? "text-white/70" : "text-slate-500"}`}>{sub}</span>}
      </span>
      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${on ? "border-white bg-white text-slate-950" : "border-slate-300 text-transparent"}`}>
        <Check className="h-3 w-3" strokeWidth={3.5} />
      </span>
    </button>
  );
}

/** A number with minus and plus and one-tap common sizes, for team size and similar. */
export function BigNumber({ value, onChange, quick = [], label }: { value: number | null; onChange: (v: number | null) => void; quick?: number[]; label: string }) {
  const n = value ?? 0;
  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Less ${label}`} onClick={() => onChange(Math.max(0, n - 1))} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-900 active:scale-95">
          <Minus className="h-5 w-5" />
        </button>
        <input
          inputMode="numeric"
          aria-label={label}
          value={value ?? ""}
          placeholder="0"
          onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Math.round(Number(e.target.value.replace(/\D/g, "")) || 0)))}
          className="h-12 w-24 rounded-2xl border border-slate-200 bg-white text-center text-[22px] font-bold text-slate-950 outline-none focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
        />
        <button type="button" aria-label={`More ${label}`} onClick={() => onChange(n + 1)} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-900 active:scale-95">
          <Plus className="h-5 w-5" />
        </button>
      </div>
      {quick.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => onChange(q)} className={`rounded-full border px-3 py-1 text-[12.5px] font-semibold transition ${value === q ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 text-slate-600 hover:border-slate-500"}`}>
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A circular score. Fills as the details a sales CV needs come in. */
export function Ring({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const tone = pct >= 80 ? "#059669" : pct >= 50 ? "#0f172a" : "#d97706";
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} aria-label={`${pct}% complete`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={4} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} style={{ transition: "stroke-dashoffset .6s ease, stroke .3s" }} />
      </svg>
      <span className="absolute text-[11px] font-bold text-slate-900">{pct}</span>
    </span>
  );
}

// ---- dates: month and year dropdowns, which work the same on every phone and browser ----

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 46 }, (_, i) => String(THIS_YEAR - i));

/** Value is YYYY-MM, or empty until both month and year are chosen. */
export function MonthYear({ value, onChange, disabled = false, label }: { value: string; onChange: (v: string) => void; disabled?: boolean; label: string }) {
  const [y0, m0] = value ? value.split("-") : ["", ""];
  const [y, setY] = useState(y0);
  const [m, setM] = useState(m0);
  // Follow the value when it changes from outside (for example when a CV is read), but keep a half-picked date while it is being chosen.
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    setSeen(value);
    setY(y0);
    setM(m0);
  }
  const emit = (ny: string, nm: string) => {
    setY(ny);
    setM(nm);
    onChange(ny && nm ? `${ny}-${nm}` : "");
  };
  const cls = `${inputCls} !px-2.5 disabled:bg-slate-50 disabled:text-slate-400`;
  return (
    <div className="flex gap-2" role="group" aria-label={label}>
      <select aria-label={`${label}, month`} disabled={disabled} value={m} onChange={(e) => emit(y, e.target.value)} className={cls}>
        <option value="">Month</option>
        {MONTHS.map((n, i) => <option key={n} value={String(i + 1).padStart(2, "0")}>{n}</option>)}
      </select>
      <select aria-label={`${label}, year`} disabled={disabled} value={y} onChange={(e) => emit(e.target.value, m)} className={cls}>
        <option value="">Year</option>
        {YEARS.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
      </select>
    </div>
  );
}
