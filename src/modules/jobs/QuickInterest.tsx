"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, X } from "lucide-react";
import { authHeaders } from "@/lib/auth-headers";
import { indianMobileFromInput } from "@/lib/phone";
import { posthog } from "@/lib/posthog";

// A 30-second way to raise a hand for a role without leaving the list. It goes
// through the same /api/candidate-submit route as the full form (account link,
// ownership check, welcome email), with only the three things a recruiter needs
// to call back. The full profile can follow on the next screen.
export default function QuickInterest({
  jobId,
  roleTitle,
  client,
  pipeline = false,
  onClose,
}: {
  jobId: string;
  roleTitle: string;
  client: string | null;
  pipeline?: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exists, setExists] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const digits = indianMobileFromInput(phone);
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Please enter a valid email.");
    if (!/^[6-9]\d{9}$/.test(digits)) return setError("Please enter a 10-digit Indian mobile number.");
    setBusy(true);
    try {
      const res = await fetch("/api/candidate-submit", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          mandateId: jobId,
          payload: { full_name: name.trim(), email: email.trim(), phone: digits, consent: true, profile_stage: "lead" },
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 409 && json?.code === "PROFILE_EXISTS") {
        setExists(true);
        return;
      }
      if (!res.ok) throw new Error(json?.error ?? "Something went wrong. Please try again.");
      try {
        posthog.capture("candidate_applied", { source: "jobs_list_quick_interest", mandateId: jobId });
      } catch {
        // analytics must never block the thank-you
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label="Express interest">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div className="jobs-rise relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="bg-gradient-to-br from-[#0A1630] to-[#14306b] px-6 pb-5 pt-6 text-white">
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-blue-100 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-200">Express interest · 30 seconds</p>
          <h2 className="mt-1.5 pr-8 text-xl font-extrabold leading-tight">{roleTitle}</h2>
          {client && <p className="mt-0.5 text-sm text-blue-100/90">{client}</p>}
        </div>

        {done ? (
          <div className="space-y-4 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="text-lg font-extrabold text-slate-900">You&apos;re on the list.</p>
            <p className="text-sm leading-6 text-slate-600">
              {pipeline
                ? "This is a pipeline role: we are building a shortlist for companies hiring in this space. A StaffAnchor recruiter will contact you when a matching role opens. Adding a few more details now puts you ahead in that shortlist."
                : "A StaffAnchor recruiter will call or message you about this role. Adding a few more details now makes the call faster and the shortlist more likely."}
            </p>
            <Link
              href={`/jobs/${jobId}#apply-form`}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-600/30"
            >
              Complete my profile <ArrowRight className="h-4 w-4" />
            </Link>
            <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
              Back to the roles
            </button>
          </div>
        ) : exists ? (
          <div className="space-y-4 p-6 text-center">
            <p className="text-lg font-extrabold text-slate-900">You already have a StaffAnchor profile.</p>
            <p className="text-sm leading-6 text-slate-600">Sign in with the code we email you, and you can apply to this role in one tap.</p>
            <Link
              href={`/candidate-login?returnTo=${encodeURIComponent(`/jobs/${jobId}`)}`}
              className="flex h-12 items-center justify-center rounded-2xl bg-blue-600 text-sm font-bold text-white"
            >
              Sign in to apply
            </Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3.5 p-6">
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Full name" aria-label="Full name" className={field} />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              className={field}
            />
            <div className="flex gap-2">
              <span className="flex h-12 shrink-0 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-[15px] font-semibold text-slate-600">+91</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="Mobile number"
                aria-label="Mobile number"
                className={field}
              />
            </div>
            {error && <p className="text-[13px] font-medium text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition hover:shadow-xl disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send my interest <ArrowRight className="h-4 w-4" /></>}
            </button>
            <p className="text-center text-[11.5px] leading-5 text-slate-400">
              No CV needed now. By sending, you agree StaffAnchor may contact you about this role.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
