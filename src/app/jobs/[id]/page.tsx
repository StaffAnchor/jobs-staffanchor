"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, CheckCircle2, IndianRupee, MapPin, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/forms/form-field";
import { Spinner } from "@/components/ui/spinner";
import {
  getOpenJob,
  submitQuickApply,
  logQuickApplyClick,
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
  dealSizeBandsFor,
  salesCycleOptions,
  sellingStyleOptions,
  salesMotionOptions,
  customerSegmentOptions,
  funnelStageOptions,
  geographicScopeOptions,
  insideSalesSubDomains,
  ahtOptions,
  dailyCallTargetOptions,
  dailyTalkTimeOptions,
  leadSourceOptions,
  type CategoryValue,
  type CurrencyValue,
} from "@/modules/apply/options";
import { supabase } from "@/lib/supabaseClient";

function bulletList(value: string) {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

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
  // Sales Specialization (current role) -- Stage 2 fields, dropdown/multiselect
  // only per the onboarding design, mirroring ApplyForm's exact segment_data
  // keys so a candidate who applies here and later opens Build Your Profile
  // sees this pre-filled rather than asked twice.
  dealCurrency: CurrencyValue | "";
  dealSizeBand: string;
  cycle: string;
  style: string;
  motion: string[];
  segment: string;
  funnel: string;
  scope: string;
  aht: string;
  dailyCallTarget: string;
  dailyTalkTime: string;
  leadSources: string[];
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
  dealCurrency: "",
  dealSizeBand: "",
  cycle: "",
  style: "",
  motion: [],
  segment: "",
  funnel: "",
  scope: "",
  aht: "",
  dailyCallTarget: "",
  dailyTalkTime: "",
  leadSources: [],
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

  const isB2B = values.category === "b2b_sales";
  const isB2C = values.category === "b2c_sales";
  const isSalesCategory = isB2B || isB2C;
  const isInsideSales = insideSalesSubDomains.includes(values.subDomain);
  const dealBandOptions = useMemo(
    () => dealSizeBandsFor(values.category || null, values.dealCurrency || ""),
    [values.category, values.dealCurrency]
  );

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleArrayValue(key: "motion" | "leadSources", value: string) {
    setValues((v) => {
      const current = v[key];
      return {
        ...v,
        [key]: current.includes(value) ? current.filter((x) => x !== value) : [...current, value],
      };
    });
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

    if (isSalesCategory) {
      if (!values.cycle) return "Please select your sales cycle.";
      if (!values.style) return "Please select your selling style.";
      if (!values.dealCurrency) return "Please select a currency for your deal/ticket size.";
      if (!values.dealSizeBand) return `Please select your typical ${isB2B ? "deal" : "ticket"} size.`;
      if (isB2B) {
        if (!values.segment) return "Please select your customer segment.";
        if (values.motion.length === 0) return "Please select at least one sales motion.";
      } else {
        if (!values.funnel) return "Please select your sales motion.";
        if (!values.scope) return "Please select your geographic scope.";
      }
    }

    if (isInsideSales) {
      if (!values.aht) return "Please select your average handling time.";
      if (!values.dailyCallTarget) return "Please select your daily call target.";
      if (!values.dailyTalkTime) return "Please select your daily talk time.";
      if (values.leadSources.length === 0) return "Please select at least one primary lead source.";
    }

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

      // Sales Specialization (current role) -- same segment_data keys ApplyForm
      // uses, so this data shows up pre-filled rather than re-asked if the
      // candidate later opens Build Your Profile.
      if (isB2B) {
        Object.assign(segmentData, {
          deal_size: values.dealSizeBand || undefined,
          deal_size_currency: values.dealCurrency || undefined,
          cycle: values.cycle || undefined,
          style: values.style || undefined,
          motion: values.motion.length ? values.motion : undefined,
          segment: values.segment || undefined,
        });
      } else if (isB2C) {
        Object.assign(segmentData, {
          ticket: values.dealSizeBand || undefined,
          ticket_currency: values.dealCurrency || undefined,
          funnel: values.funnel || undefined,
          scope: values.scope || undefined,
        });
      }
      if (isInsideSales) {
        Object.assign(segmentData, {
          aht: values.aht || undefined,
          daily_call_target: values.dailyCallTarget || undefined,
          daily_talk_time: values.dailyTalkTime || undefined,
          lead_sources: values.leadSources.length ? values.leadSources : undefined,
        });
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
        profile_stage: "applicant",
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
          Thanks, {values.fullName.split(" ")[0]}. A StaffAnchor recruiter will be in touch with you to discuss next
          steps for this role ({job.role_title ?? "role"}), if your profile matches the client&apos;s shortlisting
          criteria.
        </p>

        <div className="mt-6 rounded-xl border-2 border-blue-200 bg-blue-50/60 px-5 py-4 text-left">
          <p className="text-sm font-semibold text-slate-900">Build your complete profile</p>
          <p className="mt-1 text-xs text-slate-600">
            A complete profile noticeably increases your chances of being shortlisted -- it takes just 7-10 minutes.
            This also creates your free StaffAnchor account automatically, so we can match you to future openings
            too.
          </p>
          <Link
            href={`/candidate-login?email=${encodeURIComponent(values.email)}`}
            className="mt-3 inline-block"
          >
            <Button className="h-9 px-4 text-sm">Build my profile</Button>
          </Link>
        </div>

        <Link href="/jobs" className="mt-6 inline-block">
          <Button variant="outline">Browse more roles</Button>
        </Link>
      </div>
    );
  }

  const hasStructuredJD = !!(
    job.jd_overview || job.jd_responsibilities || job.jd_candidate_profile || job.jd_compensation_benefits
  );

  const jobCities = job.cities?.length ? job.cities : job.city ? [job.city] : [];
  const jobSubDomains = job.sub_domains?.length ? job.sub_domains : job.sub_domain ? [job.sub_domain] : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/jobs" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to open roles
      </Link>

      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 p-6 text-white shadow-lg shadow-blue-900/20 sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
          {categoryLabel(job.category)}
          {jobSubDomains.length ? ` · ${jobSubDomains.join(", ")}` : ""}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{job.role_title ?? "Sales Role"}</h1>
        {job.client_display && <p className="mt-1 text-sm font-medium text-white/90">{job.client_display}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {jobCities.length > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5" /> {jobCities.join(", ")}
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
            <IndianRupee className="h-3.5 w-3.5" /> {budgetLabel(job.budget_min, job.budget_max)}
          </span>
          {experienceLabel(job.experience_min, job.experience_max) && (
            <span className="rounded-full bg-white/15 px-3 py-1 text-[12px] font-medium backdrop-blur-sm">
              {experienceLabel(job.experience_min, job.experience_max)} experience
            </span>
          )}
        </div>
        <a
          href="#apply-form"
          onClick={() => logQuickApplyClick(mandateId)}
          className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-50"
        >
          <Zap className="h-4 w-4" /> Quick Apply
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5 sm:p-6">
              {hasStructuredJD ? (
                <div className="space-y-5">
                  {job.jd_overview && <p className="text-[14px] leading-6 text-slate-600">{job.jd_overview}</p>}
                  {job.jd_responsibilities && (
                    <div>
                      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-blue-700">
                        Key Responsibilities
                      </h2>
                      <ul className="list-disc space-y-1.5 pl-4 text-[13.5px] leading-6 text-slate-700">
                        {bulletList(job.jd_responsibilities).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.jd_candidate_profile && (
                    <div>
                      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-indigo-700">
                        Candidate Profile
                      </h2>
                      <ul className="list-disc space-y-1.5 pl-4 text-[13.5px] leading-6 text-slate-700">
                        {bulletList(job.jd_candidate_profile).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {job.jd_compensation_benefits && (
                    <div>
                      <h2 className="mb-2 text-[13px] font-bold uppercase tracking-wide text-emerald-700">
                        Compensation &amp; Benefits
                      </h2>
                      <ul className="list-disc space-y-1.5 pl-4 text-[13.5px] leading-6 text-slate-700">
                        {bulletList(job.jd_compensation_benefits).map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : job.job_description ? (
                <p className="whitespace-pre-wrap text-[13.5px] leading-6 text-slate-600">{job.job_description}</p>
              ) : (
                <p className="text-sm text-slate-400">No job description yet — a recruiter will share full details.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">At a glance</p>
            <dl className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Experience</dt>
                <dd className="font-medium text-slate-800">{experienceLabel(job.experience_min, job.experience_max) ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Compensation</dt>
                <dd className="font-medium text-slate-800">{budgetLabel(job.budget_min, job.budget_max)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Location</dt>
                <dd className="font-medium text-slate-800">{jobCities.length ? jobCities.join(", ") : "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Function</dt>
                <dd className="font-medium text-slate-800">{categoryLabel(job.category)}</dd>
              </div>
            </dl>
            <a
              href="#apply-form"
              onClick={() => logQuickApplyClick(mandateId)}
              className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
            >
              <Zap className="h-4 w-4" /> Quick Apply
            </a>
          </div>
        </div>
      </div>

      <Card id="apply-form" className="mt-6 scroll-mt-24">
        <CardContent className="p-5 sm:p-6">
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

            {isSalesCategory && (
              <>
                <div className="sm:col-span-2">
                  <p className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-medium text-blue-700">
                    A few quick details about your current role — adding these noticeably increases your chances of being
                    shortlisted for this mandate.
                  </p>
                </div>
                <FormField label="Sales cycle" required>
                  <Select value={values.cycle} onChange={(e) => set("cycle", e.target.value)}>
                    <option value="">Select...</option>
                    {salesCycleOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Selling style" required>
                  <Select value={values.style} onChange={(e) => set("style", e.target.value)}>
                    <option value="">Select...</option>
                    {sellingStyleOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Currency" required>
                  <Select value={values.dealCurrency} onChange={(e) => set("dealCurrency", e.target.value as CurrencyValue)}>
                    <option value="">Select...</option>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </Select>
                </FormField>
                <FormField label={isB2B ? "Typical deal size" : "Typical ticket size"} required>
                  <Select
                    value={values.dealSizeBand}
                    onChange={(e) => set("dealSizeBand", e.target.value)}
                    disabled={!values.dealCurrency}
                  >
                    <option value="">{values.dealCurrency ? "Select..." : "Select currency first"}</option>
                    {dealBandOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </FormField>
                {isB2B ? (
                  <FormField label="Customer segment" required>
                    <Select value={values.segment} onChange={(e) => set("segment", e.target.value)}>
                      <option value="">Select...</option>
                      {customerSegmentOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                ) : (
                  <>
                    <FormField label="Sales motion" required>
                      <Select value={values.funnel} onChange={(e) => set("funnel", e.target.value)}>
                        <option value="">Select...</option>
                        {funnelStageOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Geographic scope" required>
                      <Select value={values.scope} onChange={(e) => set("scope", e.target.value)}>
                        <option value="">Select...</option>
                        {geographicScopeOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </>
                )}
                {isB2B && (
                  <FormField label="Sales motion" required className="sm:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {salesMotionOptions.map((o) => {
                        const active = values.motion.includes(o);
                        return (
                          <button
                            type="button"
                            key={o}
                            onClick={() => toggleArrayValue("motion", o)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {active ? "✓ " : "+ "}
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                )}
                {isInsideSales && (
                  <>
                    <FormField label="Average handling time (AHT)" required>
                      <Select value={values.aht} onChange={(e) => set("aht", e.target.value)}>
                        <option value="">Select...</option>
                        {ahtOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Daily call target" required>
                      <Select value={values.dailyCallTarget} onChange={(e) => set("dailyCallTarget", e.target.value)}>
                        <option value="">Select...</option>
                        {dailyCallTargetOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Daily talk time" required>
                      <Select value={values.dailyTalkTime} onChange={(e) => set("dailyTalkTime", e.target.value)}>
                        <option value="">Select...</option>
                        {dailyTalkTimeOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Primary lead sources" required className="sm:col-span-2">
                      <div className="flex flex-wrap gap-2">
                        {leadSourceOptions.map((o) => {
                          const active = values.leadSources.includes(o);
                          return (
                            <button
                              type="button"
                              key={o}
                              onClick={() => toggleArrayValue("leadSources", o)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                                active
                                  ? "border-slate-900 bg-slate-900 text-white"
                                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                              }`}
                            >
                              {active ? "✓ " : "+ "}
                              {o}
                            </button>
                          );
                        })}
                      </div>
                    </FormField>
                  </>
                )}
              </>
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
            I agree to be contacted by StaffAnchor about this and other relevant roles. This creates my profile with
            StaffAnchor, and I can log in any time using this email address (no password needed).
          </label>

          {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}

          <Button
            className="mt-5 w-full bg-gradient-to-r from-indigo-600 to-blue-500 hover:opacity-90"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? <Spinner className="h-4 w-4" /> : "Submit application"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
