"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";

// Small reusable multi-select for long option lists (industries, languages)
// on the client portal's self-service mandate-request form -- a search box
// narrows a scrollable checkbox list, selected values show as removable
// chips above it. Mirrors the same pattern used in the CRM and on the public
// marketing-site mandate-request form.
export default function MultiSelectChips({
  options,
  selected,
  onChange,
  placeholder = "Search...",
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  function toggle(value: string) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  const labelFor = (value: string) => options.find((o) => o.value === value)?.label ?? value;

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] text-slate-700"
            >
              {labelFor(v)}
              <button type="button" onClick={() => toggle(v)} className="text-slate-400 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="mb-1.5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500"
      />
      <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-md border border-slate-200 p-2">
        {filtered.length === 0 && <p className="px-1 py-1 text-[12px] text-slate-400">No matches.</p>}
        {filtered.map((o) => (
          <label key={o.value} className="flex items-center gap-2 px-1 py-0.5 text-[13px] text-slate-700">
            <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
