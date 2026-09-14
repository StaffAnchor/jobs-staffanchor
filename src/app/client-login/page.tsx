"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") codeInputRef.current?.focus();
  }, [step]);

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);

    // Client portal accounts are provisioned by a recruiter invite, never
    // self-serve -- so before sending a code we check client_invite_email_exists()
    // (a SECURITY DEFINER RPC mirroring candidate_email_exists) for an
    // unconsumed client_invites row matching this email. This mirrors the
    // check-then-create pattern already used in candidate-login/page.tsx and
    // EmailGate.tsx: shouldCreateUser: true only fires once we've confirmed
    // there's a real invite, rather than either (a) shouldCreateUser: false,
    // which would silently dead-end every invited client whose first sign-in
    // has no pre-existing auth.users row (the exact bug already fixed for
    // candidates in commit 828b3e2), or (b) blindly flipping to
    // shouldCreateUser: true with no upstream check at all, which would let
    // signInWithOtp create an auth account for literally any typed-in email.
    // get_or_create_my_client_user() still does the real gating on data
    // access downstream (an unconsumed client_invites row for the
    // authenticated user's email), so this is a defense-in-depth UX fix, not
    // the only thing standing between an uninvited email and the portal.
    const { data: invited, error: lookupError } = await supabase.rpc(
      "client_invite_email_exists",
      { p_email: email.trim() }
    );
    if (lookupError) {
      setSending(false);
      setError(lookupError.message);
      return;
    }
    if (!invited) {
      setSending(false);
      setError(
        "We don't have client portal access set up for this email yet. Please contact your StaffAnchor recruiter."
      );
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
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
    router.push("/client-portal");
  }

  async function handleResend() {
    setError(null);
    setSending(true);
    // shouldCreateUser: true is safe here unconditionally -- handleResend
    // only runs from the "code" step, which is only reachable after
    // handleSendCode already passed the client_invite_email_exists() check
    // above for this same email.
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (error) setError(error.message);
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.300)_1px,transparent_0)] bg-[length:22px_22px] opacity-40" />
      <div className="pointer-events-none absolute -top-24 -left-16 -z-10 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 -z-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />

      <Card className="border-slate-200/80 shadow-lg shadow-slate-200/60 backdrop-blur-sm">
        <CardContent className="p-6">
          {step === "code" ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Client Portal</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Enter your code</h1>
              <p className="mt-1 text-sm text-slate-500">
                We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>.
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
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Client Portal</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Sign in to review candidates</h1>
              <p className="mt-1 text-sm text-slate-500">
                No password required — enter the email your StaffAnchor recruiter set you up with, and we&apos;ll
                send you a one-time code.
              </p>
              <form onSubmit={handleSendCode} className="mt-5 space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    required
                    placeholder="you@company.com"
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
                Don&apos;t have access yet? Ask your StaffAnchor recruiter to invite you.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
