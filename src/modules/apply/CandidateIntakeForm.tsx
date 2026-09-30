"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, FileText, Phone, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { posthog } from "@/lib/posthog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import SignInPanel from "@/modules/auth/SignInPanel";
import ApplicationQuestionsModal from "./ApplicationQuestionsModal";
import {
  fetchApplicationQuestions,
  buildAnswerPayload,
  type ApplicationQuestion,
  type ApplicationAnswerPayload,
} from "./applicationQuestions";
import {
  categoryOptions,
  cityOptions,
  cityStateMap,
  ctcOptions,
  defaultNoticePeriods,
  employmentStatusOptions,
  experienceOptions,
  level1OptionsForProfileType,
  relocationOptions,
  roleLevelOptions,
  roleTypeOptions,
  type CategoryValue,
} from "./options";

// The single, short intake shared by every way a candidate can enter the
// system: the Apply button on a job (anonymous or signed-in) and plain
// registration. Deliberately only the ~12 fields recruiters filter on first --
// everything deeper (career timeline, sales motion, revenue snapshot, ...)
// stays in the optional profile-completion flow inside My Account.
//
// Every dropdown reuses the existing option lists in ./options so values line
// up 1:1 with what the CRM, matching engine and the long profile form already
// store. Resume parsing runs the moment a file is attached: it fills name /
// phone / experience / profile-type when those are still empty, and silently
// folds the rest (employer, title, skills, ...) into the submit payload.

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

// Subset of a candidates row this form reads to pre-fill a signed-in candidate.
export type IntakeExistingRow = {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  resume_file_url?: string | null;
  current_location?: string | null;
  category?: string | null;
  sub_domain?: string | null;
  total_experience_years?: number | null;
  current_fixed_ctc?: number | null;
  expected_fixed_ctc?: number | null;
  current_employment_status?: string | null;
  open_to_relocation?: string | null;
  notice_period?: string | null;
  segment_data?: Record<string, unknown> | null;
};

// The fields this form collects, as a plain list of what's still blank on an
// existing row. Used by SignedInApplyCard / the portal to decide between "one
// click apply" (nothing missing) and "show the short form first".
export function intakeMissingFields(row: IntakeExistingRow): string[] {
  const missing: string[] = [];
  const seg = row.segment_data ?? {};
  if (!row.full_name?.trim()) missing.push("Name");
  if (!row.phone?.trim()) missing.push("Phone");
  if (!row.resume_file_url) missing.push("Resume");
  if (!row.current_location?.trim()) missing.push("Current city");
  if (!row.category) missing.push("Profile type");
  if (!row.sub_domain) missing.push("Practice");
  if (!(typeof seg.role_level === "string" && seg.role_level)) missing.push("Role level");
  if (!(typeof seg.role_type === "string" && seg.role_type)) missing.push("Role type");
  if (row.total_experience_years == null) missing.push("Total experience");
  if (row.current_fixed_ctc == null) missing.push("Current fixed CTC");
  if (!row.current_employment_status) missing.push("Employment status");
  if (!row.open_to_relocation) missing.push("Open to relocation");
  if (!row.notice_period) missing.push("Days to join");
  return missing;
}

// candidates.segment_data.role_type stores "IC" / "Team Lead" / a free label;
// the dropdown shows the longer labels.
function roleTypeToStored(label: string): string {
  return label === "Leading a Team" ? "Team Lead" : label === "Other" ? "Other" : "IC";
}
function roleTypeFromStored(stored: unknown): string {
  if (stored === "Team Lead") return "Leading a Team";
  if (stored === "IC") return "Individual Contributor (IC)";
  if (typeof stored === "string" && stored) return "Other";
  return "";
}

function splitLocation(loc: string | null | undefined): { choice: string; custom: string } {
  if (!loc) return { choice: "", custom: "" };
  const city = loc.split(",")[0].trim();
  if (city in cityStateMap) return { choice: city, custom: "" };
  return { choice: "Other", custom: city };
}

type Props = {
  // Present on the job Apply flow; absent on plain registration.
  mandateId?: string;
  mandateTitle?: string;
  email: string;
  // Signed-in candidate completing gaps: pre-fills, skips the "confirm your
  // email" step and reports back via onDone instead of showing its own
  // success screen.
  existing?: IntakeExistingRow | null;
  signedIn?: boolean;
  onDone?: () => void;
  // Where to send a newly registered candidate after they confirm their email.
  returnTo?: string;
};

