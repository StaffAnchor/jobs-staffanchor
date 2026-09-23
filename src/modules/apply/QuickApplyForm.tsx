"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Phone } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { posthog } from "@/lib/posthog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import ApplicationQuestionsModal from "./ApplicationQuestionsModal";
import { fetchApplicationQuestions, buildAnswerPayload, type ApplicationQuestion, type ApplicationAnswerPayload } from "./applicationQuestions";
import { cityOptions, cityStateMap, roleTypeOptions, defaultNoticePeriods, ctcOptions, experienceOptions } from "@/modules/apply/options";

// Minimal, apply-button-only intake -- deliberately separate from
// ApplyForm.tsx (which stays exactly as-is for the optional "Build Your
// Profile" / "My Profile" edit flow). Captures only the handful of fields a
// candidate is realistically willing to fill at the moment they click
// Apply; everything else ApplyForm normally asks for (career timeline,
// sales motion, revenue snapshot, secondary specializations, etc.) is
// deferred to that flow entirely.
//
// Resume parsing runs the moment a file is attached and, once it resolves,
// silently folds the extracted extras (current employer/title/industry,
// qualification, skills, LinkedIn, category guess) straight into the submit
// payload -- no confirmation banner, no candidate-facing review step. Same
// /api/parse-resume-preview endpoint ApplyForm.tsx uses, just applied
// automatically instead of behind an "Apply to prefill" click. submit_candidate
// / quick_apply already treat a payload like this as a normal partial
// profile (status "awaiting_input" / "lead"), so nothing on the backend
// needs to change for this to work.
type ResumeExtraction = {
  full_name: string | null;
  phone: string | null;
  linkedin_url: string | null;
  current_employer: string | null;
  current_job_title: string | null;
  total_experience_years: number | null;
  highest_qualification: string | null;
  current_industry: string | null;
  skills: string[];
  category_guess: "b2b_sales" | "b2c_sales" | "non_sales" | "" | null;
};

type Props = {
  mandateId: string;
  mandateTitle?: string;
  initialEmail: string;
};

