"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Heart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  loadJobMatches,
  loadSavedJobIds,
  MATCH_TIER_CLASSES,
  MATCH_TIER_LABEL,
  matchTier,
  toggleSavedJob,
  type JobMatch,
} from "./personal";

// Sits above the apply card on a job page: how well this role fits the
// signed-in candidate (with the reasons) and a save button. Signed-out
// visitors just get the save prompt.
export default function JobMatchBanner({ mandateId }: { mandateId: string }) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [match, setMatch] = useState<JobMatch | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled) return;
      setSignedIn(!!data.user);
      if (!data.user) return;
      try {
        const [matches, ids] = await Promise.all([loadJobMatches(), loadSavedJobIds()]);
        if (cancelled) return;
        setMatch(matches.find((m) => m.mandate_id === mandateId) ?? null);
        setSaved(ids.includes(mandateId));
      } catch {
        // Bonus only.
      }
    });
    return () => {
      cancelled = true;
    };
  }, [mandateId]);

  async function handleSave() {
    if (!signedIn) {
      router.push(`/candidate-login?returnTo=/jobs/${mandateId}`);
      return;
    }
    const next = !saved;
    setSaved(next);
    try {
      await toggleSavedJob(mandateId);
    } catch {
      setSaved(!next);
      toast.error("Couldn't update your saved roles. Please try again.");
    }
  }

  const tier = match ? matchTier(match.score) : null;

  return (
    <div className="mx-auto mt-6 flex max-w-[1400px] flex-wrap items-center gap-3 px-4 sm:px-6 lg:px-8">
      {tier && match && !match.applied && (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 px-5 py-3.5">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${MATCH_TIER_CLASSES[tier]}`}>
            {MATCH_TIER_LABEL[tier]} · {match.score}%
          </span>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-emerald-900">
            {match.reasons.slice(0, 4).map((r) => (
              <li key={r} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={handleSave}
        aria-pressed={saved}
        className="ml-auto inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:border-slate-300"
      >
        <Heart className={`h-4 w-4 ${saved ? "fill-rose-500 text-rose-500" : ""}`} />
        {saved ? "Saved" : "Save role"}
      </button>
    </div>
  );
}
