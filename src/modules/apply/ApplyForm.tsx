"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import {
  b2bSubDomains,
  b2cSubDomains,
  categoryOptions,
  customerSegmentOptions,
  dealSizeOptions,
  defaultNoticePeriods,
  employmentStatusOptions,
  funnelStageOptions,
  highestQualificationOptions,
  nonSalesSubDomains,
  relocationOptions,
  roleLevelOptions,
  salesCycleOptions,
  salesMotionOptions,
  sellingStyleOptions,
  subDomainsForCategory,
  ticketSizeOptions,
  workModeOptions,
  type CategoryValue,
} from "@/modules/apply/options";

const FALLBACK_QUOTES = [
  "Every great career move starts with five honest minutes. Let's get yours on record.",
  "A little context now saves both of us the back-and-forth later.",
  "Specialists get remembered. Generalists get overlooked. Tell us your specialty.",
  "Numbers don't lie, and neither do targets. Let's get yours down accurately.",
  "Almost there — let's talk about where you want to go next.",
];

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  linkedinUrl: string;
  currentEmployer: string;
  currentJobTitle: string;
  currentEmploymentStatus: string;
  totalExperienceYears: string;
  currentFixedCtc: string;
  currentVariableCtc: string;
  esopsHeld: boolean;
  noticePeriod: string;
  expectedFixedCtc: string;
  expectedVariableCtc: string;
  highestQualification: string;
  industries: string;
  workMode: string;
  openToRelocation: string;
  category: CategoryValue | "";
  subDomain: string;
  secondarySubDomains: string[];
  roleLevel: string;
  dealSize: string;
  ticketSize: string;
  cycle: string;
  motion: string[];
  style: string;
  segment: string;
  funnel: string;
  scope: string;
  quotaY1: string;
  quotaY2: string;
  quotaY3: string;
  bestWin: string;
  toughLoss: string;
  skills: string;
  consent: boolean;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  currentLocation: "",
  linkedinUrl: "",
  currentEmployer: "",
  currentJobTitle: "",
  currentEmploymentStatus: "",
  totalExperienceYears: "",
  currentFixedCtc: "",
  currentVariableCtc: "",
  esopsHeld: false,
  noticePeriod: "",
  expectedFixedCtc: "",
  expectedVariableCtc: "",
  highestQualification: "",
  industries: "",
  workMode: "",
  openToRelocation: "",
  category: "",
  subDomain: "",
  secondarySubDomains: [],
  roleLevel: "",
  dealSize: "",
  ticketSize: "",
  cycle: "",
  motion: [],
  style: "",
  segment: "",
  funnel: "",
  scope: "",
  quotaY1: "",
  quotaY2: "",
  quotaY3: "",
  bestWin: "",
  toughLoss: "",
  skills: "",
  consent: false,
};

const STEPS = ["Identity", "Career & Comp", "Specialization", "Track Record", "Logistics & Submit"] as const;

