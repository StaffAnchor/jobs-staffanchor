"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Briefcase,
  CheckCircle2,
  Clock,
  Eye,
  HelpCircle,
  Info,
  Pencil,
  Settings2,
  ShieldCheck,
  Target,
  User,
} from "lucide-react";
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
  cityOptions,
  cityStateMap,
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
  travelPreferenceOptions,
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
  cityChoice: string;
  customCity: string;
  customState: string;
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
  customQualification: string;
  workMode: string;
  openToRelocation: string;
  travelPreference: string;
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
  icTargetCurrency: CurrencyValue | "";
  teamTargetCurrency: CurrencyValue | "";
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
  cityChoice: "",
  customCity: "",
  customState: "",
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
  customQualification: "",
  workMode: "",
  openToRelocation: "",
  travelPreference: "",
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
  icTargetCurrency: "",
  teamTargetCurrency: "",
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

const STEPS = ["Basic Information", "Career & Compensation", "Sales Specialization", "Performance", "Preferences & Submit"] as const;

const STEP_TIME_MINUTES = [1, 1.5, 2, 1.5, 1];

const STEP_WEIGHTS = [20, 20, 25, 20, 15];

const STEP_META = [
  {
    icon: User,
    eyebrow: "Basic Information",
    heading: "Let's start with the basics",
    subtext: "Your contact details and resume — how a recruiter actually reaches you.",
  },
  {
    icon: Briefcase,
    eyebrow: "Career & Compensation",
    heading: "Tell us where you stand today",
    subtext: "Current role, experience, and compensation — the context every mandate is filtered by.",
  },
  {
    icon: Target,
    eyebrow: "Sales Specialization",
    heading: "What do you specialize in?",
    subtext: "Specific specializations get found. Generalist profiles get buried.",
  },
  {
    icon: BarChart3,
    eyebrow: "Sales Performance",
    heading: "Tell us about your performance",
    subtext: "Help us understand how you've delivered results over the last few quarters.",
  },
  {
    icon: Settings2,
    eyebrow: "Preferences & Submit",
    heading: "Almost there",
    subtext: "Skills, industries, and preferences — the last details before you're on record.",
  },
] as const;

const STEP_TIPS: Record<number, string> = {
  0: "Recruiters reach out fastest when your contact details and resume are on record.",
  1: "Comp and experience are what let a recruiter tell whether a mandate is even a fit — before wasting your time on a call.",
  2: "Specialization is what makes you findable. Generalist profiles get buried; specific ones get shortlisted.",
  3: "Real target vs. achievement is the single most-checked detail on a sales profile. Specific numbers get 3x more recruiter attention than vague claims.",
  4: "Almost done — skills and industries are how recruiters filter and find you for the right mandate.",
};

const DRAFT_STORAGE_KEY = "sa_candidate_draft_v1";

// Curated set of fields used to compute "profile strength" — weighted evenly, just
// enough signal to feel meaningful without trying to be a perfectly precise score.
const STRENGTH_FIELDS: (keyof FormState)[] = [
  "fullName",
  "email",
  "phone",
  "currentLocation",
  "linkedinUrl",
  "currentEmploymentStatus",
  "totalExperienceYears",
  "currentFixedCtc",
  "expectedFixedCtc",
  "highestQualification",
  "category",
  "subDomain",
  "roleLevel",
  "roleType",
  "dealCurrency",
  "dealSizeBand",
  "icTargetQ4",
  "quotaQ4",
  "bestWin",
  "toughLoss",
  "selectedSkills",
  "selectedIndustries",
  "workMode",
  "openToRelocation",
];

