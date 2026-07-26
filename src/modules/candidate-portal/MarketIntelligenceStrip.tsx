"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Briefcase, Users, IndianRupee } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { categoryLabel } from "@/modules/jobs/api";

type Snapshot = {
  open_roles: number;
  peer_count: number;
  avg_expected_ctc: number;
};

// A first, deliberately light touch of "market intelligence" on the portal
// home -- real, aggregate numbers (never another candidate's identity) that
// answer the question every candidate silently has: "is what I'm asking
// for in the right range, and is anyone actually hiring for this right
// now?" Sits above Profile Score since it's the thing worth glancing at
// before the completion nudge.
export default function MarketIntelligenceStrip({
  category,
  subDomain,
}: {
  category: string | null;
  subDomain: string | null;
}) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!category) return;
    supabase
      .rpc("get_market_snapshot", { p_category: category, p_sub_domain: subDomain })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setSnapshot(data as Snapshot);
      });
    return () => {
      cancelled = true;
    };
  }, [category, subDomain]);

  if (!category || !snapshot) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 to-slate-800 p-5 text-white shadow-sm">
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
        <TrendingUp className="h-3.5 w-3.5" /> Market snapshot — {categoryLabel(category)}
        {subDomain ? ` · ${subDomain}` : ""}
      </p>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="flex items-center gap-1 text-lg font-bold">
            <Briefcase className="h-4 w-4 text-slate-400" /> {snapshot.open_roles}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Open roles right now</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-lg font-bold">
            <Users className="h-4 w-4 text-slate-400" /> {snapshot.peer_count}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Candidates in this category</p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-lg font-bold">
            <IndianRupee className="h-4 w-4 text-slate-400" />
            {snapshot.avg_expected_ctc ? `${snapshot.avg_expected_ctc}L` : "—"}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">Avg. expected fixed CTC</p>
        </div>
      </div>
    </div>
  );
}