export default function ApplyForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormState>(initialState);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<string[]>(FALLBACK_QUOTES);
  const [noticePeriods, setNoticePeriods] = useState<string[]>(defaultNoticePeriods);

  useEffect(() => {
    supabase
      .from("app_config")
      .select("key, value")
      .in("key", ["quotes", "notice_periods"])
      .then(({ data, error }) => {
        if (error || !data) return;
        const quotesRow = data.find((r) => r.key === "quotes");
        const noticeRow = data.find((r) => r.key === "notice_periods");
        if (Array.isArray(quotesRow?.value) && quotesRow.value.length) setQuotes(quotesRow.value);
        if (Array.isArray(noticeRow?.value) && noticeRow.value.length) setNoticePeriods(noticeRow.value);
      });
  }, []);

  const quote = useMemo(() => quotes[step % quotes.length], [quotes, step]);
  const subDomainOptions = subDomainsForCategory(values.category || null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayValue(key: "secondarySubDomains" | "motion", value: string) {
    setValues((prev) => {
      const current = prev[key];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!values.fullName.trim()) return "Full name is required.";
      if (!/^\S+@\S+\.\S+$/.test(values.email)) return "A valid email is required.";
      if (!values.phone.trim()) return "Phone number is required.";
    }
    if (step === 1) {
      if (!values.currentEmploymentStatus) return "Employment status is required.";
      if (!values.totalExperienceYears) return "Total experience is required.";
    }
    if (step === 2) {
      if (!values.category) return "Please select a category.";
      if (!values.subDomain) return "Please select your primary specialization.";
      if (!values.roleLevel) return "Please select your role level.";
    }
    if (step === 4) {
      if (!values.consent) return "Please confirm consent to continue.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setErrorMsg(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    const err = validateStep();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      let resumeFileUrl: string | null = null;
      if (resumeFile) {
        const path = `${crypto.randomUUID()}-${resumeFile.name}`;
        const { error: uploadError } = await supabase.storage.from("resumes").upload(path, resumeFile, {
          contentType: resumeFile.type || undefined,
        });
        if (uploadError) throw new Error(`Resume upload failed: ${uploadError.message}`);
        resumeFileUrl = `resumes/${path}`;
      }

      const segmentData: Record<string, unknown> = { role_level: values.roleLevel };
      const quota = [values.quotaY1, values.quotaY2, values.quotaY3]
        .filter((v) => v.trim() !== "")
        .map((v) => Number(v));
      if (quota.length) segmentData.quota = quota;

      if (values.category === "b2b_sales") {
        Object.assign(segmentData, {
          deal_size: values.dealSize || undefined,
          cycle: values.cycle || undefined,
          style: values.style || undefined,
          motion: values.motion.length ? values.motion : undefined,
          segment: values.segment || undefined,
        });
      } else if (values.category === "b2c_sales") {
        Object.assign(segmentData, {
          ticket: values.ticketSize || undefined,
          funnel: values.funnel || undefined,
          scope: values.scope || undefined,
        });
      }

      const payload = {
        full_name: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        current_location: values.currentLocation || null,
        linkedin_url: values.linkedinUrl || null,
        resume_file_url: resumeFileUrl,
        current_employer: values.currentEmployer || null,
        current_job_title: values.currentJobTitle || null,
        current_employment_status: values.currentEmploymentStatus || null,
        total_experience_years: values.totalExperienceYears ? Number(values.totalExperienceYears) : null,
        current_fixed_ctc: values.currentFixedCtc ? Number(values.currentFixedCtc) : null,
        current_variable_ctc: values.currentVariableCtc ? Number(values.currentVariableCtc) : null,
        esops_held: values.esopsHeld,
        notice_period: values.noticePeriod || null,
        expected_fixed_ctc: values.expectedFixedCtc ? Number(values.expectedFixedCtc) : null,
        expected_variable_ctc: values.expectedVariableCtc ? Number(values.expectedVariableCtc) : null,
        category: values.category || null,
        sub_domain: values.subDomain || null,
        secondary_sub_domains: values.secondarySubDomains,
        segment_data: segmentData,
        self_assessment: {
          best: values.bestWin || undefined,
          lost: values.toughLoss || undefined,
        },
        open_to_relocation: values.openToRelocation || null,
        work_mode: values.workMode || null,
        highest_qualification: values.highestQualification || null,
        industries: values.industries
          ? values.industries.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        skills: values.skills || null,
        consent: values.consent,
      };

      const { error } = await supabase.rpc("submit_candidate", { payload });
      if (error) throw new Error(error.message);

      setSubmitted(true);
      toast.success("Your profile is on record. Thank you.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto flex w-full max-w-xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardContent className="space-y-3 py-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900">You&apos;re on record.</h2>
            <p className="text-sm text-slate-600">
              Thanks, {values.fullName.split(" ")[0] || "there"}. A StaffAnchor recruiter will review your profile
              and reach out if there&apos;s a mandate fit. No spam, no cold calls for irrelevant roles.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </span>
        <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Build Your Profile</CardTitle>
          <p className="mt-1 text-sm italic text-slate-500">&ldquo;{quote}&rdquo;</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <FormField label="Full Name" required>
                <Input value={values.fullName} onChange={(e) => update("fullName", e.target.value)} />
              </FormField>
              <FormField label="Email" required>
                <Input type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
              </FormField>
              <FormField label="Phone" required>
                <Input
                  inputMode="numeric"
                  maxLength={15}
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </FormField>
              <FormField label="Current Location">
                <Input value={values.currentLocation} onChange={(e) => update("currentLocation", e.target.value)} />
              </FormField>
              <FormField label="LinkedIn Profile URL">
                <Input value={values.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} />
              </FormField>
              <FormField label="Resume (PDF or DOCX)">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  className="text-sm"
                />
              </FormField>
            </>
          )}

          {step === 1 && (
            <>
              <FormField label="Current Employer">
                <Input value={values.currentEmployer} onChange={(e) => update("currentEmployer", e.target.value)} />
              </FormField>
              <FormField label="Current Job Title">
                <Input value={values.currentJobTitle} onChange={(e) => update("currentJobTitle", e.target.value)} />
              </FormField>
              <FormField label="Employment Status" required>
                <Select
                  value={values.currentEmploymentStatus}
                  onChange={(e) => update("currentEmploymentStatus", e.target.value)}
                >
                  <option value="">Select...</option>
                  {employmentStatusOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Total Experience (years)" required>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={values.totalExperienceYears}
                  onChange={(e) => update("totalExperienceYears", e.target.value)}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Current Fixed CTC (LPA)">
                  <Input
                    type="number"
                    value={values.currentFixedCtc}
                    onChange={(e) => update("currentFixedCtc", e.target.value)}
                  />
                </FormField>
                <FormField label="Current Variable CTC (LPA)">
                  <Input
                    type="number"
                    value={values.currentVariableCtc}
                    onChange={(e) => update("currentVariableCtc", e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="ESOPs Held">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={values.esopsHeld}
                    onChange={(e) => update("esopsHeld", e.target.checked)}
                  />
                  Yes, I currently hold ESOPs
                </label>
              </FormField>
              {values.currentEmploymentStatus === "Serving Notice" || values.currentEmploymentStatus === "Employed" ? (
                <FormField label="Notice Period">
                  <Select value={values.noticePeriod} onChange={(e) => update("noticePeriod", e.target.value)}>
                    <option value="">Select...</option>
                    {noticePeriods.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </FormField>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Expected Fixed CTC (LPA)">
                  <Input
                    type="number"
                    value={values.expectedFixedCtc}
                    onChange={(e) => update("expectedFixedCtc", e.target.value)}
                  />
                </FormField>
                <FormField label="Expected Variable CTC (LPA)">
                  <Input
                    type="number"
                    value={values.expectedVariableCtc}
                    onChange={(e) => update("expectedVariableCtc", e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Highest Qualification">
                <Select
                  value={values.highestQualification}
                  onChange={(e) => update("highestQualification", e.target.value)}
                >
                  <option value="">Select...</option>
                  {highestQualificationOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
            </>
          )}

          {step === 2 && (
            <>
              <FormField label="Category" required>
                <Select
                  value={values.category}
                  onChange={(e) => {
                    const next = e.target.value as CategoryValue | "";
                    update("category", next);
                    update("subDomain", "");
                    update("secondarySubDomains", []);
                  }}
                >
                  <option value="">Select...</option>
                  {categoryOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              {values.category && (
                <>
                  <FormField label="Primary Specialization" required>
                    <Select value={values.subDomain} onChange={(e) => update("subDomain", e.target.value)}>
                      <option value="">Select...</option>
                      {subDomainOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Secondary Specializations (optional)">
                    <div className="grid gap-1.5">
                      {subDomainOptions
                        .filter((o) => o !== values.subDomain)
                        .map((o) => (
                          <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={values.secondarySubDomains.includes(o)}
                              onChange={() => toggleArrayValue("secondarySubDomains", o)}
                            />
                            {o}
                          </label>
                        ))}
                    </div>
                  </FormField>

                  <FormField label="Role Level" required>
                    <Select value={values.roleLevel} onChange={(e) => update("roleLevel", e.target.value)}>
                      <option value="">Select...</option>
                      {roleLevelOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  {values.category === "b2b_sales" && (
                    <>
                      <FormField label="Typical Deal Size">
                        <Select value={values.dealSize} onChange={(e) => update("dealSize", e.target.value)}>
                          <option value="">Select...</option>
                          {dealSizeOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Typical Sales Cycle">
                        <Select value={values.cycle} onChange={(e) => update("cycle", e.target.value)}>
                          <option value="">Select...</option>
                          {salesCycleOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Selling Style">
                        <Select value={values.style} onChange={(e) => update("style", e.target.value)}>
                          <option value="">Select...</option>
                          {sellingStyleOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Sales Motion (select all that apply)">
                        <div className="grid gap-1.5">
                          {salesMotionOptions.map((o) => (
                            <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={values.motion.includes(o)}
                                onChange={() => toggleArrayValue("motion", o)}
                              />
                              {o}
                            </label>
                          ))}
                        </div>
                      </FormField>
                      <FormField label="Customer Segment">
                        <Select value={values.segment} onChange={(e) => update("segment", e.target.value)}>
                          <option value="">Select...</option>
                          {customerSegmentOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    </>
                  )}

                  {values.category === "b2c_sales" && (
                    <>
                      <FormField label="Typical Ticket Size">
                        <Select value={values.ticketSize} onChange={(e) => update("ticketSize", e.target.value)}>
                          <option value="">Select...</option>
                          {ticketSizeOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Funnel Stage">
                        <Select value={values.funnel} onChange={(e) => update("funnel", e.target.value)}>
                          <option value="">Select...</option>
                          {funnelStageOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Geographic Scope">
                        <Input
                          placeholder="e.g. single city, multi-city, pan-India"
                          value={values.scope}
                          onChange={(e) => update("scope", e.target.value)}
                        />
                      </FormField>
                    </>
                  )}
                </>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-slate-600">
                If applicable, share your last 3 years&apos; quota attainment (%). Leave blank if not applicable.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Year 1">
                  <Input type="number" value={values.quotaY1} onChange={(e) => update("quotaY1", e.target.value)} />
                </FormField>
                <FormField label="Year 2">
                  <Input type="number" value={values.quotaY2} onChange={(e) => update("quotaY2", e.target.value)} />
                </FormField>
                <FormField label="Year 3">
                  <Input type="number" value={values.quotaY3} onChange={(e) => update("quotaY3", e.target.value)} />
                </FormField>
              </div>
              <FormField label="Tell us about your best win">
                <textarea
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  value={values.bestWin}
                  onChange={(e) => update("bestWin", e.target.value)}
                />
              </FormField>
              <FormField label="Tell us about a target you missed, and what you learned">
                <textarea
                  className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                  value={values.toughLoss}
                  onChange={(e) => update("toughLoss", e.target.value)}
                />
              </FormField>
            </>
          )}

          {step === 4 && (
            <>
              <FormField label="Key Skills / Tools (comma-separated)">
                <Input value={values.skills} onChange={(e) => update("skills", e.target.value)} />
              </FormField>
              <FormField label="Industries Worked In (comma-separated)">
                <Input value={values.industries} onChange={(e) => update("industries", e.target.value)} />
              </FormField>
              <FormField label="Work Mode Preference">
                <Select value={values.workMode} onChange={(e) => update("workMode", e.target.value)}>
                  <option value="">Select...</option>
                  {workModeOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Open to Relocation">
                <Select value={values.openToRelocation} onChange={(e) => update("openToRelocation", e.target.value)}>
                  <option value="">Select...</option>
                  {relocationOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Consent" required>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={values.consent}
                    onChange={(e) => update("consent", e.target.checked)}
                  />
                  I consent to StaffAnchor storing my profile and sharing it, in confidence, with recruiters against
                  relevant sales mandates.
                </label>
              </FormField>
            </>
          )}

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={goBack} disabled={step === 0 || submitting}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext}>
                Continue
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit My Profile"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
