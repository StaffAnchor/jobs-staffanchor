"use client";

import { useState } from "react";
import { Check, CheckCircle2, Download, Loader2, MessageSquarePlus } from "lucide-react";
import type { CandidateResponse, CvDoc, DocStatus, SectionRef } from "@/lib/cv-doc/types";

const field = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5";

// The candidate's review of their CV: read it as it will look, add a comment against any section, then approve it or send the
// changes. They can change their answer until they have approved.

function SectionBox({ id, title, comments, setComment, locked, children }: { id: string; title: string; comments: Record<string, string>; setComment: (id: string, v: string) => void; locked: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(!!comments[id]);
  const has = !!comments[id]?.trim();
  return (
    <section className={`group relative rounded-2xl px-4 py-3.5 transition ${has ? "bg-amber-50/70 ring-1 ring-amber-200" : "hover:bg-slate-50"}`}>
      {!locked && (
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${has ? "bg-amber-200 text-amber-900" : "bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 hover:text-slate-900 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"}`}>
          <MessageSquarePlus className="h-3.5 w-3.5" /> {has ? "Your comment" : "Suggest a change"}
        </button>
      )}
      {children}
      {(open || (locked && has)) && (
        <div className="cv-in mt-3 rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <label className="mb-1.5 block text-[12.5px] font-semibold text-slate-700">What would you like changed in {title}?</label>
          <textarea disabled={locked} rows={3} className={field} value={comments[id] ?? ""} onChange={(e) => setComment(id, e.target.value)} placeholder="For example: this figure is not right, please add…" />
        </div>
      )}
    </section>
  );
}

const Heading = ({ children }: { children: React.ReactNode }) => <h2 className="mb-2 border-b border-slate-200 pb-1 text-[12px] font-bold uppercase tracking-[0.14em] text-slate-900">{children}</h2>;

export default function Review({ token, name, version, status, doc, sections, photoUrl, response, superseded }: { token: string; name: string; version: number; status: DocStatus; doc: CvDoc; sections: SectionRef[]; photoUrl: string | null; response: CandidateResponse | null; superseded: boolean }) {
  const [comments, setComments] = useState<Record<string, string>>(response?.decision === "changes" ? response.comments : {});
  const [general, setGeneral] = useState(response?.decision === "changes" ? response.general : "");
  const [state, setState] = useState<"idle" | "busy" | "approved" | "changes">(status === "final" ? "approved" : "idle");
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const first = (name || doc.header.name).trim().split(/\s+/)[0] || "there";
  const locked = state === "approved" || superseded;
  const nComments = Object.values(comments).filter((v) => v.trim()).length;
  const canSend = nComments > 0 || general.trim().length > 0;
  const setComment = (id: string, v: string) => setComments((c) => ({ ...c, [id]: v }));
  const h = doc.header;
  const contact = [h.email, h.phone, h.city, h.linkedin].filter(Boolean).join("   |   ");

  async function send(decision: "approved" | "changes") {
    setState("busy");
    setErr(null);
    try {
      const res = await fetch("/api/edge/cv-review/respond", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, decision, comments, general }) });
      const j = await res.json().catch(() => ({ ok: false, error: "Something went wrong. Please try again." }));
      if (!j.ok) {
        setState("idle");
        return setErr(j.error ?? "Couldn't send your answer.");
      }
      setState(decision === "approved" ? "approved" : "changes");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setState("idle");
      setErr("The connection dropped. Please try again.");
    }
  }

  const sec = (id: string) => sections.find((s) => s.id === id)?.title ?? id;

  return (
    <div className="min-h-screen bg-[#F4F2EE] pb-32">
      <style>{`@keyframes cvIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.cv-in{animation:cvIn .3s ease both}@media (prefers-reduced-motion:reduce){.cv-in{animation:none}}`}</style>
      <header className="border-b border-slate-200/70 bg-[#F4F2EE]/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <p className="text-[13px] font-bold tracking-wide text-slate-950">StaffAnchor <span className="font-medium text-slate-500">Edge</span></p>
          <a href={`/api/edge/cv-review/pdf/${token}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:text-slate-950"><Download className="h-3.5 w-3.5" /> Download PDF</a>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-6">
        {state === "approved" ? (
          <div className="cv-in rounded-3xl bg-white p-6 text-center shadow-sm md:p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-3 text-[24px] font-bold text-slate-950">Thank you, {first}. Your CV is approved.</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">You can download it below. If you think of anything later, reply to the email we sent you and we will update it.</p>
            <a href={`/api/edge/cv-review/pdf/${token}`} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 text-[15px] font-semibold text-white"><Download className="h-4 w-4" /> Download your CV</a>
          </div>
        ) : state === "changes" ? (
          <div className="cv-in rounded-3xl bg-white p-6 text-center shadow-sm md:p-8">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <h1 className="mt-3 text-[24px] font-bold text-slate-950">Thank you, {first}. We have your changes.</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">We will update your CV and send you a new link to look at. You can still add more comments below until then.</p>
          </div>
        ) : (
          <div className="px-1">
            <h1 className="text-[26px] font-bold leading-tight text-slate-950">Hi {first}, your CV is ready for your review</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Read it through as it will look to an employer. Tap <b>Suggest a change</b> on any section that is not quite right, then send your changes, or approve it if you are happy. {response?.decision === "changes" ? "We have your earlier comments below. You can add to them." : ""}</p>
          </div>
        )}

        {superseded && <p className="rounded-2xl bg-amber-50 px-4 py-3 text-[14px] text-amber-900">We are preparing a newer version of your CV, so this one may be out of date. We will send you the new link when it is ready.</p>}

        <article className="rounded-3xl bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)] md:p-8" aria-label={`CV, version ${version}`}>
          <div className="flex items-start justify-between gap-4 px-4">
            <div className="min-w-0">
              <h2 className="text-[28px] font-bold leading-tight text-slate-950">{h.name}</h2>
              {h.headline && <p className="mt-1 text-[15px] font-medium text-blue-700">{h.headline}</p>}
              {contact && <p className="mt-2 text-[13px] text-slate-500">{contact}</p>}
            </div>
            {photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="Your photo" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
            )}
          </div>

          <div className="mt-4 space-y-2">
            <SectionBox id="summary" title="the summary" comments={comments} setComment={setComment} locked={locked}>
              <Heading>Summary</Heading>
              <p className="text-[14.5px] leading-relaxed text-slate-800">{doc.summary}</p>
            </SectionBox>

            {doc.highlights.length > 0 && (
              <SectionBox id="highlights" title="career at a glance" comments={comments} setComment={setComment} locked={locked}>
                <Heading>Career at a glance</Heading>
                <ul className="space-y-1 rounded-xl bg-slate-50 p-3">{doc.highlights.map((x, i) => <li key={i} className="flex gap-2 text-[14.5px] text-slate-800"><span className="text-blue-600">•</span>{x}</li>)}</ul>
              </SectionBox>
            )}

            {doc.experience.map((e, idx) => (
              <SectionBox key={e.id} id={`exp:${e.id}`} title={e.company || "this job"} comments={comments} setComment={setComment} locked={locked}>
                {idx === 0 && <Heading>Experience</Heading>}
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 pr-32">
                  <p className="text-[16px] font-bold text-slate-950">{e.company}</p>
                  <p className="text-[12.5px] text-slate-500">{[e.location, e.roles.length > 1 ? e.period : ""].filter(Boolean).join("  ·  ")}</p>
                </div>
                {e.roles.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 text-[14px]">
                    <p className="font-semibold text-slate-800">{r.title}</p>
                    <p className="text-[12.5px] text-slate-500">{e.roles.length > 1 || !e.period ? r.period : e.period}</p>
                  </div>
                ))}
                {e.scope && <p className="mt-1 text-[14px] text-slate-500">{e.scope}</p>}
                <ul className="mt-1.5 space-y-1">{e.bullets.map((b, i) => <li key={i} className="flex gap-2 text-[14.5px] leading-relaxed text-slate-800"><span className="text-blue-600">•</span>{b}</li>)}</ul>
                {e.tools && <p className="mt-1.5 text-[12.5px] text-slate-500">Tools: {e.tools}</p>}
              </SectionBox>
            ))}

            {doc.education.length > 0 && (
              <SectionBox id="education" title="education" comments={comments} setComment={setComment} locked={locked}>
                <Heading>Education</Heading>
                {doc.education.map((e, i) => <p key={i} className="flex justify-between gap-3 text-[14.5px] text-slate-800"><span><b>{e.degree}</b>{e.institution ? `, ${e.institution}` : ""}</span><span className="text-[12.5px] text-slate-500">{e.year}</span></p>)}
              </SectionBox>
            )}

            {doc.skills.length > 0 && (
              <SectionBox id="skills" title="skills" comments={comments} setComment={setComment} locked={locked}>
                <Heading>Skills</Heading>
                {doc.skills.map((g) => <p key={g.label} className="text-[14.5px] text-slate-800"><b>{g.label}:</b> {g.items.join("  ·  ")}</p>)}
              </SectionBox>
            )}

            {(doc.certifications.length > 0 || doc.awards.length > 0) && (
              <SectionBox id="extras" title="certifications and awards" comments={comments} setComment={setComment} locked={locked}>
                {doc.certifications.length > 0 && (<><Heading>Certifications</Heading><ul className="mb-3 space-y-1">{doc.certifications.map((x, i) => <li key={i} className="flex gap-2 text-[14.5px] text-slate-800"><span className="text-blue-600">•</span>{x}</li>)}</ul></>)}
                {doc.awards.length > 0 && (<><Heading>Awards and recognition</Heading><ul className="space-y-1">{doc.awards.map((x, i) => <li key={i} className="flex gap-2 text-[14.5px] text-slate-800"><span className="text-blue-600">•</span>{x}</li>)}</ul></>)}
              </SectionBox>
            )}
          </div>
        </article>

        {!locked && (
          <div className="rounded-3xl bg-white p-5 shadow-sm md:p-6">
            <label className="mb-1.5 block text-[14px] font-bold text-slate-900">Anything else you would like to tell us?</label>
            <textarea rows={3} className={field} value={general} onChange={(e) => setGeneral(e.target.value)} placeholder="For example: please make it one page, or add a recent project." />
          </div>
        )}
        {state === "changes" && nComments > 0 && <p className="px-1 text-xs text-slate-400">You commented on: {Object.keys(comments).filter((k) => comments[k].trim()).map(sec).join(", ")}.</p>}
      </main>

      {!locked && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            {err && <p className="mb-2 text-center text-sm text-red-600">{err}</p>}
            {confirm ? (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[14px] font-semibold text-slate-900">Approve this CV as it is?{nComments > 0 ? " Your comments will be left out." : ""}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setConfirm(false)} className="rounded-xl px-4 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-100">Not yet</button>
                  <button type="button" onClick={() => send("approved")} disabled={state === "busy"} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Yes, approve</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="hidden text-[13px] text-slate-500 sm:block">{nComments + (general.trim() ? 1 : 0) > 0 ? `${nComments} ${nComments === 1 ? "comment" : "comments"} so far` : "Happy with it? Approve. Want changes? Comment on any section."}</p>
                <div className="flex flex-1 justify-end gap-2">
                  <button type="button" onClick={() => send("changes")} disabled={!canSend || state === "busy"} className="rounded-xl border border-slate-300 px-4 py-2.5 text-[14px] font-semibold text-slate-800 transition hover:border-slate-900 disabled:opacity-40">{state === "busy" ? "Sending…" : "Send my changes"}</button>
                  <button type="button" onClick={() => setConfirm(true)} disabled={state === "busy"} className="rounded-xl bg-slate-950 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50">Approve my CV</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
