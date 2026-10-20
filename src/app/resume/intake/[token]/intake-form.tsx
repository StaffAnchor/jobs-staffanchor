"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

const field = "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] outline-none focus:border-slate-900";
const label = "mb-1.5 block text-sm font-semibold text-slate-900";

export default function IntakeForm({ token, name, tierLabel, alreadySubmitted }: { token: string; name: string; tierLabel: string; alreadySubmitted: boolean }) {
  const [v, setV] = useState({ currentRole: "", currentCompany: "", experience: "", targetRole: "", targetIndustry: "", linkedin: "", achievements: "", other: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const ok = v.currentRole.trim() && v.targetRole.trim() && v.achievements.trim();

  async function submit() {
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("token", token);
    for (const [k, val] of Object.entries(v)) fd.set(k, val);
    if (file) fd.set("cv", file);
    const res = await fetch("/api/resume/intake", { method: "POST", body: fd });
    const json = await res.json().catch(() => ({ ok: false, error: "Something went wrong." }));
    setBusy(false);
    if (json.ok) setDone(true);
    else setError(json.error ?? "Couldn't save your details.");
  }

  return (
    <div className="min-h-screen bg-[#F4F2EE] px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-sm md:p-9">
        {done ? (
          <div className="space-y-3 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="text-2xl font-bold text-slate-900">Thank you{name ? `, ${name.split(/\s+/)[0]}` : ""}</h1>
            <p className="text-[15px] text-slate-600">We have your details. Your first draft will reach you within 3 working days. We have emailed you the date.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h1 className="text-[26px] font-bold leading-tight text-slate-900">Tell us about your career</h1>
              <p className="mt-2 text-[15px] text-slate-600">{tierLabel}. About 15 minutes. The more specific you are, the stronger your resume. Your 3-working-day clock starts when you submit this.</p>
              {alreadySubmitted && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">You have already sent your details. Submitting again replaces them.</p>}
            </div>
            <div>
              <label className={label}>Current role *</label>
              <input className={field} value={v.currentRole} onChange={set("currentRole")} placeholder="For example Senior Account Executive" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Current company</label>
                <input className={field} value={v.currentCompany} onChange={set("currentCompany")} />
              </div>
              <div>
                <label className={label}>Years of experience</label>
                <input className={field} value={v.experience} onChange={set("experience")} />
              </div>
            </div>
            <div>
              <label className={label}>The role you are targeting *</label>
              <input className={field} value={v.targetRole} onChange={set("targetRole")} placeholder="For example Regional Sales Head, SaaS" />
            </div>
            <div>
              <label className={label}>Industries or companies you want to move to</label>
              <input className={field} value={v.targetIndustry} onChange={set("targetIndustry")} />
            </div>
            <div>
              <label className={label}>LinkedIn profile link</label>
              <input className={field} value={v.linkedin} onChange={set("linkedin")} placeholder="https://www.linkedin.com/in/…" />
            </div>
            <div>
              <label className={label}>Your key achievements *</label>
              <textarea className={field} rows={6} value={v.achievements} onChange={set("achievements")} placeholder="Three to five results with numbers: revenue or quota achieved, deal sizes, team size, growth, awards." />
            </div>
            <div>
              <label className={label}>Anything else we should know</label>
              <textarea className={field} rows={3} value={v.other} onChange={set("other")} />
            </div>
            <div>
              <label className={label}>Your current resume (PDF or Word, up to 5 MB)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-600" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={submit} disabled={!ok || busy} className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-5 py-3.5 text-[15px] font-semibold text-white disabled:opacity-40">
              {busy ? "Sending…" : "Send my details"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
