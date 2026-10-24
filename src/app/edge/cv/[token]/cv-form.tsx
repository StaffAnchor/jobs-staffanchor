"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, CheckCircle2, ChevronRight, Clock, FileText, Loader2, Plus, Sparkles, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import {
  COMPANY_TYPES, CV_PAGES, EDUCATION, EMP_TYPES, INDUSTRIES, LANGUAGES, LEVELS, NOTICE, RELOCATE, STATUSES, TRAVEL, WORK_MODES,
  describeJob, emptyJob, jobFilled, jobPeriod, keyItems, progress, type CvData, type Job,
} from "@/lib/cv-brief/config";
import JobWizard, { type StepId } from "./job-wizard";
import { CV_CSS, Card, Field, IconButton, MultiChips, NumInput, PickChips, Ring, Toggle, inputCls } from "./ui";

const STEPS = ["You", "Experience", "Next move", "Review"];
type Save = "idle" | "dirty" | "saving" | "saved" | "error";
type Upload = { state: "idle" | "busy" | "done" | "error"; msg?: string };

export default function CvForm({ token, name, initial, status, cvName: initialCv, consented }: { token: string; name: string; initial: CvData; status: string; cvName: string | null; consented: boolean }) {
  const [data, setData] = useState<CvData>(initial);
  const [consent, setConsent] = useState(consented);
  const [step, setStep] = useState(0);
  const [wiz, setWiz] = useState<{ jobId: string; step?: StepId } | null>(null);
  const [save, setSave] = useState<Save>("idle");
  const [cvName, setCvName] = useState<string | null>(initialCv);
  const [up, setUp] = useState<Upload>({ state: "idle" });
  const [sure, setSure] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const first = useRef(true);
  const latest = useRef({ data, consent });
  latest.current = { data, consent };
  const fileInput = useRef<HTMLInputElement>(null);
  const top = useRef<HTMLDivElement>(null);

  const firstName = (data.basics.name || name).trim().split(/\s+/)[0] || "there";
  const prefilled = !!(initial.basics.employer || initial.basics.title || initial.basics.city);
  const pct = progress(data);

  async function post(submit: boolean): Promise<boolean> {
    try {
      setSave("saving");
      const res = await fetch("/api/edge/cv/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, data: latest.current.data, consent: latest.current.consent, submit }) });
      const j = await res.json().catch(() => ({ ok: false }));
      if (!j.ok) throw new Error(j.error ?? "save failed");
      setSave("saved");
      return true;
    } catch {
      setSave("error");
      return false;
    }
  }

  // Everything is saved as they go. A failed save is retried by itself.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setSave("dirty");
    const t = setTimeout(() => void post(false), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, consent]);

  useEffect(() => {
    if (save !== "error") return;
    const t = setTimeout(() => void post(false), 8000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && (save === "dirty" || save === "error")) void post(false);
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [save]);

  const go = (n: number) => {
    setStep(n);
    if (n !== 1) setWiz(null);
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const openJob = (jobId: string, stepId?: StepId) => {
    setStep(1);
    setWiz({ jobId, step: stepId });
    top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const setB = <K extends keyof CvData["basics"]>(k: K, v: CvData["basics"][K]) => setData((d) => ({ ...d, basics: { ...d.basics, [k]: v } }));
  const setT = <K extends keyof CvData["targets"]>(k: K, v: CvData["targets"][K]) => setData((d) => ({ ...d, targets: { ...d.targets, [k]: v } }));
  const setX = <K extends keyof CvData["extras"]>(k: K, v: CvData["extras"][K]) => setData((d) => ({ ...d, extras: { ...d.extras, [k]: v } }));
  const setJob = (j: Job) => setData((d) => ({ ...d, jobs: d.jobs.map((x) => (x.id === j.id ? j : x)) }));

  function addJob() {
    const j = emptyJob();
    setData((d) => ({ ...d, jobs: [...d.jobs, j] }));
    openJob(j.id, "role");
  }
  function moveJob(i: number, by: -1 | 1) {
    setData((d) => {
      const jobs = [...d.jobs];
      const to = i + by;
      if (to < 0 || to >= jobs.length) return d;
      [jobs[i], jobs[to]] = [jobs[to], jobs[i]];
      return { ...d, jobs };
    });
  }
  function removeJob(j: Job) {
    if (jobFilled(j) && !window.confirm("Remove this job and everything you entered for it?")) return;
    setData((d) => ({ ...d, jobs: d.jobs.filter((x) => x.id !== j.id) }));
    if (wiz?.jobId === j.id) setWiz(null);
  }

  async function onFile(f: File | undefined) {
    if (!f) return;
    setUp({ state: "busy" });
    const fd = new FormData();
    fd.set("token", token);
    fd.set("cv", f);
    try {
      const res = await fetch("/api/edge/cv/upload", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({ ok: false, error: "Something went wrong. Please try again." }));
      if (!j.ok) return setUp({ state: "error", msg: j.error ?? "Couldn't upload that file." });
      setCvName(f.name);
      if (j.read && j.data) {
        const s = j.data as CvData;
        // Fill only what is still empty, so nothing they have already typed is replaced.
        setData((d) => ({
          ...d,
          jobs: d.jobs.length ? d.jobs : s.jobs,
          basics: { ...d.basics, education: d.basics.education || s.basics.education, educationDetail: d.basics.educationDetail || s.basics.educationDetail },
          extras: { ...d.extras, certifications: d.extras.certifications || s.extras.certifications },
        }));
        setUp({ state: "done", msg: j.jobs ? `We found ${j.jobs} ${j.jobs === 1 ? "job" : "jobs"}. You will check them in the next step.` : "Uploaded. You will add your jobs in the next step." });
      } else {
        setUp({ state: "done", msg: "Uploaded. We couldn't read it automatically, so you will add your jobs in the next step." });
      }
    } catch {
      setUp({ state: "error", msg: "The connection dropped. Please try again." });
    }
  }

  async function submit() {
    setSubmitting(true);
    setSubmitErr(null);
    const ok = await post(true);
    setSubmitting(false);
    if (ok) {
      setDone(true);
      top.current?.scrollIntoView({ block: "start" });
    } else setSubmitErr("We couldn't send it just now. Your answers are saved here, so please try again in a moment.");
  }

  const wizJob = wiz ? data.jobs.find((j) => j.id === wiz.jobId) ?? null : null;
  const wizIndex = wizJob ? data.jobs.indexOf(wizJob) : -1;
  // What each job still needs, in the order the jobs are listed. The last two jobs are asked in full.
  const todo = useMemo(() => data.jobs.map((j, i) => ({ j, i, miss: keyItems(j, i < 2).filter((k) => !k.done) })).filter((x) => x.miss.length > 0), [data.jobs]);
  const nextUp = todo[0];
  const jobName = (j: Job, i: number) => [j.title, j.employer].filter(Boolean).join(", ") || (i === 0 ? "Your latest job" : "Another job");
  const wide = step === 1 && !!wizJob;
  const savedText = { idle: "", dirty: "Saving…", saving: "Saving…", saved: "All changes saved", error: "Offline. Will retry." }[save];

  if (done) {
    return (
      <div className="min-h-screen bg-[#F4F2EE] px-4 py-10">
        <div ref={top} className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm md:p-12">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-4 text-[26px] font-bold text-slate-950">Thank you, {firstName}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">We have everything you shared. The StaffAnchor team will go through it and use it to prepare your CV. If you remember something later, come back to this same link and add it. It saves just like before.</p>
          <button onClick={() => { setDone(false); go(1); }} className="mt-6 rounded-xl border border-slate-300 px-5 py-2.5 text-[14px] font-semibold text-slate-800 hover:border-slate-900">Edit my answers</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F2EE] pb-28">
      <div ref={top} />
      <style>{CV_CSS}</style>
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-[#F4F2EE]/90 backdrop-blur">
        <div className={`mx-auto flex items-center justify-between gap-3 px-4 py-2.5 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
          <p className="text-[13px] font-bold tracking-wide text-slate-950">StaffAnchor <span className="font-medium text-slate-500">Edge</span></p>
          <div className="flex items-center gap-3">
            <p className={`text-xs ${save === "error" ? "text-amber-700" : "text-slate-500"}`} aria-live="polite">{savedText}</p>
            <div className="flex items-center gap-2" title="How complete the details a sales CV needs are">
              <Ring pct={pct} />
              <span className="hidden text-[11px] font-semibold leading-tight text-slate-500 sm:block">CV<br />strength</span>
            </div>
          </div>
        </div>
        <div className={`mx-auto px-4 pb-3 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
          <nav className="grid grid-cols-4 gap-1.5" aria-label="Steps">
            {STEPS.map((s, i) => (
              <button key={s} type="button" onClick={() => go(i)} className={`rounded-xl px-1 py-2 text-[12.5px] font-semibold transition ${step === i ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
                <span className="hidden sm:inline">{i + 1}. </span>{s}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className={`mx-auto space-y-4 px-4 py-5 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        {step === 0 && (
          <>
            <div className="px-1 pb-1">
              <h1 className="text-[28px] font-bold leading-tight text-slate-950">Hi {firstName}, let&apos;s build your sales story</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">This helps us write a CV that shows what you really did. It takes about 10 to 15 minutes. Nothing is compulsory, so skip anything you can&apos;t or don&apos;t want to share. Your answers save as you go, and you can come back to this link any time.</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200"><Clock className="h-3.5 w-3.5" /> 10 to 15 minutes</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200"><ShieldCheck className="h-3.5 w-3.5" /> Private to you</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-slate-200"><Sparkles className="h-3.5 w-3.5" /> It writes your CV lines as you go</span>
              </div>
            </div>

            <Card title="Start with your current CV" sub="Upload it and we will fill in your jobs, so you only check and add the numbers.">
              <input ref={fileInput} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); void onFile(e.dataTransfer.files?.[0]); }}
                disabled={up.state === "busy"}
                className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${drag ? "border-slate-950 bg-slate-50" : "border-slate-300 hover:border-slate-500"}`}
              >
                {up.state === "busy" ? <Loader2 className="h-7 w-7 animate-spin text-slate-500" /> : cvName ? <FileText className="h-7 w-7 text-emerald-600" /> : <UploadCloud className="h-7 w-7 text-slate-400" />}
                <span className="text-[15px] font-semibold text-slate-900">{up.state === "busy" ? "Reading your CV…" : cvName ? cvName : "Tap to upload, or drop a file here"}</span>
                <span className="text-xs text-slate-500">{up.state === "busy" ? "This can take up to a minute." : cvName ? "Tap to replace it" : "PDF or Word, up to 5 MB"}</span>
              </button>
              {up.msg && <p className={`text-[13px] ${up.state === "error" ? "text-red-600" : "text-emerald-700"}`}>{up.msg}</p>}
              <p className="text-xs text-slate-400">No CV handy? Skip this and add your jobs by hand in the next step.</p>
            </Card>

            <Card title="About you" sub={prefilled ? "We filled in what we already know. Please check it and correct anything that is wrong." : undefined}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name"><input className={inputCls} value={data.basics.name} onChange={(e) => setB("name", e.target.value)} autoComplete="name" /></Field>
                <Field label="Mobile number"><input className={inputCls} inputMode="tel" value={data.basics.phone} onChange={(e) => setB("phone", e.target.value)} autoComplete="tel" /></Field>
                <Field label="Email"><input className={inputCls} type="email" value={data.basics.email} onChange={(e) => setB("email", e.target.value)} autoComplete="email" /></Field>
                <Field label="Current city"><input className={inputCls} value={data.basics.city} onChange={(e) => setB("city", e.target.value)} /></Field>
                <Field label="Current company"><input className={inputCls} value={data.basics.employer} onChange={(e) => setB("employer", e.target.value)} /></Field>
                <Field label="Current title"><input className={inputCls} value={data.basics.title} onChange={(e) => setB("title", e.target.value)} /></Field>
                <Field label="Total years of experience"><NumInput value={data.basics.expYears} onChange={(v) => setB("expYears", v)} step="0.5" /></Field>
                <Field label="LinkedIn profile"><input className={inputCls} value={data.basics.linkedin} onChange={(e) => setB("linkedin", e.target.value)} placeholder="linkedin.com/in/…" /></Field>
              </div>
              <Field label="Where are you right now?"><PickChips options={STATUSES} value={data.basics.status} onChange={(v) => setB("status", v)} /></Field>
              <Field label="Highest education"><PickChips options={EDUCATION} value={data.basics.education} onChange={(v) => setB("education", v)} /></Field>
              <Field label="Degree and college" hint="For example MBA Marketing, SIBM Pune."><input className={inputCls} value={data.basics.educationDetail} onChange={(e) => setB("educationDetail", e.target.value)} /></Field>
            </Card>

            <Card>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-slate-950" />
                <span className="text-[14px] leading-relaxed text-slate-700">I allow StaffAnchor to use the details I give here and my CV to create and keep my professional profile with them, for recruitment. <span className="text-slate-400">(Optional. You can still use this form without ticking it.)</span></span>
              </label>
            </Card>
          </>
        )}

        {step === 1 && (wizJob ? (
          <JobWizard key={`${wizJob.id}-${wiz?.step ?? ""}`} job={wizJob} index={wizIndex} total={data.jobs.length} onChange={setJob} onClose={() => { setWiz(null); top.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} initialStep={wiz?.step} />
        ) : (
          <div className="cv-in space-y-4">
            <div className="px-1 pb-1">
              <h1 className="text-[26px] font-bold leading-tight text-slate-950">Your sales experience</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">We will take each job in a few short steps, newest first. Your last two jobs matter most, so they get the most questions. Older ones are quick.</p>
            </div>
            {nextUp && (
              <button type="button" onClick={() => openJob(nextUp.j.id, nextUp.miss[0].id as StepId)} className="group flex w-full items-center justify-between gap-4 rounded-3xl bg-slate-950 p-5 text-left text-white shadow-lg transition hover:bg-slate-900 active:scale-[0.99]">
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-white/50">Next up</span>
                  <span className="mt-1 block truncate text-[18px] font-bold">{jobName(nextUp.j, nextUp.i)}</span>
                  <span className="mt-1 block text-[13px] text-white/70">{nextUp.miss.length} key {nextUp.miss.length === 1 ? "detail" : "details"} to add: {nextUp.miss.map((k) => k.label.toLowerCase()).join(", ")}</span>
                </span>
                <ChevronRight className="h-6 w-6 shrink-0 transition group-hover:translate-x-1" />
              </button>
            )}
            {data.jobs.length === 0 && <Card><p className="text-[15px] text-slate-600">No jobs yet. Begin with your current or most recent one.</p></Card>}
            {data.jobs.map((j, i) => {
              const items = keyItems(j, i < 2);
              const first = items.find((k) => !k.done);
              return (
                <section key={j.id} className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <div className="flex items-start gap-2 p-4 md:p-5">
                    <button type="button" onClick={() => openJob(j.id, (first?.id as StepId) ?? "role")} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-bold text-slate-600">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-bold text-slate-950">{jobName(j, i)}</span>
                        <span className="mt-0.5 block text-[13px] text-slate-500">{jobPeriod(j) || "Add the dates"}{j.city ? ` · ${j.city}` : ""}</span>
                        <span className="mt-2.5 flex flex-wrap gap-1.5 text-[11.5px] font-semibold">
                          {j.fromCv && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-800">From your CV, please check</span>}
                          {items.map((k) => <span key={k.id} className={`rounded-full px-2 py-0.5 ${k.done ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{k.done ? "✓" : "+"} {k.label}</span>)}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center">
                      {data.jobs.length > 1 && (
                        <>
                          <IconButton onClick={() => moveJob(i, -1)} label="Move up"><ArrowUp className="h-4 w-4" /></IconButton>
                          <IconButton onClick={() => moveJob(i, 1)} label="Move down"><ArrowDown className="h-4 w-4" /></IconButton>
                        </>
                      )}
                      <IconButton onClick={() => removeJob(j)} label="Remove this job"><Trash2 className="h-4 w-4" /></IconButton>
                    </div>
                  </div>
                </section>
              );
            })}
            <button type="button" onClick={addJob} className="flex w-full items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-slate-300 py-5 text-[15px] font-semibold text-slate-600 transition hover:border-slate-900 hover:text-slate-950">
              <Plus className="h-5 w-5" /> {data.jobs.length ? "Add an earlier job" : "Add your latest job"}
            </button>
          </div>
        ))}

        {step === 2 && (
          <>
            <div className="px-1 pb-1">
              <h1 className="text-[26px] font-bold leading-tight text-slate-950">What you want next</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">This helps us aim your CV at the right roles.</p>
            </div>
            <Card title="The roles you are going for">
              <Field label="Roles" hint="One or more, for example Regional Sales Manager, Key Account Manager."><textarea rows={2} className={inputCls} value={data.targets.roles} onChange={(e) => setT("roles", e.target.value)} /></Field>
              <Field label="Level you are aiming for"><MultiChips options={LEVELS} value={data.targets.levels} onChange={(v) => setT("levels", v)} own={false} /></Field>
              <Field label="Industries you want to sell in"><MultiChips options={INDUSTRIES} value={data.targets.industries} onChange={(v) => setT("industries", v)} /></Field>
              <Field label="Kind of company"><MultiChips options={COMPANY_TYPES} value={data.targets.companyTypes} onChange={(v) => setT("companyTypes", v)} own={false} /></Field>
            </Card>
            <Card title="Where and how">
              <Field label="Cities you would work in"><input className={inputCls} value={data.targets.cities} onChange={(e) => setT("cities", e.target.value)} placeholder="For example Mumbai, Pune, Bengaluru" /></Field>
              <Field label="Open to relocating?"><PickChips options={RELOCATE} value={data.targets.relocate} onChange={(v) => setT("relocate", v)} /></Field>
              <Field label="Travel"><PickChips options={TRAVEL} value={data.targets.travel} onChange={(v) => setT("travel", v)} /></Field>
              <Field label="Work mode"><PickChips options={WORK_MODES} value={data.targets.workMode} onChange={(v) => setT("workMode", v)} /></Field>
              <Field label="Kind of engagement"><PickChips options={EMP_TYPES} value={data.targets.empType} onChange={(v) => setT("empType", v)} /></Field>
              <Field label="Notice period"><PickChips options={NOTICE} value={data.targets.notice} onChange={(v) => setT("notice", v)} /></Field>
            </Card>
            <Card title="Pay (optional)" sub="In lakhs per year. This stays with the StaffAnchor team and is never put on your CV.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Current fixed pay (LPA)"><NumInput value={data.targets.currentFixed} onChange={(v) => setT("currentFixed", v === 0 ? null : v)} /></Field>
                <Field label="Current variable pay (LPA)"><NumInput value={data.targets.currentVariable} onChange={(v) => setT("currentVariable", v)} /></Field>
                <Field label="Expected fixed pay (LPA)"><NumInput value={data.targets.expectedFixed} onChange={(v) => setT("expectedFixed", v === 0 ? null : v)} /></Field>
                <Field label="Expected variable pay (LPA)"><NumInput value={data.targets.expectedVariable} onChange={(v) => setT("expectedVariable", v)} /></Field>
              </div>
            </Card>
            <Card title="A few last things">
              <Field label="CV length"><PickChips options={CV_PAGES} value={data.extras.cvPages} onChange={(v) => setX("cvPages", v)} /></Field>
              <Field label="Languages you speak"><MultiChips options={LANGUAGES} value={data.extras.languages} onChange={(v) => setX("languages", v)} /></Field>
              <Field label="Certifications or courses"><input className={inputCls} value={data.extras.certifications} onChange={(e) => setX("certifications", e.target.value)} placeholder="For example Salesforce Certified, Challenger Sale" /></Field>
              <Field label="Awards and recognition"><textarea rows={2} className={inputCls} value={data.extras.awards} onChange={(e) => setX("awards", e.target.value)} /></Field>
              <Toggle on={data.extras.confidential} onChange={(v) => setX("confidential", v)}>Some of my figures are confidential. Use broad numbers.</Toggle>
              <Field label="Anything you want left out of the CV"><input className={inputCls} value={data.extras.cvAvoid} onChange={(e) => setX("cvAvoid", e.target.value)} /></Field>
              <Field label="Anything we should handle sensitively" hint="For example a career gap, a short stint or a reason for leaving. This never goes on your CV."><textarea rows={2} className={inputCls} value={data.extras.gaps} onChange={(e) => setX("gaps", e.target.value)} /></Field>
              <Field label="Anything else"><textarea rows={2} className={inputCls} value={data.extras.anything} onChange={(e) => setX("anything", e.target.value)} /></Field>
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <div className="px-1 pb-1">
              <h1 className="text-[26px] font-bold leading-tight text-slate-950">Check and send</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Have a quick look. You can go back to any step, and you can come back and change things after sending.</p>
            </div>
            <Card title="What we have">
              <dl className="space-y-3 text-[14px]">
                <Sum k="You" v={[data.basics.name, data.basics.phone, data.basics.email, data.basics.city].filter(Boolean).join(" · ")} onEdit={() => go(0)} />
                <Sum k="CV file" v={cvName ?? "Not uploaded"} onEdit={() => go(0)} />
                <div>
                  <div className="flex items-center justify-between"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">How your jobs will read</dt><button onClick={() => go(1)} className="text-xs font-semibold text-slate-700 underline underline-offset-4">Edit</button></div>
                  <dd className="mt-1.5 space-y-2">
                    {data.jobs.filter(jobFilled).length === 0 && <span className="text-slate-500">None added</span>}
                    {data.jobs.filter(jobFilled).map((j, i) => {
                      const d = describeJob(j, i < 2);
                      return (
                        <div key={j.id} className="rounded-xl bg-slate-50 px-3.5 py-3">
                          <p className="font-semibold text-slate-900">{d.head}</p>
                          <p className="text-xs text-slate-500">{d.sub}</p>
                          <ul className="mt-1.5 space-y-1">{d.lines.filter((l) => !l.ghost).map((l, x) => <li key={x} className="text-[13px] leading-relaxed text-slate-600">{l.text}</li>)}</ul>
                        </div>
                      );
                    })}
                  </dd>
                </div>
                <Sum k="Next move" v={[data.targets.roles, data.targets.cities].filter(Boolean).join(" · ")} onEdit={() => go(2)} />
                <Sum k="Profile consent" v={consent ? "You allowed StaffAnchor to keep your profile" : "Not ticked (optional)"} onEdit={() => go(0)} />
              </dl>
            </Card>
            {(todo.length > 0 || !data.targets.roles.trim() || !data.basics.linkedin.trim()) && (
              <Card title={todo.length ? `${todo.reduce((a, x) => a + (x.i < 2 ? x.miss.length : 0), 0) || todo.length} key details are still missing` : "Almost there"} sub="You can send without them, but each one makes your CV stronger. Tap Add to fill one in.">
                <ul className="space-y-2.5 text-[14px] text-slate-700">
                  {todo.slice(0, 2).flatMap((x) => x.miss.map((k) => (
                    <li key={`${x.j.id}-${k.id}`} className="flex items-center justify-between gap-3"><span className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{jobName(x.j, x.i)}: {k.label.toLowerCase()}</span><button onClick={() => openJob(x.j.id, k.id as StepId)} className="shrink-0 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white">Add</button></li>
                  )))}
                  {!data.targets.roles.trim() && <li className="flex items-center justify-between gap-3"><span className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />The role you are looking for</span><button onClick={() => go(2)} className="shrink-0 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white">Add</button></li>}
                  {!data.basics.linkedin.trim() && <li className="flex items-center justify-between gap-3"><span className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />Your LinkedIn link</span><button onClick={() => go(0)} className="shrink-0 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white">Add</button></li>}
                </ul>
              </Card>
            )}
            <Card>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={sure} onChange={(e) => setSure(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-slate-950" />
                <span className="text-[14px] leading-relaxed text-slate-700">What I have shared is accurate to the best of my knowledge. Figures marked approximate are my honest estimates.</span>
              </label>
              {submitErr && <p className="text-sm text-red-600">{submitErr}</p>}
              <button onClick={submit} disabled={!sure || submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-4 text-[16px] font-semibold text-white transition hover:bg-slate-800 disabled:opacity-40">
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />} {status === "submitted" ? "Send my updated answers" : todo.some((x) => x.i < 2) ? "Send anyway" : "Send to StaffAnchor"}
              </button>
            </Card>
          </>
        )}
      </main>

      {step < 3 && !wizJob && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <button onClick={() => go(Math.max(0, step - 1))} disabled={step === 0} className="rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 disabled:invisible">Back</button>
            <button onClick={() => go(step + 1)} className="flex-1 rounded-xl bg-slate-950 px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-slate-800 sm:flex-none sm:px-10">{step === 2 ? "Review" : "Continue"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Sum({ k, v, onEdit }: { k: string; v: string; onEdit: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k}</dt><button onClick={onEdit} className="text-xs font-semibold text-slate-700 underline underline-offset-4">Edit</button></div>
      <dd className="mt-1 text-slate-800">{v || <span className="text-slate-400">Nothing added</span>}</dd>
    </div>
  );
}
