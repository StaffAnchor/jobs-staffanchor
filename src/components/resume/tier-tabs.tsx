"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, RefreshCw } from "lucide-react";

export type Tier = {
  key: string;
  label: string;
  band: string;
  price: string;
  headline: string;
  sub: string;
  revisions: string;
  finalDelivery: string;
  included: string[];
};

// The three plans, one tab each. The plan and price follow years of experience only; the order page works the plan
// out from the years entered.
export default function TierTabs({ tiers, orderHref }: { tiers: Tier[]; orderHref: string }) {
  const [active, setActive] = useState(tiers[0].key);
  const t = tiers.find((x) => x.key === active) ?? tiers[0];
  return (
    <div>
      <div role="tablist" aria-label="Career stage" className="flex flex-wrap justify-center gap-2">
        {tiers.map((x) => (
          <button
            key={x.key}
            role="tab"
            aria-selected={x.key === active}
            onClick={() => setActive(x.key)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${x.key === active ? "bg-[#12131A] text-white shadow-md" : "border border-slate-300 bg-white text-slate-700 hover:border-slate-900"}`}
          >
            {x.label} <span className="font-normal opacity-70">· {x.band}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h3 className="font-(family-name:--font-poppins) text-2xl font-semibold leading-snug tracking-tight">{t.headline}</h3>
          <p className="mt-2 text-slate-600">{t.sub}</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {t.included.map((i) => (
              <li key={i} className="flex gap-2.5 text-[15px] text-slate-700">
                <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" /> <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="flex flex-col rounded-3xl border-2 border-indigo-500 bg-white p-8 shadow-xl shadow-indigo-900/10">
          <p className="text-sm font-medium text-slate-500">{t.label} · {t.band}</p>
          <p className="mt-2 font-(family-name:--font-poppins) text-5xl font-semibold tracking-tight">{t.price}</p>
          <p className="text-sm text-slate-500">incl. GST, one-time</p>
          <ul className="mt-6 flex-1 space-y-3 text-[15px] text-slate-700">
            <li className="flex gap-2.5"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" /> First draft 3 working days after your details</li>
            <li className="flex gap-2.5"><Clock className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" /> Final resume in {t.finalDelivery}</li>
            <li className="flex gap-2.5"><RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" /> {t.revisions} included</li>
            <li className="flex gap-2.5"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-indigo-500" /> Word and PDF</li>
          </ul>
          <Link href={orderHref} className="group mt-7 inline-flex items-center justify-center rounded-xl bg-[#12131A] px-6 py-4 text-[15px] font-semibold text-white transition hover:bg-indigo-600">
            Order my resume <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-3 text-center text-xs text-slate-500">Your plan is set by your years of experience.</p>
        </aside>
      </div>
    </div>
  );
}
