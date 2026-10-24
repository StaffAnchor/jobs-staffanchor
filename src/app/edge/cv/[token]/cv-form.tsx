"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Camera, Check, CheckCircle2, ChevronRight, Clock, FileText, Loader2, Plus, ShieldCheck, Sparkles, Trash2, UploadCloud, Wand2 } from "lucide-react";
import {
  COMPANY_TYPES, CV_PAGES, EDUCATION, EMP_TYPES, INDUSTRIES, LANGUAGES, LEVELS, NOTICE, PHOTO_PREFS, RELOCATE, STATUSES, STRENGTHS, STYLES, TRAVEL, WANT_NEXT, WORK_MODES,
  describeJob, jobFilled, jobPeriod, keyItems, progress, type CvData, type Job,
} from "@/lib/cv-brief/config";
import JobWizard, { type StepId } from "./job-wizard";
import Timeline from "./timeline";
import { CV_CSS, Card, Field, MultiChips, NumInput, PickChips, Ring, inputCls, Toggle } from "./ui";

const STEPS = ["You", "Experience", "Story", "Next move", "Review"];
type Save = "idle" | "dirty" | "saving" | "saved" | "error";
type Upload = { state: "idle" | "busy" | "done" | "error"; msg?: string };

export default function CvForm({ token, name, initial, status, cvName: initialCv, consented, photoUrl: initialPhoto }: { token: string; name: string; initial: CvData; status: string; cvName: string | null; consented: boolean; photoUrl: string | null }) {
  const [data, setData] = useState<CvData>(initial);
  const [consent, setConsent] = useState(consented);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"timeline" | "details">(initial.jobs.length > 0 && initial.jobs.every((j) => j.checked) ? "details" : "timeline");
  const [wiz, setWiz] = useState<{ jobId: string; step?: StepId } | null>(null);
  const [save, setSave] = useState<Save>("idle");
  const [cvName, setCvName] = useState<string | null>(initialCv);
  const [up, setUp] = useState<Upload>({ state: "idle" });
  const [photo, setPhoto] = useState<{ url: string | null; busy: boolean; err: string | null }>({ url: initialPhoto, busy: false, err: null });
  const [sure, setSure] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const first = useRef(true);
  const latest = useRef({ data, consent });
  latest.current = { data, consent };
  const fileInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
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

  const toTop = () => top.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const go = (n: number) => {
    setStep(n);
    if (n !== 1) setWiz(null);
    toTop();
  };
  const openJob = (jobId: string, stepId?: StepId) => {
    setStep(1);
    setPhase("details");
    setWiz({ jobId, step: stepId });
    toTop();
  };

  const setB = <K extends keyof CvData["basics"]>(k: K, v: CvData["basics"][K]) => setData((d) => ({ ...d, basics: { ...d.basics, [k]: v } }));
  const setS = <K extends keyof CvData["story"]>(k: K, v: CvData["story"][K]) => setData((d) => ({ ...d, story: { ...d.story, [k]: v } }));
  const setT = <K extends keyof CvData["targets"]>(k: K, v: CvData["targets"][K]) => setData((d) => ({ ...d, targets: { ...d.targets, [k]: v } }));
  const setX = <K extends keyof CvData["extras"]>(k: K, v: CvData["extras"][K]) => setData((d) => ({ ...d, extras: { ...d.extras, [k]: v } }));
  const setJob = (j: Job) => setData((d) => ({ ...d, jobs: d.jobs.map((x) => (x.id === j.id ? j : x)) }));
  const setEdu = (i: number, patch: Partial<CvData["basics"]["educations"][number]>) => {
    const list = data.basics.educations.map((e, x) => (x === i ? { ...e, ...patch } : e));
    setData((d) => ({ ...d, basics: { ...d.basics, educations: list, educationDetail: [list[0]?.degree, list[0]?.institution].filter(Boolean).join(", ") } }));
  };

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
          basics: { ...d.basics, education: d.basics.education || s.basics.education, educationDetail: d.basics.educationDetail || s.basics.educationDetail, educations: d.basics.educations.length ? d.basics.educations : s.basics.educations },
          extras: { ...d.extras, certifications: d.extras.certifications || s.extras.certifications },
        }));
        if (!data.jobs.length) setPhase("timeline");
        setUp({ state: "done", msg: j.jobs ? `We found ${j.jobs} ${j.jobs === 1 ? "job" : "jobs"}. Next, you will check them and the dates.` : "Uploaded. You will add your jobs in the next step." });
      } else {
        setUp({ state: "done", msg: "Uploaded. We couldn't read it automatically, so you will add your jobs in the next step." });
      }
    } catch {
      setUp({ state: "error", msg: "The connection dropped. Please try again." });
    }
  }

  async function onPhoto(f: File | undefined, remove = false) {
    if (!remove && !f) return;
    if (!remove && f && f.size > 4 * 1024 * 1024) return setPhoto((p) => ({ ...p, err: "That photo is over 4 MB. Please pick a smaller one." }));
    setPhoto((p) => ({ ...p, busy: true, err: null }));
    const fd = new FormData();
    fd.set("token", token);
    if (remove) fd.set("remove", "1");
    else if (f) fd.set("photo", f);
    try {
      const res = await fetch("/api/edge/cv/photo", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({ ok: false, error: "Something went wrong. Please try again." }));
      if (!j.ok) return setPhoto((p) => ({ ...p, busy: false, err: j.error ?? "Couldn't upload that photo." }));
      setPhoto({ url: remove ? null : (j.url ?? null), busy: false, err: null });
    } catch {
      setPhoto((p) => ({ ...p, busy: false, err: "The connection dropped. Please try again." }));
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
  const status2 = useMemo(() => data.jobs.map((j, i) => ({ j, i, miss: keyItems(j, i < 2).filter((k) => !k.done) })), [data.jobs]);
  const todo = status2.filter((x) => x.miss.length > 0);
  const doneJobs = status2.length - todo.length;
  const jobName = (j: Job, i: number) => [j.title, j.employer].filter(Boolean).join(", ") || `Job ${i + 1}`;
  const minutes = Math.max(1, Math.ceil(todo.reduce((a, x) => a + x.miss.length, 0) * 0.8));
  const wide = step === 1 && phase === "details" && !!wizJob;
  const savedText = { idle: "", dirty: "Saving…", saving: "Saving…", saved: "All changes saved", error: "Offline. Will retry." }[save];
  const nextAfter = (idx: number, skipId?: string) => todo.find((x) => x.i > idx && x.j.id !== skipId) ?? todo.find((x) => x.j.id !== skipId);

  // A first line they can edit, built only from what they have already entered.
  function suggestHeadline() {
    const j = data.jobs.find(jobFilled);
    if (!j) return;
    const years = data.basics.expYears ? `${data.basics.expYears}+ years of experience` : "Experience";
    const where = j.industry ? ` in ${j.industry.toLowerCase()} sales` : " in sales";
    const now = j.title ? `, most recently as ${j.title}${j.employer ? ` at ${j.employer}` : ""}` : "";
    setS("headline", `${years}${where}${now}.`);
  }

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
          <nav className="grid grid-cols-5 gap-1.5" aria-label="Steps">
            {STEPS.map((s, i) => (
              <button key={s} type="button" onClick={() => go(i)} className={`rounded-xl px-1 py-2 text-[12px] font-semibold transition sm:text-[12.5px] ${step === i ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:bg-slate-100"}`}>
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
                <Field label="Total years of experience"><NumInput value={data.basics.expYears} onChange={(v) => setB("expYears", v)} step="0.5" /></Field>
                <Field label="LinkedIn profile"><input className={inputCls} value={data.basics.linkedin} onChange={(e) => setB("linkedin", e.target.value)} placeholder="linkedin.com/in/…" /></Field>
              </div>
              <Field label="Where are you right now?"><PickChips options={STATUSES} value={data.basics.status} onChange={(v) => setB("status", v)} /></Field>
            </Card>

            <Card title="Your education" sub="Highest first. Add as many as you like.">
              <Field label="Highest level"><PickChips options={EDUCATION} value={data.basics.education} onChange={(v) => setB("education", v)} /></Field>
              <div className="space-y-3">
                {data.basics.educations.map((e, i) => (
                  <div key={i} className="grid gap-2.5 rounded-2xl border border-slate-200 p-3.5 sm:grid-cols-[1.2fr_1.2fr_90px_auto]">
                    <input className={inputCls} value={e.degree} onChange={(ev) => setEdu(i, { degree: ev.target.value })} placeholder="Degree, for example MBA Marketing" aria-label="Degree" />
                    <input className={inputCls} value={e.institution} onChange={(ev) => setEdu(i, { institution: ev.target.value })} placeholder="College or university" aria-label="College or university" />
                    <input className={inputCls} inputMode="numeric" value={e.year} onChange={(ev) => setEdu(i, { year: ev.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="Year" aria-label="Year" />
                    <button type="button" aria-label="Remove this qualification" onClick={() => setData((d) => ({ ...d, basics: { ...d.basics, educations: d.basics.educations.filter((_, x) => x !== i) } }))} className="justify-self-end rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setData((d) => ({ ...d, basics: { ...d.basics, educations: [...d.basics.educations, { degree: "", institution: "", year: "" }] } }))} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-300 px-3.5 py-2 text-[13.5px] font-medium text-slate-500 transition hover:border-slate-900 hover:text-slate-950">
                  <Plus className="h-3.5 w-3.5" /> {data.basics.educations.length ? "Add another qualification" : "Add a qualification"}
                </button>
              </div>
            </Card>

            <Card title="A photo for your CV (optional)" sub="A clear, well-lit headshot with a plain background. Some employers like a photo and some prefer none, so tell us what you would like.">
              <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { void onPhoto(e.target.files?.[0]); e.target.value = ""; }} />
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => photoInput.current?.click()} disabled={photo.busy} className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-slate-900" aria-label={photo.url ? "Replace your photo" : "Add a photo"}>
                  {photo.busy ? <Loader2 className="h-6 w-6 animate-spin text-slate-400" /> : photo.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo.url} alt="Your photo" className="h-full w-full object-cover" />
                  ) : <Camera className="h-7 w-7 text-slate-400" />}
                </button>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => photoInput.current?.click()} disabled={photo.busy} className="rounded-xl bg-slate-950 px-4 py-2 text-[13.5px] font-semibold text-white disabled:opacity-50">{photo.url ? "Replace photo" : "Add a photo"}</button>
                    {photo.url && <button type="button" onClick={() => void onPhoto(undefined, true)} disabled={photo.busy} className="rounded-xl px-3 py-2 text-[13.5px] font-semibold text-slate-500 hover:bg-slate-100">Remove</button>}
                  </div>
                  <p className="text-xs text-slate-500">JPG, PNG or WebP, up to 4 MB.</p>
                </div>
              </div>
              {photo.err && <p className="text-[13px] text-red-600">{photo.err}</p>}
              <Field label="Do you want a photo on your CV?"><PickChips options={PHOTO_PREFS} value={data.extras.photoPref} onChange={(v) => setX("photoPref", v)} /></Field>
            </Card>

            <Card>
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-slate-950" />
                <span className="text-[14px] leading-relaxed text-slate-700">I allow StaffAnchor to use the details I give here and my CV to create and keep my professional profile with them, for recruitment. <span className="text-slate-400">(Optional. You can still use this form without ticking it.)</span></span>
              </label>
            </Card>
          </>
        )}

        {step === 1 && (
          <>
            {/* Two parts, always visible, so it is clear where they are: first the timeline, then the details of each job. */}
            {!wizJob && (
              <div className="grid grid-cols-2 gap-2" aria-label="Parts of this step">
                <button type="button" onClick={() => setPhase("timeline")} className={`rounded-2xl px-4 py-3 text-left transition ${phase === "timeline" ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                  <span className={`block text-[11px] font-bold uppercase tracking-wider ${phase === "timeline" ? "text-white/50" : "text-slate-400"}`}>Part 1</span>
                  <span className="block text-[14px] font-bold">Your timeline</span>
                  <span className={`block text-xs ${phase === "timeline" ? "text-white/70" : "text-slate-500"}`}>{data.jobs.length ? `${data.jobs.length} ${data.jobs.length === 1 ? "company" : "companies"}${data.jobs.every((j) => j.checked) ? " · checked" : " · please check"}` : "Add your companies"}</span>
                </button>
                <button type="button" onClick={() => data.jobs.length && setPhase("details")} disabled={!data.jobs.length} className={`rounded-2xl px-4 py-3 text-left transition disabled:opacity-50 ${phase === "details" ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                  <span className={`block text-[11px] font-bold uppercase tracking-wider ${phase === "details" ? "text-white/50" : "text-slate-400"}`}>Part 2</span>
                  <span className="block text-[14px] font-bold">Details of each job</span>
                  <span className={`block text-xs ${phase === "details" ? "text-white/70" : "text-slate-500"}`}>{data.jobs.length ? `${doneJobs} of ${data.jobs.length} complete` : "After the timeline"}</span>
                </button>
              </div>
            )}

            {phase === "timeline" ? (
              <Timeline
                jobs={data.jobs}
                onChange={(jobs) => setData((d) => ({ ...d, jobs }))}
                onContinue={() => {
                  setData((d) => ({ ...d, jobs: d.jobs.map((j) => ({ ...j, checked: true })) }));
                  setPhase("details");
                  toTop();
                }}
              />
            ) : wizJob ? (
              <JobWizard
                key={`${wizJob.id}-${wiz?.step ?? ""}`}
                job={wizJob}
                index={wizIndex}
                total={data.jobs.length}
                pills={status2.map((x) => ({ id: x.j.id, state: x.miss.length === 0 ? ("done" as const) : ("pending" as const) }))}
                othersLeft={todo.filter((x) => x.j.id !== wizJob.id).length}
                next={(() => { const n = nextAfter(wizIndex, wizJob.id); return n ? { id: n.j.id, index: n.i, name: jobName(n.j, n.i) } : null; })()}
                onChange={setJob}
                onClose={() => { setWiz(null); toTop(); }}
                onOpenJob={(id) => openJob(id, "role")}
                onAllDone={() => go(2)}
                initialStep={wiz?.step}
              />
            ) : (
              <div className="cv-in space-y-4">
                <div className="px-1">
                  <h1 className="text-[26px] font-bold leading-tight text-slate-950">Details of each job</h1>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Fill in one job at a time, newest first. Each takes a few minutes. Your last two jobs matter most, so they get the most questions.</p>
                </div>

                <div className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70">
                  <p className="text-[15px] font-bold text-slate-950">{todo.length === 0 ? "All your jobs are complete" : `${doneJobs} of ${data.jobs.length} jobs complete`}</p>
                  <div className="mt-3 flex gap-1.5" aria-hidden>
                    {status2.map((x) => <span key={x.j.id} className={`h-2 flex-1 rounded-full ${x.miss.length === 0 ? "bg-emerald-500" : "bg-slate-200"}`} />)}
                  </div>
                  {todo.length > 0 ? (
                    <>
                      <p className="mt-3 text-[13.5px] leading-relaxed text-slate-600">{todo.length === 1 ? "1 job still needs details" : `${todo.length} jobs still need details`}, about {minutes} {minutes === 1 ? "minute" : "minutes"} in all.</p>
                      <button type="button" onClick={() => openJob(todo[0].j.id, todo[0].miss[0].id as StepId)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]">
                        {doneJobs === 0 && todo[0].i === 0 ? "Start" : "Continue with"} job {todo[0].i + 1} of {data.jobs.length}: {jobName(todo[0].j, todo[0].i)} <ArrowRight className="h-4 w-4 shrink-0" />
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => go(2)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-slate-800">
                      Continue to your story <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {status2.map(({ j, i, miss }) => {
                  const complete = miss.length === 0;
                  const lines = describeJob(j, i < 2).lines.filter((l) => !l.ghost);
                  return (
                    <button key={j.id} type="button" onClick={() => openJob(j.id, complete ? "role" : (miss[0].id as StepId))} className="group block w-full rounded-3xl border border-slate-200/70 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-slate-400 md:p-5">
                      <span className="flex items-start gap-3.5">
                        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${complete ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{complete ? <Check className="h-5 w-5" strokeWidth={3} /> : i + 1}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Job {i + 1} of {data.jobs.length}</span>
                            <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-bold ${complete ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{complete ? "Complete" : `Details pending (${miss.length})`}</span>
                          </span>
                          <span className="mt-1 block truncate text-[16px] font-bold text-slate-950">{jobName(j, i)}</span>
                          <span className="mt-0.5 block text-[13px] text-slate-500">{jobPeriod(j) || "Add the dates"}{j.city ? ` · ${j.city}` : ""}{j.positions.length > 1 ? ` · ${j.positions.length} roles here` : ""}</span>
                          {complete ? (
                            <span className="mt-2 block text-[13px] leading-relaxed text-slate-600">{lines[1]?.text ?? lines[0]?.text}</span>
                          ) : (
                            <span className="mt-2 block text-[13px] leading-relaxed text-amber-800">Still to add: {miss.map((k) => k.label.toLowerCase()).join(", ")}</span>
                          )}
                        </span>
                        <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                      </span>
                    </button>
                  );
                })}

                <button type="button" onClick={() => setPhase("timeline")} className="w-full rounded-2xl py-3 text-[13.5px] font-semibold text-slate-500 hover:text-slate-950">Something wrong with a company, role or date? Go back to your timeline</button>
                {todo.length > 0 && <button type="button" onClick={() => go(2)} className="w-full rounded-2xl py-2 text-[13.5px] font-semibold text-slate-400 hover:text-slate-700">Skip the rest for now and continue</button>}
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <div className="px-1 pb-1">
              <h1 className="text-[26px] font-bold leading-tight text-slate-950">Your story as a seller</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">A few quick taps, so the top of your CV sounds like you. Nothing here is compulsory.</p>
            </div>
            <Card title="How would a good manager describe the way you sell?" sub={`Pick up to five. ${data.story.strengths.length} chosen.`}>
              <MultiChips options={STRENGTHS} value={data.story.strengths} onChange={(v) => setS("strengths", v.slice(0, 5))} />
              <Field label="Your selling style"><PickChips options={STYLES} value={data.story.style} onChange={(v) => setS("style", v)} /></Field>
            </Card>
            <Card title="What are you known for?" sub="One line, in your own words. For example: closing enterprise deals faster than anyone on the team.">
              <input className={inputCls} value={data.story.knownFor} onChange={(e) => setS("knownFor", e.target.value)} placeholder="I am known for…" />
            </Card>
            <Card title="What do you want from your next role?" sub="Pick all that matter to you.">
              <MultiChips options={WANT_NEXT} value={data.story.wantNext} onChange={(v) => setS("wantNext", v)} own={false} />
            </Card>
            <Card title="Your CV headline (optional)" sub="The line at the very top of your CV. Write your own, or start from a suggestion and change it.">
              <textarea rows={2} className={inputCls} value={data.story.headline} onChange={(e) => setS("headline", e.target.value)} placeholder="For example: Enterprise SaaS seller who turns long sales cycles into repeat accounts." />
              <button type="button" onClick={suggestHeadline} disabled={!data.jobs.some(jobFilled)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13.5px] font-medium text-slate-700 transition hover:border-slate-900 disabled:opacity-40">
                <Wand2 className="h-3.5 w-3.5" /> Suggest a starting line from my jobs
              </button>
            </Card>
          </>
        )}

        {step === 3 && (
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
            </Card>
          </>
        )}

        {step === 4 && (
          <>
            <div className="px-1 pb-1">
              <h1 className="text-[26px] font-bold leading-tight text-slate-950">Check and send</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-slate-600">Have a quick look. You can go back to any step, and you can come back and change things after sending.</p>
            </div>
            <Card title="What we have">
              <dl className="space-y-3 text-[14px]">
                <div>
                  <div className="flex items-center justify-between"><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">You</dt><button onClick={() => go(0)} className="text-xs font-semibold text-slate-700 underline underline-offset-4">Edit</button></div>
                  <dd className="mt-1 flex items-center gap-3 text-slate-800">
                    {photo.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.url} alt="Your photo" className="h-12 w-12 rounded-xl object-cover" />
                    )}
                    <span>{[data.basics.name, data.basics.phone, data.basics.email, data.basics.city].filter(Boolean).join(" · ") || <span className="text-slate-400">Nothing added</span>}</span>
                  </dd>
                </div>
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
                <Sum k="Your story" v={[data.story.strengths.join(", "), data.story.style, data.story.knownFor].filter(Boolean).join(" · ")} onEdit={() => go(2)} />
                <Sum k="Next move" v={[data.targets.roles, data.targets.cities].filter(Boolean).join(" · ")} onEdit={() => go(3)} />
                <Sum k="Profile consent" v={consent ? "You allowed StaffAnchor to keep your profile" : "Not ticked (optional)"} onEdit={() => go(0)} />
              </dl>
            </Card>

            {(todo.length > 0 || !data.targets.roles.trim() || !data.basics.linkedin.trim()) && (
              <Card title={todo.length ? `${todo.reduce((a, x) => a + (x.i < 2 ? x.miss.length : 0), 0) || todo.length} key details are still missing` : "Almost there"} sub="You can send without them, but each one makes your CV stronger. Tap Add to fill one in.">
                <ul className="space-y-2.5 text-[14px] text-slate-700">
                  {todo.slice(0, 2).flatMap((x) => x.miss.map((k) => (
                    <li key={`${x.j.id}-${k.id}`} className="flex items-center justify-between gap-3"><span className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />{jobName(x.j, x.i)}: {k.label.toLowerCase()}</span><button onClick={() => openJob(x.j.id, k.id as StepId)} className="shrink-0 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white">Add</button></li>
                  )))}
                  {!data.targets.roles.trim() && <li className="flex items-center justify-between gap-3"><span className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />The role you are looking for</span><button onClick={() => go(3)} className="shrink-0 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white">Add</button></li>}
                  {!data.basics.linkedin.trim() && <li className="flex items-center justify-between gap-3"><span className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />Your LinkedIn link</span><button onClick={() => go(0)} className="shrink-0 rounded-full bg-slate-950 px-3.5 py-1.5 text-xs font-semibold text-white">Add</button></li>}
                </ul>
              </Card>
            )}

            <Card title="Anything else you want us to know?" sub="If there is something we have not asked about that should be in your CV, write it here. A project, a client win, a certification, a story. Anything.">
              <textarea rows={5} className={inputCls} value={data.extras.anything} onChange={(e) => setX("anything", e.target.value)} placeholder="Anything we missed that you would like in your CV…" />
            </Card>

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

      {step !== 1 && step < 4 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <button onClick={() => go(Math.max(0, step - 1))} disabled={step === 0} className="rounded-xl px-4 py-3 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 disabled:invisible">Back</button>
            <button onClick={() => go(step + 1)} className="flex-1 rounded-xl bg-slate-950 px-5 py-3.5 text-[15px] font-semibold text-white transition hover:bg-slate-800 sm:flex-none sm:px-10">{step === 3 ? "Review" : "Continue"}</button>
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
