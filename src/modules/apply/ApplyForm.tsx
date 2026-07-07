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
  achievementBandOptions,
  ahtOptions,
  b2bSubDomains,
  b2cSubDomains,
  categoryOptions,
  ctcOptions,
  currencyOptions,
  customerSegmentOptions,
  dailyCallTargetOptions,
  dailyTalkTimeOptions,
  dealSizeBandsFor,
  defaultNoticePeriods,
  employmentStatusOptions,
  experienceOptions,
  funnelStageOptions,
  highestQualificationOptions,
  industryOptions,
  insideSalesSubDomains,
  leadSourceOptions,
  nonSalesSubDomains,
  relocationOptions,
  roleLevelOptions,
  roleTypeOptions,
  salesCycleOptions,
  salesMotionOptions,
  searchSkills,
  sellingStyleOptions,
  skillSuggestionsFor,
  subDomainsForCategory,
  teamSizeOptions,
  workModeOptions,
  type CategoryValue,
  type CurrencyValue,
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
  selectedSkills: string[];
  customSkill: string;
  noticePeriod: string;
  expectedFixedCtc: string;
  expectedVariableCtc: string;
  highestQualification: string;
  workMode: string;
  openToRelocation: string;
  category: CategoryValue | "";
  subDomain: string;
  secondarySubDomains: string[];
  roleLevel: string;
  roleType: string;
  teamSize: string;
  dealCurrency: CurrencyValue | "";
  dealSizeBand: string;
  cycle: string;
  motion: string[];
  style: string;
  segment: string;
  funnel: string;
  scope: string;
  aht: string;
  dailyCallTarget: string;
  dailyTalkTime: string;
  leadSources: string[];
  hasIcTarget: string;
  icTargetQ1: string;
  icTargetQ2: string;
  icTargetQ3: string;
  icTargetQ4: string;
  quotaQ1: string;
  quotaQ2: string;
  quotaQ3: string;
  quotaQ4: string;
  teamTargetQ1: string;
  teamTargetQ2: string;
  teamTargetQ3: string;
  teamTargetQ4: string;
  teamQuotaQ1: string;
  teamQuotaQ2: string;
  teamQuotaQ3: string;
  teamQuotaQ4: string;
  bestWin: string;
  toughLoss: string;
  selectedIndustries: string[];
  customIndustry: string;
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
  selectedSkills: [],
  customSkill: "",
  noticePeriod: "",
  expectedFixedCtc: "",
  expectedVariableCtc: "",
  highestQualification: "",
  workMode: "",
  openToRelocation: "",
  category: "",
  subDomain: "",
  secondarySubDomains: [],
  roleLevel: "",
  roleType: "",
  teamSize: "",
  dealCurrency: "",
  dealSizeBand: "",
  cycle: "",
  motion: [],
  style: "",
  segment: "",
  funnel: "",
  scope: "",
  aht: "",
  dailyCallTarget: "",
  dailyTalkTime: "",
  leadSources: [],
  hasIcTarget: "",
  icTargetQ1: "",
  icTargetQ2: "",
  icTargetQ3: "",
  icTargetQ4: "",
  quotaQ1: "",
  quotaQ2: "",
  quotaQ3: "",
  quotaQ4: "",
  teamTargetQ1: "",
  teamTargetQ2: "",
  teamTargetQ3: "",
  teamTargetQ4: "",
  teamQuotaQ1: "",
  teamQuotaQ2: "",
  teamQuotaQ3: "",
  teamQuotaQ4: "",
  bestWin: "",
  toughLoss: "",
  selectedIndustries: [],
  customIndustry: "",
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
  const suggestedSkills = useMemo(() => skillSuggestionsFor(values.subDomain || null), [values.subDomain]);
  const dealSizeOptions = useMemo(
    () => dealSizeBandsFor(values.category || null, values.dealCurrency),
    [values.category, values.dealCurrency]
  );
  const isInsideSales = insideSalesSubDomains.includes(values.subDomain);
  const skillSearchResults = useMemo(
    () => searchSkills(values.customSkill, values.selectedSkills),
    [values.customSkill, values.selectedSkills]
  );

  function addCustomSkill(skillOverride?: string) {
    const skill = (skillOverride ?? values.customSkill).trim();
    if (!skill) return;
    setValues((prev) =>
      prev.selectedSkills.includes(skill)
        ? { ...prev, customSkill: "" }
        : { ...prev, selectedSkills: [...prev.selectedSkills, skill], customSkill: "" }
    );
  }

  function quarterField(
    label: string,
    targetValue: string,
    onTarget: (v: string) => void,
    achievementValue: string,
    onAchievement: (v: string) => void
  ) {
    return (
      <div key={label} className="space-y-2 rounded-md border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <FormField label="Target" required>
          <Input type="number" value={targetValue} onChange={(e) => onTarget(e.target.value)} />
        </FormField>
        <FormField label="Achieved %" required>
          <Select value={achievementValue} onChange={(e) => onAchievement(e.target.value)}>
            <option value="">Select...</option>
            {achievementBandOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </FormField>
      </div>
    );
  }

  function addCustomIndustry() {
    const industry = values.customIndustry.trim();
    if (!industry) return;
    setValues((prev) =>
      prev.selectedIndustries.includes(industry)
        ? { ...prev, customIndustry: "" }
        : { ...prev, selectedIndustries: [...prev.selectedIndustries, industry], customIndustry: "" }
    );
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArrayValue(
    key: "secondarySubDomains" | "motion" | "selectedSkills" | "leadSources" | "selectedIndustries",
    value: string
  ) {
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
      if (!values.currentFixedCtc) return "Current fixed CTC is required.";
    }
    if (step === 2) {
      if (!values.category) return "Please select a category.";
      if (!values.subDomain) return "Please select your primary specialization.";
      if (!values.roleLevel) return "Please select your role level.";
      if (!values.roleType) return "Please select whether you are an IC or leading a team.";
      if (values.roleType === "Leading a Team" && !values.teamSize) return "Please select your team size.";
    }
    if (step === 3 && (values.category === "b2b_sales" || values.category === "b2c_sales")) {
      const allFilled = (keys: (keyof FormState)[]) => keys.every((k) => String(values[k]).trim() !== "");

      if (values.roleType === "Leading a Team") {
        if (
          !allFilled([
            "teamTargetQ1",
            "teamTargetQ2",
            "teamTargetQ3",
            "teamTargetQ4",
            "teamQuotaQ1",
            "teamQuotaQ2",
            "teamQuotaQ3",
            "teamQuotaQ4",
          ])
        ) {
          return "Please fill in your team's target and achievement % for all 4 quarters.";
        }
        if (!values.hasIcTarget) {
          return "Please tell us whether you also carry an individual sales target.";
        }
        if (
          values.hasIcTarget === "Yes" &&
          !allFilled(["icTargetQ1", "icTargetQ2", "icTargetQ3", "icTargetQ4", "quotaQ1", "quotaQ2", "quotaQ3", "quotaQ4"])
        ) {
          return "Please fill in your individual target and achievement % for all 4 quarters.";
        }
      } else {
        if (
          !allFilled(["icTargetQ1", "icTargetQ2", "icTargetQ3", "icTargetQ4", "quotaQ1", "quotaQ2", "quotaQ3", "quotaQ4"])
        ) {
          return "Please fill in your sales target and achievement % for all 4 quarters.";
        }
      }
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
        // Store the exact object path within the 'resumes' bucket (no bucket-name
        // prefix) so it matches storage.objects.name and can be resolved later
        // via supabase.storage.from('resumes').createSignedUrl(resumeFileUrl, ...).
        resumeFileUrl = path;
      }

      const segmentData: Record<string, unknown> = {
        role_level: values.roleLevel,
        role_type: values.roleType === "Leading a Team" ? "Team Lead" : "IC",
      };

      if (values.roleType === "Leading a Team" && values.teamSize) {
        segmentData.team_size = values.teamSize;
      }

      // Quarterly targets & achievement (last 4 quarters). A team lead always reports
      // the team's own target + achievement; if they also carry an individual number,
      // that's reported separately and summed into a computed total per quarter.
      const icTargets = [values.icTargetQ1, values.icTargetQ2, values.icTargetQ3, values.icTargetQ4]
        .filter((v) => v.trim() !== "")
        .map((v) => Number(v));
      const icAchievement = [values.quotaQ1, values.quotaQ2, values.quotaQ3, values.quotaQ4].filter(
        (v) => v.trim() !== ""
      );
      const teamTargets = [values.teamTargetQ1, values.teamTargetQ2, values.teamTargetQ3, values.teamTargetQ4]
        .filter((v) => v.trim() !== "")
        .map((v) => Number(v));
      const teamAchievement = [
        values.teamQuotaQ1,
        values.teamQuotaQ2,
        values.teamQuotaQ3,
        values.teamQuotaQ4,
      ].filter((v) => v.trim() !== "");

      if (values.roleType === "Leading a Team") {
        if (teamTargets.length) segmentData.team_targets = teamTargets;
        if (teamAchievement.length) segmentData.team_quota = teamAchievement;
        if (values.hasIcTarget === "Yes") {
          if (icTargets.length) segmentData.ic_targets = icTargets;
          if (icAchievement.length) segmentData.quota = icAchievement;
          if (icTargets.length === 4 && teamTargets.length === 4) {
            segmentData.total_targets = teamTargets.map((t, i) => t + icTargets[i]);
          }
        }
      } else {
        if (icTargets.length) segmentData.ic_targets = icTargets;
        if (icAchievement.length) segmentData.quota = icAchievement;
      }

      if (values.category === "b2b_sales") {
        Object.assign(segmentData, {
          deal_size: values.dealSizeBand || undefined,
          deal_size_currency: values.dealCurrency || undefined,
          cycle: values.cycle || undefined,
          style: values.style || undefined,
          motion: values.motion.length ? values.motion : undefined,
          segment: values.segment || undefined,
        });
      } else if (values.category === "b2c_sales") {
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
        // "120L+" and "40+ years" are stored using sentinel values (121, 41) in the
        // dropdowns so they sort after real values; clamp them back to their real
        // floor (120 / 40) for the numeric columns.
        total_experience_years: values.totalExperienceYears
          ? Math.min(Number(values.totalExperienceYears), 40)
          : null,
        current_fixed_ctc: values.currentFixedCtc ? Math.min(Number(values.currentFixedCtc), 120) : null,
        current_variable_ctc: values.currentVariableCtc
          ? Math.min(Number(values.currentVariableCtc), 120)
          : null,
        esops_held: values.esopsHeld,
        notice_period: values.noticePeriod || null,
        expected_fixed_ctc: values.expectedFixedCtc ? Math.min(Number(values.expectedFixedCtc), 120) : null,
        expected_variable_ctc: values.expectedVariableCtc
          ? Math.min(Number(values.expectedVariableCtc), 120)
          : null,
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
        industries: values.selectedIndustries,
        skills: values.selectedSkills.length ? values.selectedSkills.join(", ") : null,
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
      <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_38%),radial-gradient(circle_at_80%_15%,rgba(14,165,233,0.14),transparent_32%),linear-gradient(to_bottom,#f8fbff_0%,#ffffff_45%,#f4f7fb_100%)]">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <main className="relative mx-auto flex w-full max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="w-full border-slate-200 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.35)]">
            <CardContent className="space-y-3 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                ✓
              </div>
              <h2 className="text-xl font-bold text-slate-950">You&apos;re on record.</h2>
              <p className="text-sm leading-6 text-slate-600">
                Thanks, {values.fullName.split(" ")[0] || "there"}. A StaffAnchor recruiter will review your profile
                and reach out if there&apos;s a mandate fit. No spam, no cold calls for irrelevant roles.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_38%),radial-gradient(circle_at_80%_15%,rgba(14,165,233,0.14),transparent_32%),linear-gradient(to_bottom,#f8fbff_0%,#ffffff_45%,#f4f7fb_100%)]">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-slate-200/40 blur-3xl" />
      <main className="relative mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            Step {step + 1} of {STEPS.length}: {STEPS[step]}
          </span>
          <span>{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={`h-1.5 flex-1 overflow-hidden rounded-full ${i <= step ? "bg-slate-900" : "bg-slate-200"}`}
            />
          ))}
        </div>

        <Card className="w-full border-slate-200 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.35)]">
          <CardHeader className="rounded-t-xl bg-slate-950 text-white">
            <CardTitle className="text-white">Build Your Profile</CardTitle>
            <p className="mt-1 text-sm italic text-slate-300">&ldquo;{quote}&rdquo;</p>
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
              <FormField label="Total Experience" required>
                <Select
                  value={values.totalExperienceYears}
                  onChange={(e) => update("totalExperienceYears", e.target.value)}
                >
                  <option value="">Select...</option>
                  {experienceOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Current Fixed CTC" required>
                  <Select
                    value={values.currentFixedCtc}
                    onChange={(e) => update("currentFixedCtc", e.target.value)}
                  >
                    <option value="">Select...</option>
                    {ctcOptions.map((o) => (
                      <option key={o.label} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Current Variable CTC">
                  <Select
                    value={values.currentVariableCtc}
                    onChange={(e) => update("currentVariableCtc", e.target.value)}
                  >
                    <option value="">N/A</option>
                    {ctcOptions.map((o) => (
                      <option key={o.label} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
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
                <FormField label="Expected Fixed CTC">
                  <Select
                    value={values.expectedFixedCtc}
                    onChange={(e) => update("expectedFixedCtc", e.target.value)}
                  >
                    <option value="">Select...</option>
                    {ctcOptions.map((o) => (
                      <option key={o.label} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Expected Variable CTC">
                  <Select
                    value={values.expectedVariableCtc}
                    onChange={(e) => update("expectedVariableCtc", e.target.value)}
                  >
                    <option value="">N/A</option>
                    {ctcOptions.map((o) => (
                      <option key={o.label} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
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

                  <FormField label="Current Role Type" required>
                    <Select
                      value={values.roleType}
                      onChange={(e) => {
                        update("roleType", e.target.value);
                        if (e.target.value !== "Leading a Team") update("teamSize", "");
                      }}
                    >
                      <option value="">Select...</option>
                      {roleTypeOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  {values.roleType === "Leading a Team" && (
                    <FormField label="Team Size" required>
                      <Select value={values.teamSize} onChange={(e) => update("teamSize", e.target.value)}>
                        <option value="">Select...</option>
                        {teamSizeOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  )}

                  {isInsideSales && (
                    <>
                      <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Inside Sales Specifics
                      </p>
                      <FormField label="Average Handling Time (AHT)">
                        <Select value={values.aht} onChange={(e) => update("aht", e.target.value)}>
                          <option value="">Select...</option>
                          {ahtOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Daily Call Target (per user)">
                        <Select
                          value={values.dailyCallTarget}
                          onChange={(e) => update("dailyCallTarget", e.target.value)}
                        >
                          <option value="">Select...</option>
                          {dailyCallTargetOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Daily Talk-Time (hours, per user)">
                        <Select
                          value={values.dailyTalkTime}
                          onChange={(e) => update("dailyTalkTime", e.target.value)}
                        >
                          <option value="">Select...</option>
                          {dailyTalkTimeOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Lead Source / Process (select all that apply)">
                        <div className="grid gap-1.5">
                          {leadSourceOptions.map((o) => (
                            <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
                              <input
                                type="checkbox"
                                checked={values.leadSources.includes(o)}
                                onChange={() => toggleArrayValue("leadSources", o)}
                              />
                              {o}
                            </label>
                          ))}
                        </div>
                      </FormField>
                    </>
                  )}

                  {values.category === "b2b_sales" && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Deal Size Currency">
                          <Select
                            value={values.dealCurrency}
                            onChange={(e) => {
                              update("dealCurrency", e.target.value as CurrencyValue | "");
                              update("dealSizeBand", "");
                            }}
                          >
                            <option value="">Select...</option>
                            {currencyOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                        <FormField label="Typical Deal Size">
                          <Select
                            value={values.dealSizeBand}
                            onChange={(e) => update("dealSizeBand", e.target.value)}
                            disabled={!values.dealCurrency}
                          >
                            <option value="">{values.dealCurrency ? "Select..." : "Choose currency first"}</option>
                            {dealSizeOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                      </div>
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
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Ticket Size Currency">
                          <Select
                            value={values.dealCurrency}
                            onChange={(e) => {
                              update("dealCurrency", e.target.value as CurrencyValue | "");
                              update("dealSizeBand", "");
                            }}
                          >
                            <option value="">Select...</option>
                            {currencyOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                        <FormField label="Typical Ticket Size">
                          <Select
                            value={values.dealSizeBand}
                            onChange={(e) => update("dealSizeBand", e.target.value)}
                            disabled={!values.dealCurrency}
                          >
                            <option value="">{values.dealCurrency ? "Select..." : "Choose currency first"}</option>
                            {dealSizeOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                      </div>
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
              {(values.category === "b2b_sales" || values.category === "b2c_sales") && (
                <>
                  {values.roleType === "Leading a Team" && (
                    <>
                      <p className="text-sm text-slate-600">
                        Share your <strong>team&apos;s</strong> overall target and achieved % for the last 4
                        quarters.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quarterField("Q1 (oldest)", values.teamTargetQ1, (v) => update("teamTargetQ1", v), values.teamQuotaQ1, (v) => update("teamQuotaQ1", v))}
                        {quarterField("Q2", values.teamTargetQ2, (v) => update("teamTargetQ2", v), values.teamQuotaQ2, (v) => update("teamQuotaQ2", v))}
                        {quarterField("Q3", values.teamTargetQ3, (v) => update("teamTargetQ3", v), values.teamQuotaQ3, (v) => update("teamQuotaQ3", v))}
                        {quarterField("Q4 (latest)", values.teamTargetQ4, (v) => update("teamTargetQ4", v), values.teamQuotaQ4, (v) => update("teamQuotaQ4", v))}
                      </div>

                      <FormField label="Do you also carry your own individual sales target, in addition to the team target?" required>
                        <Select value={values.hasIcTarget} onChange={(e) => update("hasIcTarget", e.target.value)}>
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No — only a team target</option>
                        </Select>
                      </FormField>
                    </>
                  )}

                  {(values.roleType !== "Leading a Team" || values.hasIcTarget === "Yes") && (
                    <>
                      <p className="text-sm text-slate-600">
                        Share your <strong>individual</strong> target and achieved % for the last 4 quarters.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quarterField("Q1 (oldest)", values.icTargetQ1, (v) => update("icTargetQ1", v), values.quotaQ1, (v) => update("quotaQ1", v))}
                        {quarterField("Q2", values.icTargetQ2, (v) => update("icTargetQ2", v), values.quotaQ2, (v) => update("quotaQ2", v))}
                        {quarterField("Q3", values.icTargetQ3, (v) => update("icTargetQ3", v), values.quotaQ3, (v) => update("quotaQ3", v))}
                        {quarterField("Q4 (latest)", values.icTargetQ4, (v) => update("icTargetQ4", v), values.quotaQ4, (v) => update("quotaQ4", v))}
                      </div>
                    </>
                  )}

                  {values.roleType === "Leading a Team" &&
                    values.hasIcTarget === "Yes" &&
                    [values.teamTargetQ1, values.teamTargetQ2, values.teamTargetQ3, values.teamTargetQ4].every(
                      (v) => v.trim() !== ""
                    ) &&
                    [values.icTargetQ1, values.icTargetQ2, values.icTargetQ3, values.icTargetQ4].every(
                      (v) => v.trim() !== ""
                    ) && (
                      <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                        Total target (team + individual), by quarter:{" "}
                        {[
                          Number(values.teamTargetQ1) + Number(values.icTargetQ1),
                          Number(values.teamTargetQ2) + Number(values.icTargetQ2),
                          Number(values.teamTargetQ3) + Number(values.icTargetQ3),
                          Number(values.teamTargetQ4) + Number(values.icTargetQ4),
                        ].join(" / ")}
                      </div>
                    )}
                </>
              )}
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
              <FormField label="Key Skills / Tools">
                <div className="space-y-2">
                  {suggestedSkills.length > 0 && (
                    <p className="text-xs text-slate-500">
                      Suggested for {values.subDomain || "your specialization"} — tap to add:
                    </p>
                  )}
                  {suggestedSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {suggestedSkills.map((skill) => {
                        const active = values.selectedSkills.includes(skill);
                        return (
                          <button
                            type="button"
                            key={skill}
                            onClick={() => toggleArrayValue("selectedSkills", skill)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {active ? "✓ " : "+ "}
                            {skill}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {values.selectedSkills.filter((s) => !suggestedSkills.includes(s)).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {values.selectedSkills
                        .filter((s) => !suggestedSkills.includes(s))
                        .map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-900 bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                          >
                            {skill}
                            <button
                              type="button"
                              aria-label={`Remove ${skill}`}
                              onClick={() => toggleArrayValue("selectedSkills", skill)}
                              className="ml-1 text-white/80 hover:text-white"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  )}
                  <div className="relative">
                    <div className="flex gap-2 pt-1">
                      <Input
                        placeholder="Type to search skills (e.g. 's' for Salesforce, SPIN...)"
                        value={values.customSkill}
                        onChange={(e) => update("customSkill", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addCustomSkill();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={() => addCustomSkill()}>
                        Add
                      </Button>
                    </div>
                    {skillSearchResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                        {skillSearchResults.map((skill) => (
                          <button
                            type="button"
                            key={skill}
                            onClick={() => addCustomSkill(skill)}
                            className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </FormField>
              <FormField label="Key Industries Worked In (multi-select, for searchability)">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {industryOptions.map((industry) => {
                      const active = values.selectedIndustries.includes(industry);
                      return (
                        <button
                          type="button"
                          key={industry}
                          onClick={() => toggleArrayValue("selectedIndustries", industry)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            active
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {active ? "✓ " : "+ "}
                          {industry}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Add another industry"
                      value={values.customIndustry}
                      onChange={(e) => update("customIndustry", e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomIndustry();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addCustomIndustry}>
                      Add
                    </Button>
                  </div>
                </div>
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
    </div>
  );
}
