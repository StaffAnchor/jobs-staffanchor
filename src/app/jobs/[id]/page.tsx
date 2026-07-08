"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, CheckCircle2, IndianRupee, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/forms/form-field";
import { Spinner } from "@/components/ui/spinner";
import {
  getOpenJob,
  submitQuickApply,
  categoryLabel,
  budgetLabel,
  experienceLabel,
  type JobListing,
} from "@/modules/jobs/api";
import {
  cityOptions,
  cityStateMap,
  ctcOptions,
  experienceOptions,
  defaultNoticePeriods,
  employmentStatusOptions,
  industryOptions,
  roleTypeOptions,
  teamSizeOptions,
  categoryOptions,
  subDomainsForCategory,
  type CategoryValue,
} from "@/modules/apply/options";
import { supabase } from "@/lib/supabaseClient";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  cityChoice: string;
  customCity: string;
  currentFixedCtc: string;
  totalExperienceYears: string;
  noticePeriod: string;
  currentJobTitle: string;
  currentEmployer: string;
  employmentStatus: string;
  currentIndustry: string;
  category: CategoryValue | "";
  subDomain: string;
  subDomainOther: string;
  roleType: string;
  teamSize: string;
  consent: boolean;
};

const initialState: FormState = {
  fullName: "",
  email: "",
  phone: "",
  cityChoice: "",
  customCity: "",
  currentFixedCtc: "",
  totalExperienceYears: "",
  noticePeriod: "",
  currentJobTitle: "",
  currentEmployer: "",
  employmentStatus: "",
  currentIndustry: "",
  category: "",
  subDomain: "",
  subDomainOther: "",
  roleType: "",
  teamSize: "",
  consent: false,
};

