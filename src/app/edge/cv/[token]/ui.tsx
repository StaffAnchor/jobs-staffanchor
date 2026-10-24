"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";

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