export default function ApplyForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormState>(initialState);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<string[]>(FALLBACK_QUOTES);
  const [noticePeriods, setNoticePeriods] = useState<string[]>(defaultNoticePeriods);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savedLabel, setSavedLabel] = useState<string>("");
  const [stepJustCompleted, setStepJustCompleted] = useState(false);

  // Restore a draft from localStorage on first load (resume upload can't be
  // restored — the browser doesn't let us persist raw File objects — so the
  // candidate is asked to re-attach it if they left mid-way).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { values: FormState; step: number };
        if (draft?.values) {
          setValues((prev) => ({ ...prev, ...draft.values }));
          setStep(draft.step ?? 0);
        }
      }
    } catch {
      // ignore malformed drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft (debounced) whenever values or step change.
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ values, step }));
        setLastSavedAt(Date.now());
      } catch {
        // ignore storage errors (e.g. private browsing quota)
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [values, step]);

  // Tick the "Saved Xs ago" label.
  useEffect(() => {
    const tick = () => {
      if (!lastSavedAt) {
        setSavedLabel("");
        return;
      }
      const seconds = Math.max(1, Math.round((Date.now() - lastSavedAt) / 1000));
      setSavedLabel(seconds < 60 ? `Saved ${seconds}s ago` : "Saved");
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

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

  const profileStrength = useMemo(() => {
    const filled = STRENGTH_FIELDS.filter((k) => {
      const v = values[k];
      return Array.isArray(v) ? v.length > 0 : String(v).trim() !== "";
    }).length;
    return Math.round((filled / STRENGTH_FIELDS.length) * 100);
  }, [values]);

  const minutesLeft = useMemo(
    () => STEP_TIME_MINUTES.slice(step).reduce((a, b) => a + b, 0),
    [step]
  );

  const initials = useMemo(() => {
    const parts = values.fullName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "—";
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }, [values.fullName]);

  const previewRoleLabel = useMemo(() => {
    const categoryLabel = categoryOptions.find((c) => c.value === values.category)?.label;
    if (values.roleLevel && categoryLabel) return `${values.roleLevel} — ${categoryLabel}`;
    return values.roleLevel || categoryLabel || "Role not set yet";
  }, [values.roleLevel, values.category]);

  const strengthLabel = profileStrength >= 80 ? "Great" : profileStrength >= 45 ? "Good" : "Getting started";

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
    onAchievement: (v: string) => void,
    currencyLabel?: string
  ) {
    return (
      <div key={label} className="space-y-2 rounded-md border border-slate-200 p-3">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <FormField label={currencyLabel ? `Quarterly Target (${currencyLabel})` : "Quarterly Target"} required>
          <Input
            type="number"
            placeholder="Full quarter, not monthly"
            value={targetValue}
            onChange={(e) => onTarget(e.target.value)}
          />
          <p className="text-xs text-slate-400">Enter the target for the full quarter (3 months), not a monthly number.</p>
        </FormField>
        <FormField label="Achieved %" required>
          <div className="flex flex-wrap gap-1.5">
            {achievementBandOptions.map((o) => {
              const active = achievementValue === o;
              return (
                <button
                  type="button"
                  key={o}
                  onClick={() => onAchievement(o)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {o}
                </button>
              );
            })}
          </div>
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

  function allFilled(keys: (keyof FormState)[]) {
    return keys.every((k) => {
      const v = values[k];
      return Array.isArray(v) ? v.length > 0 : String(v).trim() !== "";
    });
  }

  function validateStep(): string | null {
    const isSales = values.category === "b2b_sales" || values.category === "b2c_sales";

    if (step === 0) {
      if (!values.fullName.trim()) return "Full name is required.";
      if (!/^\S+@\S+\.\S+$/.test(values.email)) return "A valid email is required.";
      if (values.phone.length !== 10) return "Please enter a valid 10-digit phone number.";
      if (!values.cityChoice) return "Please select your current city.";
      if (values.cityChoice === "Other" && (!values.customCity.trim() || !values.customState.trim())) {
        return "Please enter both city and state.";
      }
      if (!values.linkedinUrl.trim()) return "LinkedIn profile URL is required.";
      if (!resumeFile) return "Please upload your resume.";
    }
    if (step === 1) {
      if (!values.currentEmploymentStatus) return "Employment status is required.";
      if (!values.totalExperienceYears) return "Total experience is required.";
      if (!values.currentFixedCtc) return "Current fixed CTC is required.";
      if (!values.currentVariableCtc) return "Current variable CTC is required (select 0 LPA if none).";
      if (!values.currentEmployer.trim()) return "Current / last employer is required.";
      const isCurrentlyEmployed = [
        "Employed",
        "Serving Notice",
        "Self-Employed",
        "Entrepreneur / Founder",
      ].includes(values.currentEmploymentStatus);
      if (isCurrentlyEmployed) {
        if (!values.currentJobTitle.trim()) return "Current job title is required.";
      }
      if (!values.noticePeriod) return "Please let us know how many days you'd need to join.";
      if (!values.expectedFixedCtc) return "Expected fixed CTC is required.";
      if (!values.expectedVariableCtc) return "Expected variable CTC is required (select 0 LPA if none).";
      if (!values.highestQualification) return "Highest qualification is required.";
      if (values.highestQualification === "Other" && !values.customQualification.trim()) {
        return "Please specify your qualification.";
      }
    }
    if (step === 2) {
      if (!values.category) return "Please select a category.";
      if (!values.subDomain) return "Please select your primary specialization.";
      if (!values.roleLevel) return "Please select your role level.";
      if (!values.roleType) return "Please select whether you are an IC or leading a team.";
      if (values.roleType === "Leading a Team" && !values.teamSize) return "Please select your team size.";
      if (isSales && !values.secondarySubDomains.length) {
        return "Please select at least one option (choose 'None — single specialization only' if not applicable).";
      }
      if (isSales) {
        if (!values.dealCurrency) return "Please select a currency.";
        if (!values.dealSizeBand) return "Please select a typical deal/ticket size.";
      }
      if (values.category === "b2b_sales") {
        if (!values.cycle) return "Please select your typical sales cycle.";
        if (!values.style) return "Please select your selling style.";
        if (!values.motion.length) return "Please select at least one sales motion.";
        if (!values.segment) return "Please select your customer segment.";
      }
      if (values.category === "b2c_sales") {
        if (!values.funnel) return "Please select a funnel stage.";
        if (!values.scope.trim()) return "Please describe your geographic scope.";
      }
      if (isInsideSales) {
        if (!values.aht) return "Please select an AHT range.";
        if (!values.dailyCallTarget) return "Please select a daily call target.";
        if (!values.dailyTalkTime) return "Please select a daily talk-time range.";
        if (!values.leadSources.length) return "Please select at least one lead source / process.";
      }
    }
    if (step === 3 && isSales) {
      if (values.bestWin.trim().length < 100) {
        return "Your best win needs at least 100 characters — specific numbers help recruiters most.";
      }
      if (values.toughLoss.trim().length < 100) {
        return "Your missed-target reflection needs at least 100 characters.";
      }

      if (values.roleType === "Leading a Team") {
        if (!values.teamTargetCurrency) return "Please select a currency for your team target.";
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
        if (values.hasIcTarget === "Yes") {
          if (!values.icTargetCurrency) return "Please select a currency for your individual target.";
          if (
            !allFilled(["icTargetQ1", "icTargetQ2", "icTargetQ3", "icTargetQ4", "quotaQ1", "quotaQ2", "quotaQ3", "quotaQ4"])
          ) {
            return "Please fill in your individual target and achievement % for all 4 quarters.";
          }
        }
      } else {
        if (!values.icTargetCurrency) return "Please select a currency for your sales target.";
        if (
          !allFilled(["icTargetQ1", "icTargetQ2", "icTargetQ3", "icTargetQ4", "quotaQ1", "quotaQ2", "quotaQ3", "quotaQ4"])
        ) {
          return "Please fill in your sales target and achievement % for all 4 quarters.";
        }
      }
    }
    if (step === 4) {
      if (!values.selectedSkills.length) return "Please add at least one skill.";
      if (!values.selectedIndustries.length) return "Please select at least one industry.";
      if (!values.workMode) return "Please select a work mode preference.";
      if (!values.openToRelocation) return "Please select your relocation preference.";
      if (!values.travelPreference) return "Please select your travel preference.";
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
    const completedLabel = STEPS[step];
    toast.success(`${completedLabel} completed — profile strength ${profileStrength}%`);
    setStepJustCompleted(true);
    setTimeout(() => setStepJustCompleted(false), 1200);
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
        travel_preference: values.travelPreference || undefined,
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
        if (values.teamTargetCurrency) segmentData.team_target_currency = values.teamTargetCurrency;
        if (values.hasIcTarget === "Yes") {
          if (icTargets.length) segmentData.ic_targets = icTargets;
          if (icAchievement.length) segmentData.quota = icAchievement;
          if (values.icTargetCurrency) segmentData.ic_target_currency = values.icTargetCurrency;
          if (
            icTargets.length === 4 &&
            teamTargets.length === 4 &&
            values.icTargetCurrency &&
            values.icTargetCurrency === values.teamTargetCurrency
          ) {
            segmentData.total_targets = teamTargets.map((t, i) => t + icTargets[i]);
          }
        }
      } else {
        if (icTargets.length) segmentData.ic_targets = icTargets;
        if (icAchievement.length) segmentData.quota = icAchievement;
        if (values.icTargetCurrency) segmentData.ic_target_currency = values.icTargetCurrency;
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
        secondary_sub_domains: values.secondarySubDomains.filter((d) => d !== "None — single specialization only"),
        segment_data: segmentData,
        self_assessment: {
          best: values.bestWin || undefined,
          lost: values.toughLoss || undefined,
        },
        open_to_relocation: values.openToRelocation || null,
        work_mode: values.workMode || null,
        highest_qualification:
          values.highestQualification === "Other"
            ? values.customQualification || null
            : values.highestQualification || null,
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

  const StepIcon = STEP_META[step].icon;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f7f9fc]">
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-end gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            {savedLabel ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">All changes {savedLabel.toLowerCase()}</span>
              </>
            ) : (
              <span>Not saved yet</span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Estimated time {minutesLeft}-{minutesLeft + 2} min
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr_320px] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="space-y-4 py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Profile Progress</p>
                  <span className="text-sm font-bold text-blue-600">{profileStrength}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${profileStrength}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Step {step + 1} of {STEPS.length}
                </p>
                <ul className="space-y-0">
                  {STEPS.map((label, i) => (
                    <li key={label} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            i < step
                              ? "bg-emerald-500 text-white"
                              : i === step
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          {i < step ? "✓" : i + 1}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`w-px flex-1 ${i < step ? "bg-emerald-300" : "bg-slate-200"}`} style={{ minHeight: 24 }} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p
                          className={`text-sm ${
                            i === step ? "font-semibold text-blue-600" : i < step ? "text-slate-700" : "text-slate-400"
                          }`}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-slate-400">
                          {i < step ? "Completed" : i === step ? "In Progress" : "Pending"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="space-y-3 py-5 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Need Help?</p>
                <p className="text-xs leading-5 text-slate-500">
                  Our team is here to help you build the perfect profile.
                </p>
                <a href="https://www.staffanchor.com/contact" target="_blank" rel="noreferrer">
                  <Button variant="outline" className="w-full">
                    Chat with Us
                  </Button>
                </a>
              </CardContent>
            </Card>
          </aside>

        <Card className="w-full border-slate-200 shadow-sm">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <StepIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                  {STEP_META[step].eyebrow}
                </p>
                <h2 className="text-2xl font-bold text-slate-950">{STEP_META[step].heading}</h2>
                <p className="mt-1 text-sm text-slate-600">{STEP_META[step].subtext}</p>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-sm text-blue-900">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{STEP_TIPS[step]}</span>
            </div>
            <p className="text-xs italic text-slate-400">&ldquo;{quote}&rdquo;</p>
          {step === 0 && (
            <>
              <FormField label="Full Name" required>
                <Input value={values.fullName} onChange={(e) => update("fullName", e.target.value)} />
              </FormField>
              <FormField label="Email" required>
                <Input type="email" value={values.email} onChange={(e) => update("email", e.target.value)} />
              </FormField>
              <FormField label="Phone (10-digit mobile number)" required>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  value={values.phone}
                  onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                />
              </FormField>
              <FormField label="Current City" required>
                <Select
                  value={values.cityChoice}
                  onChange={(e) => {
                    const city = e.target.value;
                    update("cityChoice", city);
                    if (city && city !== "Other") {
                      update("currentLocation", `${city}, ${cityStateMap[city]}`);
                      update("customCity", "");
                      update("customState", "");
                    } else {
                      update("currentLocation", "");
                    }
                  }}
                >
                  <option value="">Select...</option>
                  {cityOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
              {values.cityChoice === "Other" && (
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="City" required>
                    <Input
                      value={values.customCity}
                      onChange={(e) => {
                        update("customCity", e.target.value);
                        update("currentLocation", `${e.target.value}, ${values.customState}`);
                      }}
                    />
                  </FormField>
                  <FormField label="State" required>
                    <Input
                      value={values.customState}
                      onChange={(e) => {
                        update("customState", e.target.value);
                        update("currentLocation", `${values.customCity}, ${e.target.value}`);
                      }}
                    />
                  </FormField>
                </div>
              )}
              <FormField label="LinkedIn Profile URL" required>
                <Input value={values.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} />
              </FormField>
              <FormField label="Resume" required>
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
            </>
          )}

          {step === 1 && (
            <>
              <FormField label="Current / Last Employer" required>
                <Input value={values.currentEmployer} onChange={(e) => update("currentEmployer", e.target.value)} />
              </FormField>
              <FormField label="Current Job Title" required>
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
                <FormField label="Current Variable CTC" required>
                  <Select
                    value={values.currentVariableCtc}
                    onChange={(e) => update("currentVariableCtc", e.target.value)}
                  >
                    <option value="">Select... (0 LPA if none)</option>
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
              <FormField label="In how many days can you join?" required>
                <Select value={values.noticePeriod} onChange={(e) => update("noticePeriod", e.target.value)}>
                  <option value="">Select...</option>
                  {noticePeriods.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Expected Fixed CTC" required>
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
                <FormField label="Expected Variable CTC" required>
                  <Select
                    value={values.expectedVariableCtc}
                    onChange={(e) => update("expectedVariableCtc", e.target.value)}
                  >
                    <option value="">Select... (0 LPA if none)</option>
                    {ctcOptions.map((o) => (
                      <option key={o.label} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <FormField label="Highest Qualification" required>
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
              {values.highestQualification === "Other" && (
                <FormField label="Please specify" required>
                  <Input
                    value={values.customQualification}
                    onChange={(e) => update("customQualification", e.target.value)}
                  />
                </FormField>
              )}
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

                  <FormField label="Secondary Specializations" required>
                    <div className="grid gap-1.5">
                      {[...subDomainOptions.filter((o) => o !== values.subDomain), "None — single specialization only"].map(
                        (o) => (
                          <label key={o} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={values.secondarySubDomains.includes(o)}
                              onChange={() => toggleArrayValue("secondarySubDomains", o)}
                            />
                            {o}
                          </label>
                        )
                      )}
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
                      <FormField label="Average Handling Time (AHT)" required>
                        <Select value={values.aht} onChange={(e) => update("aht", e.target.value)}>
                          <option value="">Select...</option>
                          {ahtOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Daily Call Target (per user)" required>
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
                      <FormField label="Daily Talk-Time (hours, per user)" required>
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
                      <FormField label="Lead Source / Process (select all that apply)" required>
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
                        <FormField label="Deal Size Currency" required>
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
                        <FormField label="Typical Deal Size" required>
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
                      <FormField label="Typical Sales Cycle" required>
                        <Select value={values.cycle} onChange={(e) => update("cycle", e.target.value)}>
                          <option value="">Select...</option>
                          {salesCycleOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Selling Style" required>
                        <Select value={values.style} onChange={(e) => update("style", e.target.value)}>
                          <option value="">Select...</option>
                          {sellingStyleOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Sales Motion (select all that apply)" required>
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
                      <FormField label="Customer Segment" required>
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
                        <FormField label="Ticket Size Currency" required>
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
                        <FormField label="Typical Ticket Size" required>
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
                      <FormField label="Funnel Stage" required>
                        <Select value={values.funnel} onChange={(e) => update("funnel", e.target.value)}>
                          <option value="">Select...</option>
                          {funnelStageOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Geographic Scope" required>
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
                        Share your <strong>team&apos;s</strong> overall <strong>quarterly</strong> target (the
                        number for the full 3-month quarter, not a monthly figure) and achieved % for the last 4
                        completed quarters, counting back from today — not calendar Q1-Q4 of any particular year.
                      </p>
                      <FormField label="Team Target Currency" required>
                        <Select
                          value={values.teamTargetCurrency}
                          onChange={(e) => update("teamTargetCurrency", e.target.value as CurrencyValue | "")}
                        >
                          <option value="">Select...</option>
                          {currencyOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quarterField("4 quarters ago", values.teamTargetQ1, (v) => update("teamTargetQ1", v), values.teamQuotaQ1, (v) => update("teamQuotaQ1", v), values.teamTargetCurrency)}
                        {quarterField("3 quarters ago", values.teamTargetQ2, (v) => update("teamTargetQ2", v), values.teamQuotaQ2, (v) => update("teamQuotaQ2", v), values.teamTargetCurrency)}
                        {quarterField("2 quarters ago", values.teamTargetQ3, (v) => update("teamTargetQ3", v), values.teamQuotaQ3, (v) => update("teamQuotaQ3", v), values.teamTargetCurrency)}
                        {quarterField("Most recent completed quarter", values.teamTargetQ4, (v) => update("teamTargetQ4", v), values.teamQuotaQ4, (v) => update("teamQuotaQ4", v), values.teamTargetCurrency)}
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
                        Share your <strong>individual quarterly</strong> target (the number for the full
                        3-month quarter, not a monthly figure) and achieved % for the last 4 completed quarters,
                        counting back from today — not calendar Q1-Q4 of any particular year.
                      </p>
                      <FormField label="Individual Target Currency" required>
                        <Select
                          value={values.icTargetCurrency}
                          onChange={(e) => update("icTargetCurrency", e.target.value as CurrencyValue | "")}
                        >
                          <option value="">Select...</option>
                          {currencyOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {quarterField("4 quarters ago", values.icTargetQ1, (v) => update("icTargetQ1", v), values.quotaQ1, (v) => update("quotaQ1", v), values.icTargetCurrency)}
                        {quarterField("3 quarters ago", values.icTargetQ2, (v) => update("icTargetQ2", v), values.quotaQ2, (v) => update("quotaQ2", v), values.icTargetCurrency)}
                        {quarterField("2 quarters ago", values.icTargetQ3, (v) => update("icTargetQ3", v), values.quotaQ3, (v) => update("quotaQ3", v), values.icTargetCurrency)}
                        {quarterField("Most recent completed quarter", values.icTargetQ4, (v) => update("icTargetQ4", v), values.quotaQ4, (v) => update("quotaQ4", v), values.icTargetCurrency)}
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
              <FormField label="Tell us about your best win" required>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    Min. 100 characters — e.g. deal size, client, timeline, and why it mattered.
                  </p>
                  <textarea
                    maxLength={500}
                    placeholder="Describe a deal or achievement you are most proud of."
                    className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
                    value={values.bestWin}
                    onChange={(e) => update("bestWin", e.target.value)}
                  />
                  <p className={`text-right text-xs ${values.bestWin.length < 100 ? "text-amber-600" : "text-slate-400"}`}>
                    {values.bestWin.length} / 500 {values.bestWin.length < 100 ? `(min 100)` : ""}
                  </p>
                </div>
              </FormField>
              <FormField label="Tell us about a target you missed, and what you learned" required>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">
                    Min. 100 characters — what happened, and what you changed afterward.
                  </p>
                  <textarea
                    maxLength={500}
                    placeholder="What happened, and what did you learn from it?"
                    className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
                    value={values.toughLoss}
                    onChange={(e) => update("toughLoss", e.target.value)}
                  />
                  <p className={`text-right text-xs ${values.toughLoss.length < 100 ? "text-amber-600" : "text-slate-400"}`}>
                    {values.toughLoss.length} / 500 {values.toughLoss.length < 100 ? `(min 100)` : ""}
                  </p>
                </div>
              </FormField>
            </>
          )}

          {step === 4 && (
            <>
              <FormField label="Key Skills / Tools" required>
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
              <FormField label="Key Industries Worked In (multi-select, for searchability)" required>
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
              <FormField label="Work Mode Preference" required>
                <Select value={values.workMode} onChange={(e) => update("workMode", e.target.value)}>
                  <option value="">Select...</option>
                  {workModeOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Open to Relocation" required>
                <Select value={values.openToRelocation} onChange={(e) => update("openToRelocation", e.target.value)}>
                  <option value="">Select...</option>
                  {relocationOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Travel Preference" required>
                <Select
                  value={values.travelPreference}
                  onChange={(e) => update("travelPreference", e.target.value)}
                >
                  <option value="">Select...</option>
                  {travelPreferenceOptions.map((o) => (
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
              ← Previous
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} className="bg-blue-600 hover:bg-blue-700">
                Continue →
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? "Submitting..." : "Submit My Profile"}
              </Button>
            )}
          </div>
        </CardContent>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-3 py-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Your Profile Preview</p>
                <Eye className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {values.fullName.trim() || "Your name"}
                  </p>
                  <p className="truncate text-xs text-slate-500">{previewRoleLabel}</p>
                  {values.currentLocation && <p className="truncate text-xs text-slate-400">{values.currentLocation}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                <Pencil className="h-3 w-3" />
                Edit basic info
              </button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-4 py-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Profile Strength</p>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {strengthLabel}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#2563eb ${profileStrength * 3.6}deg, #e2e8f0 0deg)`,
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
                    {profileStrength}%
                  </div>
                </div>
                <p className="text-xs leading-5 text-slate-500">
                  Complete more sections to increase your visibility to recruiters.
                </p>
              </div>
              <ul className="space-y-2 border-t border-slate-100 pt-3">
                {STEPS.map((label, i) => (
                  <li key={label} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          i < step ? "bg-emerald-500" : i === step ? "bg-blue-600" : "bg-slate-300"
                        }`}
                      />
                      <span
                        className={
                          i === step ? "font-medium text-slate-900" : i < step ? "text-slate-600" : "text-slate-400"
                        }
                      >
                        {label}
                      </span>
                    </span>
                    <span className="font-medium text-slate-400">+{STEP_WEIGHTS[i]}%</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-2 py-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-slate-900">Why we ask this</p>
              </div>
              <p className="text-sm leading-6 text-slate-600">{STEP_TIPS[step]}</p>
            </CardContent>
          </Card>
        </aside>
        </div>
      </main>
    </div>
  );
}
