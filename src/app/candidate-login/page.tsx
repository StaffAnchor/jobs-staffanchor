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
  // openings" link after a Quick Apply submission -- read off window.location
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
                Haven&apos;t applied yet?{" "}
                <Link href="/jobs" className="text-blue-600 hover:underline">
                  Browse open roles
                </Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