export default function QuickApplyPage() {
  const params = useParams<{ id: string }>();
  const mandateId = params.id;

  const [job, setJob] = useState<JobListing | null | undefined>(undefined);
  const [values, setValues] = useState<FormState>(initialState);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getOpenJob(mandateId)
      .then(setJob)
      .catch(() => setJob(null));
  }, [mandateId]);

  const resolvedCity = useMemo(() => {
    if (values.cityChoice === "Other") return values.customCity.trim();
    return values.cityChoice;
  }, [values.cityChoice, values.customCity]);

  const subDomainOptions = useMemo(
    () => subDomainsForCategory(values.category || null),
    [values.category]
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function validate(): string | null {
    if (!values.fullName.trim()) return "Full name is required.";
    if (!values.email.trim() || !values.email.includes("@")) return "A valid email is required.";
    if (!/^\d{10}$/.test(values.phone.replace(/\D/g, ""))) return "A valid 10-digit phone number is required.";
    if (!resolvedCity) return "Current city is required.";
    if (!values.currentFixedCtc) return "Current fixed CTC is required.";
    if (!values.totalExperienceYears) return "Total experience is required.";
    if (!values.noticePeriod) return "Notice period is required.";
    if (!values.currentJobTitle.trim()) return "Current job title is required.";
    if (!values.currentEmployer.trim()) return "Current employer is required.";
    if (!values.employmentStatus) return "Employment status is required.";
    if (!values.currentIndustry) return "Current industry is required.";
    if (!values.roleType) return "Please select whether you are an IC or leading a team.";
    if (values.roleType === "Leading a Team" && !values.teamSize) return "Please select your team size.";
    if (!values.category) return "Please select your category.";
    if (!values.subDomain) return "Please select your sub-domain.";
    if (values.subDomain === "Other" && !values.subDomainOther.trim()) return "Please specify your sub-domain.";
    if (!resumeFile) return "Please upload your resume.";
    if (!values.consent) return "Please confirm you're okay with StaffAnchor contacting you.";
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const segmentData: Record<string, unknown> = {
        role_type: values.roleType === "Leading a Team" ? "Team Lead" : "IC",
      };
      if (values.roleType === "Leading a Team" && values.teamSize) {
        segmentData.team_size = values.teamSize;
      }

      let resumeFileUrl: string | null = null;
      if (resumeFile) {
        const path = `${crypto.randomUUID()}-${resumeFile.name}`;
        const { error: uploadError } = await supabase.storage.from("resumes").upload(path, resumeFile, {
          contentType: resumeFile.type || undefined,
        });
        if (uploadError) throw new Error(`Resume upload failed: ${uploadError.message}`);
        resumeFileUrl = path;
      }

      const resolvedSubDomain = values.subDomain === "Other" ? values.subDomainOther.trim() : values.subDomain;

      await submitQuickApply(mandateId, {
        full_name: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.replace(/\D/g, "").slice(-10),
        current_location: resolvedCity,
        current_fixed_ctc: values.currentFixedCtc ? Number(values.currentFixedCtc) : null,
        total_experience_years: values.totalExperienceYears ? Number(values.totalExperienceYears) : null,
        notice_period: values.noticePeriod,
        current_job_title: values.currentJobTitle.trim(),
        current_employer: values.currentEmployer.trim(),
        current_employment_status: values.employmentStatus,
        current_industry: values.currentIndustry,
        category: values.category,
        sub_domain: resolvedSubDomain,
        resume_file_url: resumeFileUrl,
        segment_data: segmentData,
        consent: values.consent,
      });
      setSubmitted(true);
      toast.success("Application submitted — a recruiter will be in touch.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (job === undefined) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6">
        <Briefcase className="mx-auto mb-3 h-6 w-6 text-slate-300" />
        <h1 className="text-lg font-semibold text-slate-900">This role isn&apos;t accepting applications</h1>
        <p className="mt-1 text-sm text-slate-500">It may have been filled or closed.</p>
        <Link href="/jobs" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to open roles
          </Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-500" />
        <h1 className="text-xl font-semibold text-slate-900">Application received</h1>
        <p className="mt-2 text-sm text-slate-500">
          Thanks, {values.fullName.split(" ")[0]}. A StaffAnchor recruiter will reach out to complete the rest of
          your profile and discuss next steps for the {job.role_title ?? "role"} opening.
        </p>
        <Link href="/jobs" className="mt-6 inline-block">
          <Button variant="outline">Browse more roles</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/jobs" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to open roles
      </Link>

      <Card className="mb-6">
        <CardContent className="p-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-blue-600">{categoryLabel(job.category)}</p>
          <h1 className="mt-1 text-xl font-semibold text-slate-900">{job.role_title ?? "Sales Role"}</h1>
          {job.client_display && <p className="text-sm font-medium text-slate-600">{job.client_display}</p>}
          {job.sub_domain && <p className="text-sm text-slate-500">{job.sub_domain}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-[13px] text-slate-500">
            {job.city && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3.5 w-3.5" /> {budgetLabel(job.budget_min, job.budget_max)}
            </span>
            {experienceLabel(job.experience_min, job.experience_max) && (
              <span>{experienceLabel(job.experience_min, job.experience_max)} experience</span>
            )}
          </div>
          {job.job_description && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500">Job description</p>
              <p className="whitespace-pre-wrap text-[13px] leading-6 text-slate-600">{job.job_description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-1 text-base font-semibold text-slate-900">Quick Apply</h2>
          <p className="mb-5 text-sm text-slate-500">
            Just the basics for now — under a minute. A recruiter will follow up for the rest of your profile.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Full name" required className="sm:col-span-2">
              <Input value={values.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full name" />
            </FormField>
            <FormField label="Email" required>
              <Input
                type="email"
                value={values.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
              />
            </FormField>
            <FormField label="Phone number" required>
              <Input
                value={values.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                inputMode="numeric"
              />
            </FormField>
            <FormField label="Current city" required>
              <Select value={values.cityChoice} onChange={(e) => set("cityChoice", e.target.value)}>
                <option value="">Select city</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FormField>
            {values.cityChoice === "Other" ? (
              <FormField label="Enter your city">
                <Input value={values.customCity} onChange={(e) => set("customCity", e.target.value)} placeholder="City name" />
              </FormField>
            ) : (
              values.cityChoice && (
                <div className="grid gap-1.5 self-end text-sm text-slate-400">
                  State: {cityStateMap[values.cityChoice] ?? "—"}
                </div>
              )
            )}
            <FormField label="Current fixed CTC" required>
              <Select value={values.currentFixedCtc} onChange={(e) => set("currentFixedCtc", e.target.value)}>
                <option value="">Select CTC</option>
                {ctcOptions.map((o) => (
                  <option key={o.label} value={o.value ?? ""}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Total experience" required>
              <Select value={values.totalExperienceYears} onChange={(e) => set("totalExperienceYears", e.target.value)}>
                <option value="">Select experience</option>
                {experienceOptions.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Days to join" required>
              <Select value={values.noticePeriod} onChange={(e) => set("noticePeriod", e.target.value)}>
                <option value="">Select...</option>
                {defaultNoticePeriods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Current job title" required>
              <Input value={values.currentJobTitle} onChange={(e) => set("currentJobTitle", e.target.value)} placeholder="e.g. Senior Account Executive" />
            </FormField>
            <FormField label="Current employer" required>
              <Input value={values.currentEmployer} onChange={(e) => set("currentEmployer", e.target.value)} placeholder="Company name" />
            </FormField>
            <FormField label="Employment status" required>
              <Select value={values.employmentStatus} onChange={(e) => set("employmentStatus", e.target.value)}>
                <option value="">Select status</option>
                {employmentStatusOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Current industry" required>
              <Select value={values.currentIndustry} onChange={(e) => set("currentIndustry", e.target.value)}>
                <option value="">Select industry</option>
                {industryOptions.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Function / Domain" required>
              <Select
                value={values.category}
                onChange={(e) => {
                  const next = e.target.value as CategoryValue | "";
                  set("category", next);
                  set("subDomain", "");
                  set("subDomainOther", "");
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
            <FormField label="Sub-domain" required>
              <Select value={values.subDomain} onChange={(e) => set("subDomain", e.target.value)}>
                <option value="">Select sub-domain</option>
                {subDomainOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
                <option value="Other">Other</option>
              </Select>
              {values.subDomain === "Other" && (
                <input
                  value={values.subDomainOther}
                  onChange={(e) => set("subDomainOther", e.target.value)}
                  placeholder="e.g. SaaS Sales"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                />
              )}
            </FormField>
            <FormField label="IC or leading a team?" required>
              <Select
                value={values.roleType}
                onChange={(e) => {
                  set("roleType", e.target.value);
                  if (e.target.value !== "Leading a Team") set("teamSize", "");
                }}
              >
                <option value="">Select</option>
                {roleTypeOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </FormField>
            {values.roleType === "Leading a Team" && (
              <FormField label="Team size" required>
                <Select value={values.teamSize} onChange={(e) => set("teamSize", e.target.value)}>
                  <option value="">Select team size</option>
                  {teamSizeOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}
            <FormField label="Resume" required className="sm:col-span-2">
              <label
                htmlFor="resume-upload"
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
                  resumeFile
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <span className="text-2xl">{resumeFile ? "✓" : "📄"}</span>
                {resumeFile ? (
                  <span className="text-sm font-medium text-emerald-700">{resumeFile.name}</span>
                ) : (
                  <>
                    <span className="text-sm font-medium text-slate-700">Click to upload your resume</span>
                    <span className="text-xs text-slate-400">PDF or DOCX, up to 10MB</span>
                  </>
                )}
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
              </label>
            </FormField>
          </div>

          <label className="mt-5 flex items-start gap-2 text-[13px] text-slate-600">
            <input
              type="checkbox"
              checked={values.consent}
              onChange={(e) => set("consent", e.target.checked)}
              className="mt-0.5"
            />
            I agree to be contacted by StaffAnchor about this and other relevant roles.
          </label>

          {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}

          <Button className="mt-5 w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Spinner className="h-4 w-4" /> : "Submit application"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