export default function QuickApplyForm({ mandateId, mandateTitle, initialEmail }: Props) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email] = useState(initialEmail);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [currentFixedCtc, setCurrentFixedCtc] = useState("");
  const [expectedFixedCtc, setExpectedFixedCtc] = useState("");
  const [cityChoice, setCityChoice] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [totalExperienceYears, setTotalExperienceYears] = useState("");
  const [roleType, setRoleType] = useState("");
  const [consent, setConsent] = useState(true);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Silent resume-extraction store -- never shown to the candidate, merged
  // into the payload at submit time only. Also used to backfill fullName /
  // phone / totalExperienceYears if the candidate hasn't typed them yet by
  // the time parsing finishes, so those fields can arrive pre-filled
  // without ever requiring a confirm click.
  const extractionRef = useRef<ResumeExtraction | null>(null);

  const [screeningQuestions, setScreeningQuestions] = useState<ApplicationQuestion[]>([]);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const screeningAnswersRef = useRef<ApplicationAnswerPayload[] | null>(null);

  useEffect(() => {
    fetchApplicationQuestions(mandateId).then(setScreeningQuestions);
  }, [mandateId]);

  async function handleResumeChange(file: File | null) {
    setResumeFile(file);
    if (!file) return;
    setResumeParsing(true);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/parse-resume-preview", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (json?.ok && json.fields) {
        const fields = json.fields as ResumeExtraction;
        extractionRef.current = fields;
        // Only fill fields the candidate hasn't already typed -- never
        // overwrite something they've entered themselves.
        setFullName((prev) => prev || fields.full_name || "");
        setPhone((prev) => prev || (fields.phone ? fields.phone.replace(/\D/g, "").slice(-10) : ""));
        setTotalExperienceYears((prev) =>
          prev || (fields.total_experience_years != null ? String(Math.min(41, Math.max(0, fields.total_experience_years))) : "")
        );
      }
    } catch {
      // Never block the candidate on a parsing failure -- resume still
      // uploads and submits normally, just without the silent prefill.
    } finally {
      setResumeParsing(false);
    }
  }

  function validate(): string | null {
    if (!fullName.trim()) return "Please enter your full name.";
    if (phone.replace(/\D/g, "").length !== 10) return "Please enter a valid 10-digit phone number.";
    if (!resumeFile) return "Please upload your resume.";
    if (!cityChoice) return "Please select your current location.";
    if (cityChoice === "Other" && !customCity.trim()) return "Please enter your city.";
    if (!currentFixedCtc) return "Please select your current fixed CTC.";
    if (!expectedFixedCtc) return "Please select your expected fixed CTC.";
    if (!noticePeriod) return "Please select your notice period.";
    if (!totalExperienceYears) return "Please select your total experience.";
    if (!roleType) return "Please select your current role type.";
    if (!consent) return "Please accept the consent checkbox to continue.";
    return null;
  }

  async function submitInternal() {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const safeName = (resumeFile as File).name
        .normalize("NFKD")
        .replace(/[^\w.\-]+/g, "_")
        .replace(/_+/g, "_");
      const path = `${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("resumes").upload(path, resumeFile as File, {
        contentType: (resumeFile as File).type || undefined,
      });
      if (uploadError) throw new Error(`Resume upload failed: ${uploadError.message}`);

      const extraction = extractionRef.current;
      const city = cityChoice === "Other" ? customCity.trim() : cityChoice;
      const state = cityChoice !== "Other" ? cityStateMap[cityChoice] : undefined;

      const payload = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        current_location: state ? `${city}, ${state}` : city,
        resume_file_url: path,
        total_experience_years: totalExperienceYears ? Math.min(Number(totalExperienceYears), 40) : null,
        current_fixed_ctc: currentFixedCtc ? Math.min(Number(currentFixedCtc), 120) : null,
        expected_fixed_ctc: expectedFixedCtc ? Math.min(Number(expectedFixedCtc), 120) : null,
        notice_period: noticePeriod || null,
        segment_data: {
          role_type: roleType === "Leading a Team" ? "Team Lead" : roleType === "Other" ? "Other" : "IC",
        },
        // Silent resume-parse fill -- never shown to or confirmed by the
        // candidate, folded straight into the submit per the intended
        // behavior (only the ~10 fields above are ever hand-typed).
        current_employer: extraction?.current_employer || null,
        current_job_title: extraction?.current_job_title || null,
        current_industry: extraction?.current_industry || null,
        highest_qualification: extraction?.highest_qualification || null,
        linkedin_url: extraction?.linkedin_url || null,
        skills: extraction?.skills?.length ? extraction.skills.join(", ") : null,
        // Left null on purpose: quick_apply() falls back to the mandate's own
        // category/sub_domain when this is blank, which is the right default
        // for a job-specific apply. Only override with the resume's own guess
        // when it actually resolved to something.
        category: extraction?.category_guess || null,
        consent: true,
        profile_stage: "applicant",
      };

      const submitRes = await fetch("/api/candidate-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          mandateId,
          ...(screeningAnswersRef.current?.length ? { screeningAnswers: screeningAnswersRef.current } : {}),
        }),
      });
      const submitJson = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) throw new Error(submitJson?.error ?? "Something went wrong. Please try again.");

      setSubmitted(true);
      toast.success("Your application is in. We'll be in touch.");
      posthog.capture("candidate_applied", { source: "quick_apply", fastPath: true, mandateId });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    if (screeningQuestions.length > 0 && screeningAnswersRef.current === null) {
      setShowScreeningModal(true);
      return;
    }
    void submitInternal();
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md py-10 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
        <h2 className="text-lg font-semibold text-slate-900">Application submitted</h2>
        <p className="mt-1 text-sm text-slate-500">
          A StaffAnchor recruiter will review your profile{mandateTitle ? ` for ${mandateTitle}` : ""} and reach out.
        </p>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="mx-auto grid max-w-xl gap-4">
      <FormField label="Full Name" required>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
      </FormField>

      <FormField label="Phone Number" required>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">+91</span>
          <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
          <Input
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit number"
            className="pl-10"
          />
        </div>
      </FormField>

      <FormField label="Email">
        <Input value={email} disabled className="bg-slate-50 text-slate-500" />
      </FormField>

      <FormField label="Resume" required>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => void handleResumeChange(e.target.files?.[0] ?? null)}
          className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />
        {resumeParsing && <p className="mt-1 text-xs text-slate-400">Reading your resume…</p>}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Current Fixed CTC" required>
          <Select value={currentFixedCtc} onChange={(e) => setCurrentFixedCtc(e.target.value)}>
            <option value="">Select</option>
            {ctcOptions.map((o) => (
              <option key={o.label} value={o.value ?? ""}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Expected Fixed CTC" required>
          <Select value={expectedFixedCtc} onChange={(e) => setExpectedFixedCtc(e.target.value)}>
            <option value="">Select</option>
            {ctcOptions.map((o) => (
              <option key={o.label} value={o.value ?? ""}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Current Location" required>
        <Select value={cityChoice} onChange={(e) => setCityChoice(e.target.value)}>
          <option value="">Select city</option>
          {cityOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        {cityChoice === "Other" && (
          <Input
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            placeholder="Enter your city"
            className="mt-2"
          />
        )}
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Notice Period" required>
          <Select value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)}>
            <option value="">Select</option>
            {defaultNoticePeriods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Total Experience" required>
          <Select value={totalExperienceYears} onChange={(e) => setTotalExperienceYears(e.target.value)}>
            <option value="">Select</option>
            {experienceOptions.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField label="Current Role Type" required>
        <Select value={roleType} onChange={(e) => setRoleType(e.target.value)}>
          <option value="">Select</option>
          {roleTypeOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </FormField>

      <label className="flex items-start gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
        I consent to StaffAnchor storing and sharing my profile with relevant employers.
      </label>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting…" : "Submit Application"}
      </Button>
      <p className="text-center text-[11px] text-slate-400">
        Want to add more detail (past roles, targets, LinkedIn) to stand out? You can complete your full profile anytime from My Desk after applying.
      </p>
    </form>
    {showScreeningModal && (
      <ApplicationQuestionsModal
        mandateTitle={mandateTitle}
        questions={screeningQuestions}
        submitting={submitting}
        onCancel={() => setShowScreeningModal(false)}
        onSubmit={(answers) => {
          screeningAnswersRef.current = buildAnswerPayload(screeningQuestions, answers);
          setShowScreeningModal(false);
          void submitInternal();
        }}
      />
    )}
    </>
  );
}
