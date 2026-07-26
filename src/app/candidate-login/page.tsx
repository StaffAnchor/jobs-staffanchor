"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function CandidateLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Prefills from ?email=... when arriving via the "sign up for future
  // openings" link after an Apply submission, or via the "Login" button on
  // the already-registered block in ApplyForm -- read off window.location
  // directly (rather than useSearchParams) so this plain client component
  // doesn't need a Suspense boundary for static export. ?returnTo=... carries
  // "which job were you trying to apply to" so, after verifying, they land
  // back there instead of a generic dashboard.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("email");
    if (prefill) setEmail(prefill);
    const rt = params.get("returnTo");
    if (rt && rt.startsWith("/")) setReturnTo(rt);
  }, []);

  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);

    // Email-OTP sign-in has no separate "sign up" step -- Supabase will
    // happily create a brand-new account for any email typed here. So before
    // ever sending a code, confirm a candidate record already exists for
    // this email (from Build Your Profile, Apply, or a recruiter-created
    // profile). This is the login-side half of the same "no ambiguity" rule
    // as ApplyForm's email gate: no profile on file -> no account, no portal
    // access -- just a plain message pointing them at applying first.
    const { data: exists, error: checkError } = await supabase.rpc("candidate_email_exists", {
      p_email: email.trim(),
    });
    if (checkError) {
      setSending(false);
      setError("Something went wrong checking that email. Please try again.");
      return;
    }
    if (!exists) {
      setSending(false);
      setError(
        "We don't have a profile on file for this email yet. Register or apply to an open role first, then come back here to log in."
      );
      return;
    }

    // shouldCreateUser: false -- we've already confirmed a candidate record
    // (and its linked auth user) exists, so this call only ever sends a code
    // for an existing account, never silently provisions a new one.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 6) return;
    setVerifying(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setVerifying(false);
    if (error) {
      setError("That code didn't work — check it and try again, or request a new one.");
      return;
    }
    router.push(returnTo ?? "/candidate-portal");
  }

  async function handleResend() {
    setError(null);
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false },
    });
    setSending(false);
    if (error) setError(error.message);
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center overflow-hidden px-4 py-12 sm:px-6">
      {/* Soft textured backdrop -- two muted color blooms behind a subtle dot
          grid, echoing the same treatment used on the homepage hero, so the
          sign-in moment feels like part of the same product rather than a
          bare utilitarian form. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.300)_1px,transparent_0)] bg-[length:22px_22px] opacity-40" />
      <div className="pointer-events-none absolute -top-24 -left-16 -z-10 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 -z-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

      <Card className="border-slate-200/80 shadow-lg shadow-slate-200/60 backdrop-blur-sm">
        <CardContent className="p-6">
          {step === "code" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Candidate Portal</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Enter your code</h1>
              <p className="mt-1 text-sm text-slate-500">
                We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>. It expires
                shortly, so enter it here to continue.
              </p>
              <form onSubmit={handleVerifyCode} className="mt-5 space-y-3">
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
              <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setCode("");
                    setError(null);
                  }}
                  className="font-medium hover:text-slate-600"
                >
                  Use a different email
                </button>
                <button type="button" onClick={handleResend} disabled={sending} className="font-medium hover:text-slate-600">
                  {sending ? "Sending..." : "Resend code"}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Candidate Portal</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Manage your profile</h1>
              <p className="mt-1 text-sm text-slate-500">
                No password required — enter your email and we&apos;ll send you a one-time code.
              </p>
              <form onSubmit={handleSendCode} className="mt-5 space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button type="submit" disabled={sending} className="w-full">
                  {sending ? "Sending code..." : "Send me a code"}
                </Button>
              </form>
              <p className="mt-4 text-center text-xs text-slate-400">
                No profile yet?{" "}
                <Link href="/register" className="text-blue-600 hover:underline">
                  Build your profile
                </Link>{" "}
                or{" "}
                <Link href="/jobs" className="text-blue-600 hover:underline">
                  browse open roles
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
