"use client";

import { useState } from "react";

const field = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20";

export default function ReferForm({ candidateId, token }: { candidateId: string; token: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/refer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: candidateId, t: token, name, email, phone, note }) });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(d.error ?? "Couldn't send that. Please try again.");
      else setDone(name.trim());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done !== null) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-lg font-bold text-emerald-900">Thank you. We&apos;ve got {done || "their details"}.</p>
        <p className="mt-1 text-sm text-emerald-800">We&apos;ll reach out only with a relevant role. You can refer another person any time with the same link.</p>
        <button type="button" onClick={() => { setDone(null); setName(""); setEmail(""); setPhone(""); setNote(""); }} className="mt-4 text-sm font-semibold text-teal-700 underline">
          Refer someone else
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm font-semibold text-slate-700">
        Their name
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} className={field} autoComplete="off" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Their email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} className={field} autoComplete="off" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Their mobile <span className="font-normal text-slate-400">(optional)</span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} className={field} autoComplete="off" />
      </label>
      <label className="block text-sm font-semibold text-slate-700">
        Why would you back them? <span className="font-normal text-slate-400">(optional)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={600} className={field} placeholder="e.g. closed enterprise SaaS deals, worked with me at…" />
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={busy} className="h-12 w-full rounded-xl bg-teal-600 text-[15px] font-bold text-white transition hover:bg-teal-700 disabled:opacity-60">
        {busy ? "Sending…" : "Send referral"}
      </button>
      <p className="text-xs text-slate-500">We&apos;ll only use their details to contact them about suitable roles.</p>
    </form>
  );
}
