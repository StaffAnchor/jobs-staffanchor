"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Eye, EyeOff, KeyRound, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const RESEND_COOLDOWN_SECONDS = 45;

type Props = {
  email: string;
  // Fired once a session exists, whichever method got them there.
  onSignedIn: () => void;
  // "Use a different email" / "Skip for now" style exit, owned by the parent.
  onBack?: () => void;
  backLabel?: string;
  eyebrow?: string;
  title?: string;
  blurb?: ReactNode;
  // Post-registration verification only offers the code -- the candidate has
  // no password yet, so the password tab would just be a dead end.
  allowPassword?: boolean;
};

// The one place a returning candidate proves who they are, shared by the
// login page, the apply-flow email gate and the post-registration "confirm
// your email" step so all three behave identically. A 6-digit email code is
// the default (sent the moment the panel opens -- no extra click); a password
// is a strictly optional alternative for people who set one in My Account.
export default function SignInPanel({
  email,
  onSignedIn,
  onBack,
  backLabel = "Use a different email",
  eyebrow = "Welcome back",
  title = "Check your email",
  blurb,
  allowPassword = true,
}: Props) {
  const [mode, setMode] = useState<"code" | "password">("code");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [sentOnce, setSentOnce] = useState(false);
  const autoSentFor = useRef<string | null>(null);
  const finished = useRef(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const sendCode = useCallback(async () => {
    setSending(true);
    setError(null);
    // shouldCreateUser: true -- most candidate rows predate any Supabase Auth
    // account (recruiter-created, bulk upload, LinkedIn sourcing), so a code
    // has to be able to provision the auth user on first sign-in.
    // get_or_create_my_candidate_profile() links it back to the existing row.
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.href },
    });
    setSending(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setSentOnce(true);
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }, [email]);

  // Auto-send exactly once per email (guarded because React strict mode
  // double-invokes effects in dev, and a second send would burn the cooldown).
  useEffect(() => {
    if (autoSentFor.current === email) return;
    autoSentFor.current = email;
    // Deliberate: sending the code on mount is the whole point of this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void sendCode();
  }, [email, sendCode]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (mode === "code" && sentOnce) codeInputRef.current?.focus();
  }, [mode, sentOnce]);

  // A verified code and the SIGNED_IN event both land here -- only report once.
  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onSignedIn();
  }, [onSignedIn]);

  // The email also carries a clickable link; if it's opened in this browser
  // the session appears without the code ever being typed.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) finish();
    });
    return () => sub.subscription.unsubscribe();
  }, [finish]);

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 6) return;
    setBusy(true);
    setError(null);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (verifyError) {
      setError("That code didn't work — check it and try again, or request a new one.");
      return;
    }
    finish();
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(null);
    const { error: pwError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (pwError) {
      setError("That password doesn't match — or you haven't set one yet. Use an email code instead, it always works.");
      return;
    }
    finish();
  }

  function switchMode(next: "code" | "password") {
    setMode(next);
    setError(null);
    setCode("");
    setPassword("");
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-900">
        {mode === "password" ? "Sign in with your password" : title}
      </h2>

      {mode === "code" ? (
        <>
          <p className="mt-1.5 text-sm text-slate-500">
            {blurb ?? (
              <>
                We&apos;re sending a 6-digit code to <span className="font-medium text-slate-700">{email}</span>. Enter
                it below — or just click the link in the same email.
              </>
            )}
          </p>
          <form onSubmit={handleVerifyCode} className="mt-5 space-y-3">
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                ref={codeInputRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                required
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="pl-9 text-center text-lg font-medium tracking-[0.3em]"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" disabled={busy || code.length < 6} className="w-full">
              {busy ? "Verifying…" : "Verify & continue"}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <button type="button" onClick={sendCode} disabled={sending || cooldown > 0} className="font-medium hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60">
              {sending ? "Sending…" : cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
            {allowPassword && (
              <button type="button" onClick={() => switchMode("password")} className="inline-flex items-center gap-1 font-medium hover:text-slate-600">
                <KeyRound className="h-3 w-3" /> Use password instead
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="mt-1.5 text-sm text-slate-500">
            Signing in as <span className="font-medium text-slate-700">{email}</span>.
          </p>
          <form onSubmit={handlePassword} className="mt-5 space-y-3">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                required
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button type="submit" disabled={busy || !password} className="w-full">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <button type="button" onClick={() => switchMode("code")} className="font-medium hover:text-slate-600">
              Forgot it? Email me a code instead
            </button>
          </div>
        </>
      )}

      {onBack && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <button type="button" onClick={onBack} className="text-xs font-medium text-slate-400 hover:text-slate-600">
            {backLabel}
          </button>
        </div>
      )}
    </div>
  );
}
