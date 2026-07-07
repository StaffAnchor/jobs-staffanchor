"use client";

import { useState } from "react";
import { Mail, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

export default function ClientLoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/client-portal`,
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
                this device to view your open roles and shortlists — no password needed.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Client Portal</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">Sign in to review candidates</h1>
              <p className="mt-1 text-sm text-slate-500">
                No password required — enter the email your StaffAnchor recruiter set you up with, and we&apos;ll
                send you a sign-in link.
              </p>
              <form onSubmit={handleSubmit} className="mt-5 space-y-3">
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
                  {sending ? "Sending link..." : "Send me a sign-in link"}
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
