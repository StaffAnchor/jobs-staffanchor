"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { computeProfileScore, PROFILE_SCORE_TIER_META, type ScoreCandidateRow } from "@/modules/candidate-portal/profile-score";

// Naukri (and every other persistent-session job site) recognizes a signed-in
// visitor the moment they land on the site again -- no re-typing an email,
// no re-filling a form, session just survives a closed tab / browser
// relaunch. Our Supabase client already persists sessions the same way
// (see lib/supabaseClient.ts); what was missing was actually *using* that
// signal on the job Apply flow. Previously every visitor, signed in or not,
// hit the same anonymous ApplyForm -- which, after the "hard block on
// existing email" change, meant a signed-in candidate typing their own
// (already-registered) email would get told to go log in, while they were
// already logged in. This component is the fix: jobs/[id]/page.tsx renders
// it instead of ApplyForm whenever a real Supabase session is present.
export default function SignedInApplyCard({
  mandateId,
  mandateTitle,
}: {
  mandateId: string;
  mandateTitle?: string;
}) {
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<(ScoreCandidateRow & { id: string; full_name: string | null }) | null>(
    null
  );
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: candidateId, error: rpcError } = await supabase.rpc("get_or_create_my_candidate_profile");
        if (rpcError || !candidateId) throw new Error(rpcError?.message ?? "Could not load your profile.");
        const { data, error: fetchError } = await supabase.from("candidates").select("*").eq("id", candidateId).single();
        if (fetchError || !data) throw new Error(fetchError?.message ?? "Could not load your profile.");
        if (cancelled) return;
        setCandidate(data as ScoreCandidateRow & { id: string; full_name: string | null });

        // Best-effort -- reuses the same public lookup ApplyForm's anonymous
        // path uses, just fed the email we already know from the session
        // instead of one typed into a field.
        if (data.email) {
          try {
            const res = await fetch("/api/candidate-lookup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: data.email, mandateId }),
            });
            const json = await res.json().catch(() => ({}));
            if (!cancelled) setAlreadyApplied(!!json.alreadyApplied);
          } catch {
            // best-effort only
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Something went wrong loading your profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mandateId]);

  async function handleApply() {
    if (!candidate?.email) return;
    setApplying(true);
    setError(null);
    try {
      const res = await fetch("/api/candidate-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: { email: candidate.email }, mandateId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Something went wrong. Please try again.");
      setApplied(true);
      toast.success("You're all set -- your profile has been submitted for this role.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setApplying(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <p className="py-8 text-center text-sm text-red-600">{error ?? "Could not load your profile."}</p>
    );
  }

  const { score, tier, missing } = computeProfileScore(candidate);
  const meta = PROFILE_SCORE_TIER_META[tier];
  const firstName = candidate.full_name?.split(" ")[0] || "there";

  if (applied || alreadyApplied) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
        <h2 className="text-xl font-bold text-slate-950">
          {applied ? `Thanks, ${firstName} — you're all set` : `You've already applied, ${firstName}`}
          {mandateTitle ? ` for ${mandateTitle}` : ""}.
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          A StaffAnchor recruiter will review your profile and reach out if there&apos;s a fit. You can update your
          profile any time from{" "}
          <Link href="/candidate-portal" className="font-medium text-blue-700 hover:underline">
            My Account
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
        missing.length > 0 ? `border-t-4 ${meta.accentBorder}` : ""
      }`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Signed in</p>
            <h2 className="mt-0.5 text-lg font-semibold text-slate-900">
              Apply as {candidate.full_name || "yourself"}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${meta.chipBg} ${meta.chipText}`}>
              {tier}
            </span>
            <div
              className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(${meta.ring} ${score * 3.6}deg, #e2e8f0 0deg)` }}
            >
              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white">
                <span className="text-sm font-bold text-slate-900">{score}%</span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-sm text-slate-500">
          We&apos;ll submit your existing StaffAnchor profile for {mandateTitle ? `${mandateTitle}` : "this role"} —
          no need to fill anything out again.
        </p>

        {missing.length > 0 && (
          <div className={`mt-4 rounded-xl border-l-4 ${meta.accentBorder} ${meta.accentBg} p-3.5`}>
            <p className={`text-sm font-bold ${meta.chipText}`}>{meta.blurb}</p>
            <p className="mt-1.5 text-xs leading-5 text-slate-600">
              <span className="font-semibold text-slate-700">Still missing:</span> {missing.slice(0, 3).join(", ")}
              {missing.length > 3 ? `, +${missing.length - 3} more` : ""}.
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            <LogOut className="h-3 w-3" /> Not you? Log out
          </button>
          <div className="flex items-center gap-2">
            {missing.length > 0 && (
              <Link href="/candidate-portal">
                <Button type="button" variant="outline" className="px-4">
                  Complete my profile
                </Button>
              </Link>
            )}
            <Button type="button" onClick={handleApply} disabled={applying} className="px-6">
              {applying ? "Applying..." : "Apply for this role"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
