"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import SignInPanel from "@/modules/auth/SignInPanel";

// Email-first entry for the job Apply flow and Register: ask for the email
// FIRST and branch instantly -- an existing candidate goes straight to
// sign-in (email code by default, password optional; nothing to re-fill), a
// brand-new one goes straight into the short intake form, pre-filled with the
// email they just typed so they never type it twice. A signed-in visitor never
// sees this at all (the caller renders SignedInApplyCard / redirects instead).
export default function EmailGate({
  mandateId,
  mandateTitle,
  initialEmail = "",
  onNewCandidate,
}: {
  mandateId?: string;
  mandateTitle?: string;
  initialEmail?: string;
  // Called once we've confirmed this email has no existing profile --
  // parent swaps to the intake form, pre-filled with this email.
  onNewCandidate: (email: string) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<{ firstName: string | null; alreadyApplied: boolean } | null>(null);

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

  if (existing) {
    // Return straight to this job (not a generic /candidate-portal) so a
    // returning candidate lands on Easy Apply with one click left.
    const destination = mandateId ? `/jobs/${mandateId}` : "/candidate-portal";
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <SignInPanel
          email={email.trim()}
          onSignedIn={() => router.push(destination)}
          onBack={() => {
            setExisting(null);
            setEmail("");
          }}
          backLabel="Not you? Use a different email"
          eyebrow="Welcome back"
          title={existing.firstName ? `Hi ${existing.firstName}, check your email` : "Check your email"}
          blurb={
            <>
              You already have a profile with us.{" "}
              {existing.alreadyApplied
                ? `You've already applied to ${mandateTitle ?? "this role"} — sign in to check your status.`
                : `Sign in and we'll ${mandateTitle ? `submit it for ${mandateTitle}` : "load it"} in one click. We're sending a 6-digit code to ${email.trim()}.`}
            </>
          }
        />
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
            autoComplete="email"
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
