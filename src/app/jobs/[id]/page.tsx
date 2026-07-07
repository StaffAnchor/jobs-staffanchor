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
} from "@/modules/apply/options";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  cityChoice: string;
  customCity: string;
  currentFixedCtc: string;
  totalExperienceYears: string;
  noticePeriod: string;
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
  consent: false,
};

export default function QuickApplyPage() {
  const params = useParams<{ id: string }>();
  const mandateId = params.id;

  const [job, setJob] = useState<JobListing | null | undefined>(undefined);
  const [values, setValues] = useState<FormState>(initialState);
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
      await submitQuickApply(mandateId, {
        full_name: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.replace(/\D/g, "").slice(-10),
        current_location: resolvedCity,
        current_fixed_ctc: values.currentFixedCtc ? Number(values.currentFixedCtc) : null,
        total_experience_years: values.totalExperienceYears ? Number(values.totalExperienceYears) : null,
        notice_period: values.noticePeriod,
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
            <FormField label="Notice period" required>
              <Select value={values.noticePeriod} onChange={(e) => set("noticePeriod", e.target.value)}>
                <option value="">Select notice period</option>
                {defaultNoticePeriods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
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
