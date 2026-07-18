"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function CandidateLoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefills from ?email=... when arriving via the "sign up for future
  // openings" link after an Apply submission, or via the "Login" button on
  // the already-registered block in ApplyForm -- read off window.location
  // directly (rather than useSearchParams) so this plain client component
  // doesn't need a Suspense boundary for static export.
  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get("email");
    if (prefill) setEmail(prefill);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);

    // Magic-link sign-in has no separate "sign up" step -- Supabase will
    // happily create a brand-new account for any email typed here. So before
    // ever sending a link, confirm a candidate record already exists for
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

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/candidate-portal`,
      },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <Card>
        <CardContent className="p-6">
          {sent ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
              <h1 className="text-lg font-semibold text-slate-900">Check your email</h1>
              <p className="mt-2 text-sm text-slate-500">
                We sent a sign-in link to <span className="font-medium text-slate-700">{email}</span>. Open it on
                this device to manage your profile — no password needed.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Candidate Portal</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Manage your profile</h1>
              <p className="mt-1 text-sm text-slate-500">
                No password required — enter your email and we&apos;ll send you a sign-in link.
              </p>
              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
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
                  {sending ? "Sending link..." : "Send me a sign-in link"}
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
