"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// The Naukri-style fix: instead of opening the full multi-stage form and
// only discovering "you already have an account" after typing a matching
// email a few fields in, ask for the email FIRST and branch instantly --
// existing candidate -> straight into sign-in (no re-filling anything),
// brand-new candidate -> straight into the form, pre-filled with the email
// they just typed so they never type it twice. This is the first thing an
// anonymous visitor sees on both the job Apply flow and Register/Build Your
// Profile; a signed-in visitor never sees this at all (the caller renders
// SignedInApplyCard / redirects instead).
export default function EmailGate({
  mandateId,
  mandateTitle,
  onNewCandidate,
}: {
  mandateId?: string;
  mandateTitle?: string;
  // Called once we've confirmed this email has no existing profile --
  // parent swaps to the real ApplyForm, pre-filled with this email.
  onNewCandidate: (email: string) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<{ firstName: string | null; alreadyApplied: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [codeStep, setCodeStep] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (codeStep) codeInputRef.current?.focus();
  }, [codeStep]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/candidate-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, mandateId }),
      });
      const json = await res.json().catch(() => ({ exists: false }));
      if (json.exists) {
        setExisting({ firstName: json.firstName ?? null, alreadyApplied: !!json.alreadyApplied });
      } else {
        onNewCandidate(trimmed);
      }
    } catch {
      // Fail open -- a broken lookup shouldn't lock a brand-new candidate
      // out of registering.
      onNewCandidate(trimmed);
    } finally {
      setChecking(false);
    }
  }

  async function handleSendCode() {
    setSending(true);
    setError(null);
    try {
      // emailRedirectTo brings a clicked sign-in link back to this exact
      // page (job page or register) instead of Supabase's default Site
      // URL -- the parent already watches for a session via
      // onAuthStateChange, so this is enough for it to swap straight to
      // the signed-in view without the candidate needing to do anything
      // else once they click the link.
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: window.location.href },
      });
      if (otpError) throw new Error(otpError.message);
      setCodeStep(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 6) return;
    setVerifying(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setVerifying(false);
    if (verifyError) {
      setError("That code didn't work — check it and try again, or request a new one.");
      return;
    }
    // Return straight to this job (not a generic /candidate-portal) so a
    // returning candidate lands on Easy Apply with one click left, not a
    // dashboard that's forgotten why they came. See jobs/[id]/page.tsx's own
    // session check + SignedInApplyCard for what greets them there.
    router.push(mandateId ? `/jobs/${mandateId}` : "/candidate-portal");
  }

  if (codeStep) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Welcome back</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">Check your email</h2>
        <p className="mt-2 text-sm text-slate-500">
          We sent a sign-in link to <span className="font-medium text-slate-700">{email}</span> — click it to
          continue, or enter the 6-digit code below if that&apos;s what you got instead.
        </p>
        <form onSubmit={handleVerifyCode} className="mt-4 space-y-3">
          <div className="relative">
            <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              ref={codeInputRef}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="pl-9 tracking-[0.3em] text-center text-lg font-medium"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" disabled={verifying || code.length < 6} className="w-full">
            {verifying ? "Verifying..." : "Verify & continue"}
          </Button>
        </form>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <button
            type="button"
            onClick={() => {
              setCodeStep(false);
              setCode("");
              setError(null);
            }}
            className="font-medium hover:text-slate-600"
          >
            Use a different email
          </button>
          <button type="button" onClick={handleSendCode} disabled={sending} className="font-medium hover:text-slate-600">
            {sending ? "Sending..." : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  if (existing) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Welcome back</p>
        <h2 className="mt-1 text-lg font-semibold text-slate-900">
          {existing.firstName ? `Hi ${existing.firstName}, y` : "Y"}ou already have a profile with us
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {existing.alreadyApplied
            ? `You've already applied to ${mandateTitle ?? "this role"}. Sign in to check your status.`
            : `Sign in and we'll submit your existing profile${mandateTitle ? ` for ${mandateTitle}` : ""} in one click — no need to fill anything out again.`}
        </p>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        <div className="mt-4 flex items-center gap-2">
          <Button type="button" onClick={handleSendCode} disabled={sending} className="px-6">
            {sending ? "Sending..." : "Send me a code"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setExisting(null);
              setEmail("");
            }}
            className="text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            Not you? Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
        {mandateTitle ? `Apply for ${mandateTitle}` : "Get started"}
      </p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">What&apos;s your email?</h2>
      <p className="mt-1 text-sm text-slate-500">
        We&apos;ll check if you already have a StaffAnchor profile so you never have to fill anything out twice.
      </p>
      <form onSubmit={handleContinue} className="mt-4 space-y-3">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="email"
            required
            // No autoFocus: this card mounts far down the job detail page
            // (below the JD, "Similar roles", etc.). A newly-focused input
            // makes the browser auto-scroll it into view, which was
            // yanking every visitor straight from the job listing down to
            // this form instead of letting them land at the top of the
            // page and read the role first.
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button type="submit" disabled={checking} className="w-full">
          {checking ? "Checking..." : "Continue"}
        </Button>
      </form>
    </div>
  );
}
