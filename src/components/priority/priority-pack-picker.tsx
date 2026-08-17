"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIORITY_PACKS } from "@/lib/priority-plans";
import { usePriorityCheckout, type PurchaseResult } from "./use-priority-checkout";

// Shared three-tier pack picker + purchase button, used on the dedicated
// /priority-applicant page and dropped inline wherever else a candidate can
// buy (apply-flow upsell, confirmation-page card). Keeping it as one
// component means the pricing UI can't drift between placements.
export default function PriorityPackPicker({
  candidateId,
  mandateId,
  defaultTier = 1,
  onPurchased,
  compact = false,
}: {
  candidateId: string;
  mandateId?: string | null;
  defaultTier?: 1 | 2 | 3;
  onPurchased?: (result: PurchaseResult) => void;
  compact?: boolean;
}) {
  const [tier, setTier] = useState<1 | 2 | 3>(defaultTier);
  const { purchase, status, error } = usePriorityCheckout();

  async function handlePay() {
    const result = await purchase({ candidateId, tier, mandateId });
    if (result) onPurchased?.(result);
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className={`grid grid-cols-3 gap-2 ${compact ? "" : "sm:gap-3"}`}>
        {PRIORITY_PACKS.map((pack) => (
          <button
            key={pack.tier}
            type="button"
            onClick={() => setTier(pack.tier)}
            className={`rounded-xl border px-3 py-3 text-center transition ${
              tier === pack.tier
                ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <p className="text-[11px] font-medium text-slate-500">{pack.label}</p>
            <p className="mt-1 text-lg font-bold text-slate-900">₹{pack.amountRupees}</p>
          </button>
        ))}
      </div>

      <Button onClick={handlePay} disabled={status === "loading"} className="w-full gap-2">
        <Zap className="h-4 w-4" />
        {status === "loading" ? "Opening checkout…" : `Pay ₹${PRIORITY_PACKS.find((p) => p.tier === tier)?.amountRupees}`}
      </Button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <p className="text-[11px] leading-relaxed text-slate-400">
        Priority Applicant flags your application for the recruiter to review first — it doesn&apos;t guarantee an
        interview or outcome. Credits are valid for 90 days and can be used on any application, now or later.
      </p>
    </div>
  );
}
