"use client";

import { useState } from "react";
import Link from "next/link";
import { Zap, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// The single-field on-ramp to Priority Applicant for a visitor who arrives
// with no known candidateId -- job page teaser, nav pill, a shared link,
// whatever. Previously this dead-ended into "log in or go build a full
// profile first," which for a brand-new visitor meant a multi-step form
// before they could even reach checkout. That's not how Quick Apply works
// anywhere else on this site, and it shouldn't be how paying for a feature
// works either.
//
// Under the hood this reuses candidate-submit's existing quick_apply /
// submit_candidate RPCs, which have always accepted an email-only payload
// (they create a minimal "lead"-stage candidate row when that's all they're
// given -- see submit_candidate/quick_apply in Postgres: full_name, phone,
// resume etc. are all nullable, only email is required). So:
//  - Email belongs to an existing candidate -> their existing profile is
//    reused as-is, no data is overwritten with blanks.
//  - Email is brand new -> a minimal lead record is created on the spot,
//    just enough for Priority credits (and, with a mandateId, an actual
//    application) to attach to. No resume, no phone, no long form.
// Either way this resolves to a candidateId in one round trip and the
// caller can go straight into the pack picker.
export default function PriorityEmailGate({
  mandateId,
  onReady,
}: {
  mandateId?: string | null;
  onReady: (candidateId: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/candidate-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: { email: trimmed },
          ...(mandateId ? { mandateId } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.candidateId) {
        throw new Error(json?.error ?? "Something went wrong. Please try again.");
      }
      onReady(json.candidateId as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm text-center">
      <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
        <Zap className="h-3.5 w-3.5" /> Priority Applicant
      </span>
      <h1 className="text-xl font-bold text-slate-950">One field, then checkout</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter your email to activate Priority credits on your profile{mandateId ? " and flag this application" : ""}
        {" "}— we&apos;ll take you straight to payment next.
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-2.5 text-left">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="email"
            required
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full gap-2">
          <Zap className="h-4 w-4" />
          {submitting ? "One sec…" : "Continue to payment"}
        </Button>
      </form>
      <p className="mt-4 text-xs text-slate-400">
        Already have an account?{" "}
        <Link href={`/candidate-login?returnTo=${encodeURIComponent("/priority-applicant")}`} className="font-medium text-slate-600 hover:underline">
          Log in
        </Link>{" "}
        instead.
      </p>
    </div>
  );
}