export default function CandidateIntakeForm({
  mandateId,
  mandateTitle,
  email,
  existing,
  signedIn = false,
  onDone,
  returnTo,
}: Props) {
  const router = useRouter();
  const seg = (existing?.segment_data ?? {}) as Record<string, unknown>;
  const loc = splitLocation(existing?.current_location);

  const [fullName, setFullName] = useState(existing?.full_name ?? "");
  const [phone, setPhone] = useState((existing?.phone ?? "").replace(/\D/g, "").slice(-10));
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [category, setCategory] = useState<CategoryValue | "">((existing?.category as CategoryValue) ?? "");
  const [practice, setPractice] = useState(existing?.sub_domain ?? "");
  const [roleLevel, setRoleLevel] = useState(typeof seg.role_level === "string" ? seg.role_level : "");
  const [roleType, setRoleType] = useState(roleTypeFromStored(seg.role_type));
  const [totalExperienceYears, setTotalExperienceYears] = useState(
    existing?.total_experience_years != null ? String(existing.total_experience_years) : ""
  );
  const [currentFixedCtc, setCurrentFixedCtc] = useState(
    existing?.current_fixed_ctc != null ? String(existing.current_fixed_ctc) : ""
  );
  const [expectedFixedCtc, setExpectedFixedCtc] = useState(
    existing?.expected_fixed_ctc != null ? String(existing.expected_fixed_ctc) : ""
  );
  const [employmentStatus, setEmploymentStatus] = useState(existing?.current_employment_status ?? "");
  const [noticePeriod, setNoticePeriod] = useState(existing?.notice_period ?? "");
  const [cityChoice, setCityChoice] = useState(loc.choice);
  const [customCity, setCustomCity] = useState(loc.custom);
  const [relocation, setRelocation] = useState(existing?.open_to_relocation ?? "");
  const [consent, setConsent] = useState(true);

  const [noticePeriods, setNoticePeriods] = useState<string[]>(defaultNoticePeriods);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [skippedVerify, setSkippedVerify] = useState(false);

  const extractionRef = useRef<ResumeExtraction | null>(null);
  const [screeningQuestions, setScreeningQuestions] = useState<ApplicationQuestion[]>([]);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const screeningAnswersRef = useRef<ApplicationAnswerPayload[] | null>(null);

  const practiceOptions = useMemo(() => level1OptionsForProfileType(category || null), [category]);
  const practiceLabel =
    category === "b2b_sales" ? "Main Practice" : category === "b2c_sales" ? "Main Vertical" : category === "non_sales" ? "Main Function" : "Main Practice";
  const hasExistingResume = !!existing?.resume_file_url;

  useEffect(() => {
    if (mandateId) fetchApplicationQuestions(mandateId).then(setScreeningQuestions);
  }, [mandateId]);

  // Same admin-editable notice-period list the long profile form uses.
  useEffect(() => {
    supabase
      .from("app_config")
      .select("key, value")
      .eq("key", "notice_periods")
      .then(({ data, error }) => {
        const row = data?.[0];
        if (!error && Array.isArray(row?.value) && row.value.length) setNoticePeriods(row.value as string[]);
      });
  }, []);

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
        // Only ever fill blanks -- never overwrite something already typed.
        setFullName((prev) => prev || fields.full_name || "");
        setPhone((prev) => prev || (fields.phone ? fields.phone.replace(/\D/g, "").slice(-10) : ""));
        setTotalExperienceYears(
          (prev) =>
            prev ||
            (fields.total_experience_years != null
              ? String(Math.min(41, Math.max(0, Math.round(fields.total_experience_years))))
              : "")
        );
        if (fields.category_guess) setCategory((prev) => prev || (fields.category_guess as CategoryValue));
      }
    } catch {
      // Never block on a parse failure -- the resume still uploads and submits.
    } finally {
      setResumeParsing(false);
    }
  }

  function validate(): string | null {
    if (!fullName.trim()) return "Please enter your full name.";
    if (phone.replace(/\D/g, "").length !== 10) return "Please enter a valid 10-digit phone number.";
    if (!resumeFile && !hasExistingResume) return "Please upload your resume.";
    if (!category) return "Please select your profile type (B2B Sales, B2C Sales or Non-Sales).";
    if (!practice) return `Please select your ${practiceLabel.toLowerCase()}.`;
    if (!roleLevel) return "Please select your role level.";
    if (!roleType) return "Please select your current role type.";
    if (!totalExperienceYears) return "Please select your total experience.";
    if (!currentFixedCtc) return "Please select your current fixed CTC.";
    if (!employmentStatus) return "Please select your employment status.";
    if (!noticePeriod) return "Please select how soon you can join.";
    if (!cityChoice) return "Please select your current city.";
    if (cityChoice === "Other" && !customCity.trim()) return "Please enter your city.";
    if (!relocation) return "Please tell us if you're open to relocation.";
    if (!consent) return "Please accept the consent checkbox to continue.";
    return null;
  }

  async function submitInternal() {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      let resumePath = existing?.resume_file_url ?? null;
      if (resumeFile) {
        const safeName = resumeFile.name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_");
        const path = `${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("resumes").upload(path, resumeFile, {
          contentType: resumeFile.type || undefined,
        });
        if (uploadError) throw new Error(`Resume upload failed: ${uploadError.message}`);
        resumePath = path;
      }

      const extraction = extractionRef.current;
      const city = cityChoice === "Other" ? customCity.trim() : cityChoice;
      const state = cityChoice !== "Other" ? cityStateMap[cityChoice] : undefined;

      const payload: Record<string, unknown> = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        current_location: state ? `${city}, ${state}` : city,
        resume_file_url: resumePath,
        category,
        // Level 1 of the taxonomy (Practice / Vertical / Function) is what the
        // long profile form stores in sub_domain too.
        sub_domain: practice,
        total_experience_years: Math.min(Number(totalExperienceYears), 40),
        current_fixed_ctc: Math.min(Number(currentFixedCtc), 120),
        expected_fixed_ctc: expectedFixedCtc ? Math.min(Number(expectedFixedCtc), 120) : null,
        current_employment_status: employmentStatus,
        notice_period: noticePeriod,
        open_to_relocation: relocation,
        segment_data: {
          role_level: roleLevel,
          role_type: roleTypeToStored(roleType),
        },
        // Silent resume-parse fill -- never shown to or confirmed by the candidate.
        current_employer: extraction?.current_employer || null,
        current_job_title: extraction?.current_job_title || null,
        current_industry: extraction?.current_industry || null,
        highest_qualification: extraction?.highest_qualification || null,
        linkedin_url: extraction?.linkedin_url || null,
        skills: extraction?.skills?.length ? extraction.skills.join(", ") : null,
        consent: true,
        profile_stage: mandateId ? "applicant" : "lead",
      };

      const submitRes = await fetch("/api/candidate-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          ...(mandateId ? { mandateId } : {}),
          ...(screeningAnswersRef.current?.length ? { screeningAnswers: screeningAnswersRef.current } : {}),
          // Anonymous candidates get a sign-in code on the success screen, so
          // the separate "welcome, here's how to sign back in" email would
          // just be a second, redundant message seconds later.
          skipWelcomeEmail: !signedIn,
        }),
      });
      const submitJson = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) throw new Error(submitJson?.error ?? "Something went wrong. Please try again.");

      posthog.capture(mandateId ? "candidate_applied" : "candidate_registered", {
        source: "intake_form",
        signedIn,
        ...(mandateId ? { mandateId } : {}),
      });
      toast.success(mandateId ? "Your application is in. We'll be in touch." : "You're registered.");
      if (signedIn && onDone) {
        onDone();
        return;
      }
      setSubmitted(true);
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
    if (mandateId && screeningQuestions.length > 0 && screeningAnswersRef.current === null) {
      setShowScreeningModal(true);
      return;
    }
    void submitInternal();
  }

  // Once the code is verified there's a real session: registration continues
  // into My Account, an application returns to the job (which now shows the
  // signed-in "applied" state).
  function handleVerified() {
    if (mandateId) {
      window.location.assign(`/jobs/${mandateId}`);
    } else {
      router.push(returnTo ?? "/candidate-portal");
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md py-6">
        <div className="text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <h2 className="text-lg font-semibold text-slate-900">
            {mandateId ? "Application submitted" : "You're registered"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {mandateId
              ? `A StaffAnchor recruiter will review your profile${mandateTitle ? ` for ${mandateTitle}` : ""} and reach out.`
              : "A StaffAnchor recruiter will review your profile and reach out when a role fits."}
          </p>
        </div>
        {!skippedVerify ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SignInPanel
              email={email}
              onSignedIn={handleVerified}
              onBack={() => setSkippedVerify(true)}
              backLabel="Skip for now"
              eyebrow="One last step"
              title="Confirm your email"
              blurb={
                <>
                  We sent a 6-digit code to <span className="font-medium text-slate-700">{email}</span>. Enter it to
                  open your account, track your applications and finish your profile.
                </>
              }
              allowPassword={false}
            />
          </div>
        ) : (
          <p className="mt-6 text-center text-xs text-slate-400">
            You can sign in any time from{" "}
            <a href="/candidate-login" className="font-medium text-blue-600 hover:underline">
              Sign Up / Login
            </a>{" "}
            with an email code.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto grid max-w-2xl gap-6">
        {!signedIn && (
          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Takes about a minute. Upload your resume first — we&apos;ll fill in what we can.
          </p>
        )}
        {signedIn && existing && (
          <p className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <Sparkles className="h-3.5 w-3.5" />
            We&apos;ve pre-filled what we already have — just complete the blanks.
          </p>
        )}

        <fieldset className="grid gap-4">
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">About you</legend>

          <FormField label="Resume" required={!hasExistingResume}>
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-slate-50/60 px-3 py-3 text-sm text-slate-600 hover:border-slate-400">
              <FileText className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate">
                {resumeFile ? resumeFile.name : hasExistingResume ? "Resume on file — choose a file to replace it" : "Upload PDF or Word (.pdf, .doc, .docx)"}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => void handleResumeChange(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>
            {resumeParsing && <p className="mt-1 text-xs text-slate-400">Reading your resume…</p>}
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full Name" required>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" autoComplete="name" />
            </FormField>
            <FormField label="Phone Number" required>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">+91</span>
                <Phone className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
                <Input
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit number"
                  className="pl-10"
                />
              </div>
            </FormField>
          </div>

          <FormField label="Email">
            <Input value={email} disabled className="bg-slate-50 text-slate-500" />
          </FormField>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Your role</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Profile Type" required>
              <Select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as CategoryValue | "");
                  setPractice("");
                }}
              >
                <option value="">Select</option>
                {categoryOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label={practiceLabel} required>
              <Select value={practice} onChange={(e) => setPractice(e.target.value)} disabled={!category}>
                <option value="">{category ? "Select" : "Choose profile type first"}</option>
                {practiceOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Role Level" required>
              <Select value={roleLevel} onChange={(e) => setRoleLevel(e.target.value)}>
                <option value="">Select</option>
                {roleLevelOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Current Role Type" required>
              <Select value={roleType} onChange={(e) => setRoleType(e.target.value)}>
                <option value="">Select</option>
                {roleTypeOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
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
            <FormField label="Employment Status" required>
              <Select value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value)}>
                <option value="">Select</option>
                {employmentStatusOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Days to Join" required>
              <Select value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)}>
                <option value="">Select</option>
                {noticePeriods.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </fieldset>

        <fieldset className="grid gap-4">
          <legend className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Location</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Current City" required>
              <Select value={cityChoice} onChange={(e) => setCityChoice(e.target.value)}>
                <option value="">Select city</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
              {cityChoice === "Other" && (
                <Input value={customCity} onChange={(e) => setCustomCity(e.target.value)} placeholder="Enter your city" className="mt-2" />
              )}
            </FormField>
            <FormField label="Open to Relocation" required>
              <Select value={relocation} onChange={(e) => setRelocation(e.target.value)}>
                <option value="">Select</option>
                {relocationOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        </fieldset>

        <FormField label="Expected Fixed CTC (optional)">
          <Select value={expectedFixedCtc} onChange={(e) => setExpectedFixedCtc(e.target.value)} className="sm:max-w-[calc(50%-0.5rem)]">
            <option value="">Skip — discuss later</option>
            {ctcOptions.map((o) => (
              <option key={o.label} value={o.value ?? ""}>
                {o.label}
              </option>
            ))}
          </Select>
        </FormField>

        <label className="flex items-start gap-2 text-xs text-slate-500">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          I consent to StaffAnchor storing and sharing my profile with relevant employers.
        </label>

        {errorMsg && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{errorMsg}</p>}

        <Button type="submit" disabled={submitting || resumeParsing} className="w-full">
          {submitting ? "Submitting…" : mandateId ? "Submit Application" : "Create My Profile"}
        </Button>
        <p className="text-center text-[11px] text-slate-400">
          Want to stand out with more detail (past roles, targets, LinkedIn)? You can complete your full profile any time from My Account.
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
