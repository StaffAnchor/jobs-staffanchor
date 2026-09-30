"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import SignInPanel from "@/modules/auth/SignInPanel";

// One door for everyone: type your email and we work out which side of it
// you're on. A known email gets an email code straight away (or a password if
// you'd rather -- strictly optional); an unknown one is sent to the short
// registration form with the email already filled in.
export default function CandidateLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [known, setKnown] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnTo, setReturnTo] = useState<string | null>(null);

  // ?email=... arrives from welcome emails / the "already registered" hand-off;
  // ?returnTo=... carries "which page were you on" so sign-in lands back there.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("email");
    // Reads window.location, which isn't available during SSR -- so this has to
    // happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (prefill) setEmail(prefill);
    const rt = params.get("returnTo");
    if (rt && rt.startsWith("/")) setReturnTo(rt);
  }, []);

  // A visitor who's already signed in (or who just clicked the sign-in link
  // from the email and came back here authenticated) shouldn't see a login
  // form at all.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled && data.session) router.replace(returnTo ?? "/candidate-portal");
    });
    return () => {
      cancelled = true;
    };
  }, [returnTo, router]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setChecking(true);
    setError(null);
    const { data: exists, error: checkError } = await supabase.rpc("candidate_email_exists", { p_email: trimmed });
    setChecking(false);
    if (checkError) {
      setError("Something went wrong checking that email. Please try again.");
      return;
    }
    if (exists) {
      setKnown(true);
      return;
    }
    // Brand-new email -> registration, email pre-filled. Same destination the
    // "Sign up" path always had, just without an intermediate dead-end message.
    const qs = new URLSearchParams({ email: trimmed });
    if (returnTo) qs.set("returnTo", returnTo);
    router.push(`/register?${qs.toString()}`);
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,theme(colors.slate.300)_1px,transparent_0)] bg-[length:22px_22px] opacity-40" />
      <div className="pointer-events-none absolute -top-24 -left-16 -z-10 h-72 w-72 rounded-full bg-blue-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 -z-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />

      <Card className="border-slate-200/80 shadow-lg shadow-slate-200/60 backdrop-blur-sm">
        <CardContent className="p-6">
          {known ? (
            <SignInPanel
              email={email.trim()}
              onSignedIn={() => router.push(returnTo ?? "/candidate-portal")}
              onBack={() => {
                setKnown(false);
                setError(null);
              }}
            />
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Candidate Portal</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Sign in or create your profile</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter your email. We&apos;ll sign you in with a one-time code — or, if you&apos;re new, set up your
                profile in about a minute.
              </p>
              <form onSubmit={handleContinue} className="mt-5 space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button type="submit" disabled={checking} className="w-full">
                  {checking ? "Checking…" : "Continue"}
                </Button>
              </form>
              <p className="mt-4 text-center text-xs text-slate-400">
                Just looking?{" "}
                <Link href="/jobs" className="text-blue-600 hover:underline">
                  Browse current openings
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
