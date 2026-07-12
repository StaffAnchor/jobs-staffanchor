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
import {
  computeCareerGaps,
  computeStabilityScore,
  computeDomainConsistencyScore,
  mergeTimelines,
  type ProfileTimelineEntry,
  type ResumeTimelineEntry,
} from "@/lib/career-timeline";
import CareerTimelinePanel from "@/modules/candidate-portal/CareerTimelinePanel";
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
  geographicScopeOptions,
  highestQualificationOptions,
  industryOptions,
  insideSalesSubDomains,
  leadSourceOptions,
  nonSalesSubDomains,
  relocationOptions,
  roleLevelOptions,
  roleTypeOptions,
  salesCycleOptions,
  internationalRegionOptions,
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

// Live parse-on-upload: the "magical triage checklist" shown while
// /api/parse-resume-preview reads the just-attached resume. Purely cosmetic
// staged reveal (not literally tied to server progress, since a single fetch
// has no intermediate progress events) -- but paced to roughly match how long
// the real extraction takes, so it reads as "working" rather than "fake".
const TRIAGE_STEPS = [
  "Reading your resume…",
  "Finding your current role…",
  "Mapping your specialty…",
  "Almost done…",
];

// Shape returned by /api/parse-resume-preview -- kept in sync manually with
// that route's ParsedResumePreview type (avoided a cross-import from an API
// route module to keep this component decoupled from route internals).
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

function findMatchingOption(options: readonly string[], raw: string | null): string | null {
  if (!raw) return null;
  const norm = raw.trim().toLowerCase();
  return options.find((o) => o.toLowerCase() === norm || o.toLowerCase().includes(norm) || norm.includes(o.toLowerCase())) ?? null;
}

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
  customSubDomain: string;
  secondarySubDomains: string[];
  roleLevel: string;
  roleType: string;
  teamSize: string;
  // Deal size/cycle/style/motion/segment/funnel/scope, inside-sales fields,
  // quarterly targets, and best-win/missed-target are now all captured once
  // on the Career Timeline current-role card instead of duplicated here as
  // global fields (Round 8 restructure) -- see CareerTimelinePanel.tsx and
  // the derivation in handleSubmit below.
  currentIndustry: string;
  customCurrentIndustry: string;
  selectedIndustries: string[];
  customIndustry: string;
  noOtherIndustries: boolean;
  consent: boolean;
  // Career Timeline now lives inside the same wizard (its own step, right
  // after Basic Information) instead of a separate always-visible panel --
  // see ApplyForm's "Career Timeline" step render + CareerTimelinePanel,
  // which is now a controlled component driven entirely by this array.
  careerTimeline: ProfileTimelineEntry[];
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
  customSubDomain: "",
  secondarySubDomains: [],
  roleLevel: "",
  roleType: "",
  teamSize: "",
  selectedIndustries: [],
  currentIndustry: "",
  customCurrentIndustry: "",
  customIndustry: "",
  noOtherIndustries: false,
  consent: false,
  careerTimeline: [],
};

// Round 8 restructure: collapsed from 6 steps to 4. "Career & Compensation"
// and "Sales Specialization" used to split "who you are" (comp, experience,
// qualification) from "how you sell" (deal size, cycle, style, motion) --
// but deal size/cycle/style/motion are properties of a specific role, not a
// fixed trait of the candidate, and Career Timeline already asks them per
// role. Merged the identity-level fields (comp, quals, Function/Domain,
// specialization, role level) into one "Profile Information" step, and moved
// every role-specific field (deal size, cycle, style, motion, segment, inside
// -sales detail, current employer/title, and the quarterly target/achievement
// grid + best-win/missed-target reflections) into Career Timeline's
// current-role card -- asked exactly once, attached to the role it's
// actually about, instead of duplicated across a global step.
const STEPS = ["Basic Information", "Career Timeline", "Profile Information", "Preferences & Submit"] as const;

const STEP_TIME_MINUTES = [1, 2, 1.5, 1];

const STEP_WEIGHTS = [15, 40, 30, 15];

const STEP_META = [
  {
    icon: User,
    eyebrow: "Basic Information",
    heading: "Let's start with the basics",
    subtext: "Your contact details and resume — how a recruiter actually reaches you.",
  },
  {
    icon: Briefcase,
    eyebrow: "Career Timeline",
    heading: "Walk us through your career",
    subtext:
      "Add every role, most recent first. For your current role we'll also ask about targets, achievement, and specifics — everything else you'll only see once, attached to the right job.",
  },
  {
    icon: Target,
    eyebrow: "Profile Information",
    heading: "Tell us where you stand today",
    subtext: "Experience, compensation, and specialization — the context every mandate is filtered by.",
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
  1: "A full career timeline -- with real target vs. achievement on your current role -- is the single biggest thing that turns a resume into a story a recruiter can actually pitch to a client.",
  2: "Specific specializations get found and comp context lets a recruiter tell whether a mandate is even a fit -- before wasting your time on a call.",
  3: "Almost done — skills and industries are how recruiters filter and find you for the right mandate.",
};

const DRAFT_STORAGE_KEY = "sa_candidate_draft_v1";
// Sales Passport progressive-save architecture: whichever door a candidate walks
// in through (bare signup or a direct job application), the moment their Stage 1
// identity fields are valid we push a real (not just localStorage) row via the
// same submit_candidate RPC the final submit already uses -- so a recruiter can
// see a live lead the instant someone starts, not only once they finish. This is
// a background best-effort sync only: it never blocks the UI, never touches the
// resume upload/segment_data/final-submit payload logic, and silently no-ops on
// failure since the real, authoritative save still happens in handleSubmit.
const CANDIDATE_ID_STORAGE_KEY = "sa_candidate_id_v1";

// Curated set of fields used to compute "profile strength" — weighted evenly, just
// enough signal to feel meaningful without trying to be a perfectly precise score.
// Fields every candidate can fill regardless of category/role -- always counted
// in the profile-strength denominator.
const STRENGTH_FIELDS_BASE: (keyof FormState)[] = [
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
  "selectedSkills",
  "currentIndustry",
  "selectedIndustries",
  "workMode",
  "openToRelocation",
];

// Deal size, quarterly targets, and best-win/missed-target now live on the
// Career Timeline current-role entry rather than as separate global fields
// (Round 8 restructure) -- their completeness is folded into the timeline
// scoring inside profileStrength below instead of a flat field list here.

export type ExistingProfile = {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  current_location: string | null;
  linkedin_url: string | null;
  resume_file_url: string | null;
  current_employer: string | null;
  current_job_title: string | null;
  current_employment_status: string | null;
  total_experience_years: number | null;
  current_fixed_ctc: number | null;
  current_variable_ctc: number | null;
  esops_held: boolean | null;
  notice_period: string | null;
  expected_fixed_ctc: number | null;
  expected_variable_ctc: number | null;
  category: string | null;
  sub_domain: string | null;
  secondary_sub_domains: string[] | null;
  industries: string[] | null;
  current_industry: string | null;
  segment_data: Record<string, unknown> | null;
  open_to_relocation: string | null;
  work_mode: string | null;
  highest_qualification: string | null;
  skills: string | null;
  self_assessment: { best?: string; lost?: string } | null;
  status: string;
  // Optional -- only present when the caller (candidate portal) already
  // loaded the Career Timeline alongside the rest of the profile. Used purely
  // to reweight Passport Readiness; never rendered or edited by this form
  // itself (that stays CareerTimelinePanel's job).
  // Typed loosely (unknown) to match how the candidate-portal page already
  // passes this column through elsewhere (see its `as never` casts into
  // CareerTimelinePanel) -- cast to the real shape at the point of use below.
  career_timeline_profile?: unknown;
  career_timeline_resume?: unknown;
};

function seg(data: Record<string, unknown> | null | undefined, key: string): string {
  const v = data?.[key];
  return v === undefined || v === null ? "" : String(v);
}
function segArr(data: Record<string, unknown> | null | undefined, key: string): string[] {
  const v = data?.[key];
  return Array.isArray(v) ? v.map(String) : [];
}
function segNumArr(data: Record<string, unknown> | null | undefined, key: string): string[] {
  const v = data?.[key];
  return Array.isArray(v) ? v.map((n) => String(n)) : ["", "", "", ""];
}

// Best-effort reverse-map of an existing candidates row (+ its segment_data)
// back into the wizard's flat FormState, so the same "Build your profile"
// form can also be used to EDIT an existing profile from the candidate
// portal instead of maintaining a second, separately-validated form.
function buildFormStateFromProfile(p: ExistingProfile): FormState {
  const sd = p.segment_data ?? null;
  const knownCity = p.current_location && cityOptions.includes(p.current_location);
  const roleTypeRaw = seg(sd, "role_type");
  const knownQualification =
    p.highest_qualification && highestQualificationOptions.includes(p.highest_qualification);
  const knownSubDomain =
    p.sub_domain && subDomainsForCategory((p.category ?? null) as CategoryValue | null).includes(p.sub_domain);

  return {
    ...initialState,
    fullName: p.full_name ?? "",
    email: p.email ?? "",
    phone: p.phone ?? "",
    currentLocation: p.current_location ?? "",
    cityChoice: knownCity ? (p.current_location as string) : p.current_location ? "Other" : "",
    customCity: !knownCity && p.current_location ? p.current_location.split(",")[0].trim() : "",
    customState: !knownCity && p.current_location ? (p.current_location.split(",")[1] ?? "").trim() : "",
    linkedinUrl: p.linkedin_url ?? "",
    currentEmployer: p.current_employer ?? "",
    currentJobTitle: p.current_job_title ?? "",
    currentEmploymentStatus: p.current_employment_status ?? "",
    totalExperienceYears: p.total_experience_years != null ? String(p.total_experience_years) : "",
    currentFixedCtc: p.current_fixed_ctc != null ? String(p.current_fixed_ctc) : "",
    currentVariableCtc: p.current_variable_ctc != null ? String(p.current_variable_ctc) : "",
    esopsHeld: p.esops_held ?? false,
    selectedSkills: p.skills ? p.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
    noticePeriod: p.notice_period ?? "",
    expectedFixedCtc: p.expected_fixed_ctc != null ? String(p.expected_fixed_ctc) : "",
    expectedVariableCtc: p.expected_variable_ctc != null ? String(p.expected_variable_ctc) : "",
    highestQualification: knownQualification ? (p.highest_qualification as string) : p.highest_qualification ? "Other" : "",
    customQualification: !knownQualification ? (p.highest_qualification ?? "") : "",
    workMode: p.work_mode ?? "",
    openToRelocation: p.open_to_relocation ?? "",
    travelPreference: seg(sd, "travel_preference"),
    category: (p.category ?? "") as CategoryValue | "",
    subDomain: knownSubDomain ? (p.sub_domain as string) : p.sub_domain ? "Other" : "",
    customSubDomain: !knownSubDomain && p.sub_domain ? p.sub_domain : "",
    secondarySubDomains: p.secondary_sub_domains ?? [],
    roleLevel: seg(sd, "role_level"),
    roleType: roleTypeRaw === "Team Lead" ? "Leading a Team" : roleTypeRaw === "IC" ? "Individual Contributor (IC)" : "",
    teamSize: seg(sd, "team_size"),
    // Deal size, sales cycle, selling style, motion, segment, scope,
    // inside-sales detail, quarterly targets/achievement, and best-win/
    // missed-target are no longer separate global FormState fields (Round 8)
    // -- they're reconstructed below straight from career_timeline_profile's
    // current-role entry, same as everywhere else in the wizard.
    ...(() => {
      const knownCurrentIndustry =
        p.current_industry && industryOptions.includes(p.current_industry);
      const allIndustries = p.industries ?? [];
      const others = p.current_industry
        ? allIndustries.filter((i) => i !== p.current_industry)
        : allIndustries;
      return {
        currentIndustry: knownCurrentIndustry
          ? (p.current_industry as string)
          : p.current_industry
            ? "Other"
            : "",
        customCurrentIndustry: !knownCurrentIndustry ? (p.current_industry ?? "") : "",
        selectedIndustries: others,
        noOtherIndustries: !!p.current_industry && others.length === 0 && allIndustries.length > 0,
      };
    })(),
    consent: true,
    careerTimeline: ((p.career_timeline_profile ?? []) as ProfileTimelineEntry[]),
  };
}

export default function ApplyForm({
  existingProfile,
  onSaved,
}: {
  existingProfile?: ExistingProfile;
  onSaved?: () => void;
} = {}) {
  const isEditMode = !!existingProfile;
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormState>(() =>
    existingProfile ? buildFormStateFromProfile(existingProfile) : initialState
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const hasExistingResume = !!existingProfile?.resume_file_url;
  // Live parse-on-upload preview state (Sales Passport "magical resume-triage"
  // step). Entirely additive over the existing resumeFile/values state --
  // resumeFile itself, its eventual upload to storage, and the final DB
  // submission payload are all untouched. This only pre-fills `values` via
  // the same `update()` setter every other field already uses, gated behind
  // an explicit "looks right?" confirmation so a bad AI guess never silently
  // overwrites what a candidate typed themselves.
  const [resumeParseStatus, setResumeParseStatus] = useState<"idle" | "parsing" | "done">("idle");
  const [resumeExtraction, setResumeExtraction] = useState<ResumeExtraction | null>(null);
  const [extractionHandled, setExtractionHandled] = useState(false);
  const [triageStepIndex, setTriageStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<string[]>(FALLBACK_QUOTES);
  const [noticePeriods, setNoticePeriods] = useState<string[]>(defaultNoticePeriods);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savedLabel, setSavedLabel] = useState<string>("");
  const [stepJustCompleted, setStepJustCompleted] = useState(false);
  const [earlySaveCandidateId, setEarlySaveCandidateId] = useState<string | null>(null);

  // Restore a draft from localStorage on first load (resume upload can't be
  // restored — the browser doesn't let us persist raw File objects — so the
  // candidate is asked to re-attach it if they left mid-way).
  // Skipped entirely in edit mode: the form is already hydrated from the
  // candidate's real saved profile, and we don't want a stray anonymous
  // localStorage draft from this browser bleeding into their account.
  useEffect(() => {
    if (isEditMode) return;
    try {
      const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw) as { values: FormState; step: number };
        if (draft?.values) {
          setValues((prev) => ({ ...prev, ...draft.values }));
          const restoredStep = draft.step ?? 0;
          if (restoredStep > 0) {
            // The resume file itself can never survive a localStorage round-trip,
            // so a candidate resuming past step 0 is always missing it again.
            // Send them back to step 0 so they're forced to re-attach it instead
            // of being able to click straight through to a resume-less submission.
            setStep(0);
            setErrorMsg("Welcome back! Your other answers were saved — please re-attach your resume to continue.");
          } else {
            setStep(restoredStep);
          }
        }
      }
    } catch {
      // ignore malformed drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft (debounced) whenever values or step change. Skipped in
  // edit mode -- saving happens for real against the candidate's row, there
  // is no anonymous draft to protect.
  useEffect(() => {
    if (isEditMode) return;
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

  // Progressive save to Supabase (real row, not just localStorage) -- fires once
  // Stage 1 identity fields are valid, upgraded to profile_stage "applicant" once
  // Stage 2 current-role fields are also filled in. Deliberately excludes the
  // resume upload and quarterly-target segment_data -- those stay exclusively in
  // handleSubmit's final, authoritative payload so this background sync can
  // never race or conflict with it.
  useEffect(() => {
    if (isEditMode) return;
    const hasStage1 = values.fullName.trim() && values.email.trim() && values.phone.trim() && values.category;
    if (!hasStage1) return;
    const handle = setTimeout(async () => {
      try {
        const hasStage2Core = !!(values.currentEmployer && values.currentJobTitle && values.totalExperienceYears);
        const stage = hasStage2Core ? "applicant" : "lead";
        const payload: Record<string, unknown> = {
          full_name: values.fullName.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          current_location: values.currentLocation || undefined,
          category: values.category || undefined,
          sub_domain: values.subDomain || undefined,
          current_employer: values.currentEmployer || undefined,
          current_job_title: values.currentJobTitle || undefined,
          current_employment_status: values.currentEmploymentStatus || undefined,
          total_experience_years: values.totalExperienceYears
            ? Math.min(Number(values.totalExperienceYears), 40)
            : undefined,
          notice_period: values.noticePeriod || undefined,
          highest_qualification: values.highestQualification || undefined,
          current_industry: values.currentIndustry || undefined,
          skills: values.selectedSkills.length ? values.selectedSkills.join(", ") : undefined,
          source: "onboarding_progressive_save",
          created_by: "self_registration",
          profile_stage: stage,
        };
        const { data, error } = await supabase.rpc("submit_candidate", { payload });
        if (!error && data) {
          setEarlySaveCandidateId(data as string);
          try {
            window.localStorage.setItem(CANDIDATE_ID_STORAGE_KEY, data as string);
          } catch {
            // ignore storage errors
          }
        }
      } catch {
        // Best-effort background sync only -- silently skip on any failure.
        // The real save still happens in handleSubmit regardless.
      }
    }, 4000);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isEditMode,
    values.fullName,
    values.email,
    values.phone,
    values.category,
    values.subDomain,
    values.currentLocation,
    values.currentEmployer,
    values.currentJobTitle,
    values.currentEmploymentStatus,
    values.totalExperienceYears,
    values.noticePeriod,
    values.highestQualification,
    values.currentIndustry,
    values.selectedSkills,
  ]);

  // Round 8: currentEmployer/currentJobTitle are no longer entered directly
  // in this wizard -- they're sourced from whichever Career Timeline entry
  // has end_month === null (the current role), kept in sync here so the
  // progressive-save effect above, the gap-detection call, and the final
  // submit payload all keep working off these two fields unchanged.
  useEffect(() => {
    const current = values.careerTimeline.find((e) => e.end_month === null);
    if (!current) return;
    if (current.company === values.currentEmployer && current.title === values.currentJobTitle) return;
    setValues((prev) => ({
      ...prev,
      currentEmployer: current.company || prev.currentEmployer,
      currentJobTitle: current.title || prev.currentJobTitle,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.careerTimeline]);

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
  const skillSearchResults = useMemo(
    () => searchSkills(values.customSkill, values.selectedSkills),
    [values.customSkill, values.selectedSkills]
  );

  const profileStrength = useMemo(() => {
    const applicableFields: (keyof FormState)[] = [...STRENGTH_FIELDS_BASE];
    const filled = applicableFields.filter((k) => {
      const v = values[k];
      return Array.isArray(v) ? v.length > 0 : String(v).trim() !== "";
    }).length;

    // Career Timeline is its own step (values.careerTimeline). Its weight is
    // higher than a plain field now that deal size, quarterly targets, and
    // best-win/missed-target all live on the current-role entry instead of
    // as separate global fields (Round 8 restructure).
    let timelineWeight = 3;
    let timelineScore = 0;
    const timelineEntries = values.careerTimeline ?? [];
    const resumeEntries = (existingProfile?.career_timeline_resume ?? []) as ResumeTimelineEntry[];
    if (timelineEntries.length > 0) timelineScore += 1;
    const currentEntry = timelineEntries.find((e) => e.end_month === null);
    const isCurrentSales = currentEntry?.category === "b2b_sales" || currentEntry?.category === "b2c_sales";
    if (currentEntry && (!isCurrentSales || currentEntry.deal_size_band)) timelineScore += 1;
    if (!isCurrentSales || (currentEntry && currentEntry.achieved_q4 && (currentEntry.best_win ?? "").length >= 100)) {
      timelineScore += 1;
    }
    const gaps = computeCareerGaps({
      profileEntries: timelineEntries,
      resumeEntries,
      currentEmployer: values.currentEmployer || null,
    });
    void gaps; // computed for future use (unresolved-resume-flag surfacing); not yet folded into the score

    const totalUnits = applicableFields.length + timelineWeight;
    const filledUnits = filled + timelineScore;
    return Math.round((filledUnits / totalUnits) * 100);
  }, [values, existingProfile]);

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

  // Tiered Passport Readiness Metric -- a coarser, more motivating read on the
  // same underlying profileStrength number than a bare percentage. Recruiters
  // and hiring managers think in tiers ("is this a strong profile or a thin
  // one") more readily than in exact percentages, and tiers give candidates a
  // concrete next milestone to chase rather than a number that just ticks up.
  // Purely a presentation layer over the existing profileStrength calculation
  // -- no new fields, no change to what counts toward it.
  const readinessTier: "Basic" | "Good" | "Excellent" | "Premium" =
    profileStrength >= 90 ? "Premium" : profileStrength >= 65 ? "Excellent" : profileStrength >= 35 ? "Good" : "Basic";

  const READINESS_META: Record<
    "Basic" | "Good" | "Excellent" | "Premium",
    { ring: string; chipBg: string; chipText: string; dot: string; blurb: string }
  > = {
    Basic: {
      ring: "#94a3b8",
      chipBg: "bg-slate-100",
      chipText: "text-slate-600",
      dot: "bg-slate-400",
      blurb: "A few more sections and recruiters will start seeing a real picture of you.",
    },
    Good: {
      ring: "#2563eb",
      chipBg: "bg-blue-50",
      chipText: "text-blue-700",
      dot: "bg-blue-500",
      blurb: "Solid start -- fill in your role details and targets to stand out further.",
    },
    Excellent: {
      ring: "#7c3aed",
      chipBg: "bg-violet-50",
      chipText: "text-violet-700",
      dot: "bg-violet-500",
      blurb: "Strong profile -- recruiters can already make a confident first read on you.",
    },
    Premium: {
      ring: "#059669",
      chipBg: "bg-emerald-50",
      chipText: "text-emerald-700",
      dot: "bg-emerald-500",
      blurb: "Complete profile -- you're in the top tier of what recruiters see.",
    },
  };
  const readinessMeta = READINESS_META[readinessTier];

  function addCustomSkill(skillOverride?: string) {
    const skill = (skillOverride ?? values.customSkill).trim();
    if (!skill) return;
    setValues((prev) =>
      prev.selectedSkills.includes(skill)
        ? { ...prev, customSkill: "" }
        : { ...prev, selectedSkills: [...prev.selectedSkills, skill], customSkill: "" }
    );
  }

  // quarterField (the old global-target-fields JSX helper) was removed in the
  // Round 8 restructure -- the quarterly target/achievement grid now lives
  // directly inside CareerTimelinePanel's current-role card, which has its
  // own local QuarterField component.

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

  async function parseResumeLive(file: File) {
    setResumeExtraction(null);
    setExtractionHandled(false);
    setResumeParseStatus("parsing");
    setTriageStepIndex(0);
    const stepTimer = setInterval(() => {
      setTriageStepIndex((i) => Math.min(i + 1, TRIAGE_STEPS.length - 1));
    }, 650);
    try {
      const fd = new FormData();
      fd.append("resume", file);
      const res = await fetch("/api/parse-resume-preview", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.ok && data.fields) {
        setResumeExtraction(data.fields as ResumeExtraction);
        setResumeParseStatus("done");
      } else {
        // Nothing usable came back (unparseable file, no API key configured,
        // model failure) -- fall back silently to the plain, un-prefilled
        // form rather than showing an error for what is a pure enhancement.
        setResumeParseStatus("idle");
      }
    } catch {
      setResumeParseStatus("idle");
    } finally {
      clearInterval(stepTimer);
    }
  }

  // Applies every non-empty extracted field into the existing FormState via
  // the same `update()`/setValues path used everywhere else in the wizard --
  // no new state shape, no bypass of validation later in the flow. Only
  // called when the candidate explicitly confirms the verification card.
  function applyResumeExtraction() {
    if (!resumeExtraction) return;
    const matchedQualification = findMatchingOption(highestQualificationOptions, resumeExtraction.highest_qualification);
    const matchedIndustry = findMatchingOption(industryOptions, resumeExtraction.current_industry);
    setValues((prev) => ({
      ...prev,
      fullName: resumeExtraction.full_name || prev.fullName,
      phone: resumeExtraction.phone ? resumeExtraction.phone.replace(/\D/g, "").slice(-10) : prev.phone,
      linkedinUrl: resumeExtraction.linkedin_url || prev.linkedinUrl,
      currentEmployer: resumeExtraction.current_employer || prev.currentEmployer,
      currentJobTitle: resumeExtraction.current_job_title || prev.currentJobTitle,
      totalExperienceYears:
        resumeExtraction.total_experience_years != null
          ? String(Math.min(41, Math.max(0, resumeExtraction.total_experience_years)))
          : prev.totalExperienceYears,
      highestQualification: matchedQualification || (resumeExtraction.highest_qualification ? "Other" : prev.highestQualification),
      customQualification:
        !matchedQualification && resumeExtraction.highest_qualification
          ? resumeExtraction.highest_qualification
          : prev.customQualification,
      currentIndustry: matchedIndustry || (resumeExtraction.current_industry ? "Other" : prev.currentIndustry),
      customCurrentIndustry:
        !matchedIndustry && resumeExtraction.current_industry ? resumeExtraction.current_industry : prev.customCurrentIndustry,
      category: resumeExtraction.category_guess || prev.category,
      selectedSkills:
        resumeExtraction.skills.length > 0
          ? Array.from(new Set([...prev.selectedSkills, ...resumeExtraction.skills]))
          : prev.selectedSkills,
    }));
    setExtractionHandled(true);
  }

  function toggleArrayValue(
    key: "secondarySubDomains" | "selectedSkills" | "selectedIndustries",
    value: string
  ) {
    setValues((prev) => {
      const current = prev[key];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
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
      if (!resumeFile && !hasExistingResume) return "Please upload your resume.";
    }
    if (step === 1) {
      // Deep, per-role validation (deal size, quarterly targets, best-win/
      // missed-target, etc.) already happens inside CareerTimelinePanel's own
      // "Save role" action. Here we just make sure a current role actually
      // exists before letting the wizard move on -- current-role details are
      // the single most important thing this whole form is built to capture.
      if (!values.careerTimeline.length) {
        return "Please add your current role to your Career Timeline before continuing.";
      }
      if (!values.careerTimeline.some((e) => e.end_month === null)) {
        return "Please add (or mark) your current role in the Career Timeline -- check 'Current role' on the entry that's still ongoing.";
      }
    }
    if (step === 2) {
      if (!values.currentEmploymentStatus) return "Employment status is required.";
      if (!values.totalExperienceYears) return "Total experience is required.";
      if (!values.currentFixedCtc) return "Current fixed CTC is required.";
      if (!values.currentVariableCtc) return "Current variable CTC is required (select 0 LPA if none).";
      if (!values.noticePeriod) return "Please let us know how many days you'd need to join.";
      if (!values.expectedFixedCtc) return "Expected fixed CTC is required.";
      if (!values.expectedVariableCtc) return "Expected variable CTC is required (select 0 LPA if none).";
      if (!values.highestQualification) return "Highest qualification is required.";
      if (values.highestQualification === "Other" && !values.customQualification.trim()) {
        return "Please specify your qualification.";
      }
      if (!values.category) return "Please select your function / domain.";
      if (!values.subDomain) return "Please select your primary specialization.";
      if (values.subDomain === "Other" && !values.customSubDomain.trim()) {
        return "Please specify your primary specialization.";
      }
      if (!values.roleLevel) return "Please select your role level.";
      if (!values.roleType) return "Please select whether you are an IC or leading a team.";
      if (values.roleType === "Leading a Team" && !values.teamSize) return "Please select your team size.";
      if (isSales && !values.secondarySubDomains.length) {
        return "Please select at least one option (choose 'None — single specialization only' if not applicable).";
      }
    }
    if (step === 3) {
      if (!values.selectedSkills.length) return "Please add at least one skill.";
      if (!values.currentIndustry) return "Please select your current industry.";
      if (values.currentIndustry === "Other" && !values.customCurrentIndustry.trim()) {
        return "Please specify your current industry.";
      }
      if (!values.noOtherIndustries && !values.selectedIndustries.length) {
        return "Please select at least one previous industry, or check 'No other industries'.";
      }
      if (!values.workMode) return "Please select a work mode preference.";
      if (!values.openToRelocation) return "Please select your relocation preference.";
      if (!values.travelPreference) return "Please select your travel preference.";
      if (!values.consent) return "Please confirm consent to continue.";
    }
    return null;
  }

  const isSalesCategory = values.category === "b2b_sales" || values.category === "b2c_sales";

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
    // Belt-and-suspenders: resume is only checked by validateStep() on step 0,
    // but a restored draft (or any future step-reordering) could otherwise reach
    // this point on a later step with no resume attached. Never let that submit.
    if (!resumeFile && !hasExistingResume) {
      setErrorMsg("Please upload your resume before submitting.");
      setStep(0);
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

      // Round 8: deal size, sales cycle, selling style, motion, segment, scope,
      // inside-sales detail, and quarterly target/achievement all now live on
      // the current Career Timeline entry (the one with end_month === null)
      // instead of as separate global wizard fields -- derive segment_data
      // from it here so existing CRM filters/matching (which read these exact
      // top-level segment_data keys) keep working unchanged.
      const currentTimelineEntry = values.careerTimeline.find((e) => e.end_month === null);
      const isCurrentTeamLead = !!currentTimelineEntry?.team_size;

      const segmentData: Record<string, unknown> = {
        role_level: values.roleLevel,
        role_type: values.roleType === "Leading a Team" ? "Team Lead" : "IC",
        travel_preference: values.travelPreference || undefined,
      };

      if (values.roleType === "Leading a Team" && values.teamSize) {
        segmentData.team_size = values.teamSize;
      }

      if (currentTimelineEntry) {
        // Quarterly targets & achievement (current role only). A team lead
        // always reports the team's own target + achievement; if they also
        // carry an individual number, that's reported separately and summed
        // into a computed total per quarter.
        const teamTargets = [
          currentTimelineEntry.target_q1,
          currentTimelineEntry.target_q2,
          currentTimelineEntry.target_q3,
          currentTimelineEntry.target_q4,
        ]
          .filter((v): v is string => !!v && v.trim() !== "")
          .map((v) => Number(v));
        const teamAchievement = [
          currentTimelineEntry.achieved_q1,
          currentTimelineEntry.achieved_q2,
          currentTimelineEntry.achieved_q3,
          currentTimelineEntry.achieved_q4,
        ].filter((v): v is string => !!v && v.trim() !== "");
        const icTargets = [
          currentTimelineEntry.ic_target_q1,
          currentTimelineEntry.ic_target_q2,
          currentTimelineEntry.ic_target_q3,
          currentTimelineEntry.ic_target_q4,
        ]
          .filter((v): v is string => !!v && v.trim() !== "")
          .map((v) => Number(v));
        const icAchievement = [
          currentTimelineEntry.ic_achieved_q1,
          currentTimelineEntry.ic_achieved_q2,
          currentTimelineEntry.ic_achieved_q3,
          currentTimelineEntry.ic_achieved_q4,
        ].filter((v): v is string => !!v && v.trim() !== "");

        if (isCurrentTeamLead) {
          if (teamTargets.length) segmentData.team_targets = teamTargets;
          if (teamAchievement.length) segmentData.team_quota = teamAchievement;
          if (currentTimelineEntry.target_currency) segmentData.team_target_currency = currentTimelineEntry.target_currency;
          if (currentTimelineEntry.has_ic_target_too === "Yes") {
            if (icTargets.length) segmentData.ic_targets = icTargets;
            if (icAchievement.length) segmentData.quota = icAchievement;
            if (currentTimelineEntry.ic_target_currency) segmentData.ic_target_currency = currentTimelineEntry.ic_target_currency;
            if (
              icTargets.length === 4 &&
              teamTargets.length === 4 &&
              currentTimelineEntry.ic_target_currency &&
              currentTimelineEntry.ic_target_currency === currentTimelineEntry.target_currency
            ) {
              segmentData.total_targets = teamTargets.map((t, i) => t + icTargets[i]);
            }
          }
        } else {
          if (teamTargets.length) segmentData.ic_targets = teamTargets;
          if (teamAchievement.length) segmentData.quota = teamAchievement;
          if (currentTimelineEntry.target_currency) segmentData.ic_target_currency = currentTimelineEntry.target_currency;
        }

        if (currentTimelineEntry.category === "b2b_sales") {
          Object.assign(segmentData, {
            deal_size: currentTimelineEntry.deal_size_band || undefined,
            deal_size_currency: currentTimelineEntry.largest_deal_currency || undefined,
            cycle: currentTimelineEntry.sales_cycle || undefined,
            style: currentTimelineEntry.selling_style || undefined,
            motion: currentTimelineEntry.sales_motion || undefined,
            segment: currentTimelineEntry.customer_segment || undefined,
          });
        } else if (currentTimelineEntry.category === "b2c_sales") {
          Object.assign(segmentData, {
            ticket: currentTimelineEntry.deal_size_band || undefined,
            ticket_currency: currentTimelineEntry.largest_deal_currency || undefined,
            scope: currentTimelineEntry.geo_scope || undefined,
          });
        }

        if (insideSalesSubDomains.includes(currentTimelineEntry.sub_domain)) {
          Object.assign(segmentData, {
            aht: currentTimelineEntry.aht || undefined,
            daily_call_target: currentTimelineEntry.daily_call_target || undefined,
            daily_talk_time: currentTimelineEntry.daily_talk_time || undefined,
            lead_sources: currentTimelineEntry.lead_source ? [currentTimelineEntry.lead_source] : undefined,
          });
        }
      }

      // Career Timeline now lives inside this same wizard (Step 2), so its
      // scores get computed and saved alongside everything else in this one
      // submit -- no separate save action, no separate DB write.
      const resumeTimelineEntries = (existingProfile?.career_timeline_resume ?? []) as ResumeTimelineEntry[];
      const mergedTimeline = mergeTimelines(values.careerTimeline, resumeTimelineEntries);
      const stabilityResult = computeStabilityScore(mergedTimeline);
      const domainResult = computeDomainConsistencyScore(values.careerTimeline);

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
        sub_domain: (values.subDomain === "Other" ? values.customSubDomain.trim() : values.subDomain) || null,
        secondary_sub_domains: values.secondarySubDomains.filter((d) => d !== "None — single specialization only"),
        segment_data: segmentData,
        self_assessment: {
          best: currentTimelineEntry?.best_win || undefined,
          lost: currentTimelineEntry?.tough_loss || undefined,
        },
        open_to_relocation: values.openToRelocation || null,
        work_mode: values.workMode || null,
        highest_qualification:
          values.highestQualification === "Other"
            ? values.customQualification || null
            : values.highestQualification || null,
        // industries[] stores the full union (current + previous) so any
        // existing consumer that just wants "every industry this person has
        // touched" (filters, AI summary, etc.) keeps working unchanged --
        // current_industry is the new, more precise field for "what are
        // they in right now".
        current_industry:
          values.currentIndustry === "Other"
            ? values.customCurrentIndustry.trim() || null
            : values.currentIndustry || null,
        industries: Array.from(
          new Set(
            [
              values.currentIndustry === "Other"
                ? values.customCurrentIndustry.trim()
                : values.currentIndustry,
              ...values.selectedIndustries,
            ].filter((v): v is string => !!v)
          )
        ),
        skills: values.selectedSkills.length ? values.selectedSkills.join(", ") : null,
        career_timeline_profile: values.careerTimeline,
        stability_score: stabilityResult?.score ?? null,
        domain_consistency_score: domainResult?.score ?? null,
        consent: values.consent,
        // Reaching this final submit with the Stage-3-only fields (secondary
        // specializations, self-assessment write-ups, travel preference) filled
        // in marks a genuinely completed Build Your Profile wizard; a shorter
        // submission (bare signup or a quick job application) still counts as
        // "applicant" -- submit_candidate never demotes an existing higher stage.
        profile_stage:
          values.secondarySubDomains.filter((d) => d !== "None — single specialization only").length > 0 ||
          (currentTimelineEntry?.best_win?.trim().length ?? 0) > 0 ||
          (currentTimelineEntry?.tough_loss?.trim().length ?? 0) > 0 ||
          values.travelPreference
            ? "full_profile"
            : "applicant",
      };

      const { error } = await supabase.rpc("submit_candidate", { payload });
      if (error) throw new Error(error.message);

      if (isEditMode) {
        toast.success("Profile saved.");
        onSaved?.();
      } else {
        setSubmitted(true);
        toast.success("Your profile is on record. Thank you.");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted && !isEditMode) {
    return (
      <div className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_38%),radial-gradient(circle_at_80%_15%,rgba(14,165,233,0.14),transparent_32%),linear-gradient(to_bottom,#f8fbff_0%,#ffffff_45%,#f4f7fb_100%)]">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <main className="relative mx-auto flex w-full max-w-xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="w-full border-slate-200 shadow-[0_30px_90px_-40px_rgba(15,23,42,0.35)]">
            <CardContent className="space-y-4 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                ✓
              </div>
              <h2 className="text-xl font-bold text-slate-950">You&apos;re on record.</h2>
              <p className="text-sm leading-6 text-slate-600">
                Thanks, {values.fullName.split(" ")[0] || "there"}. A StaffAnchor recruiter will review your profile
                and reach out if there&apos;s a mandate fit. No spam, no cold calls for irrelevant roles.
              </p>
              <div
                className={`mx-auto flex max-w-xs items-center justify-center gap-2 rounded-2xl px-4 py-3 ${readinessMeta.chipBg}`}
              >
                <span className={`h-2 w-2 rounded-full ${readinessMeta.dot}`} />
                <p className={`text-sm font-semibold ${readinessMeta.chipText}`}>
                  Passport Readiness: {readinessTier} ({profileStrength}%)
                </p>
              </div>
              {readinessTier !== "Premium" && (
                <p className="text-xs text-slate-500">
                  Come back anytime from your Candidate Portal to add more detail and move up a tier — more complete
                  profiles get seen first.
                </p>
              )}
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
        <div className="mb-5 flex flex-wrap items-center justify-end gap-2 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100">
            {savedLabel ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">All changes {savedLabel.toLowerCase()}</span>
              </>
            ) : (
              <span>Not saved yet</span>
            )}
          </span>
          {!isEditMode && earlySaveCandidateId && (
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-slate-500 shadow-sm ring-1 ring-slate-100">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-blue-700">On record with our team</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-slate-500 shadow-sm ring-1 ring-slate-100">
            <Clock className="h-3.5 w-3.5" />
            Estimated time {minutesLeft}-{minutesLeft + 2} min
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr_320px] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-6">
            <Card className="rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]">
              <CardContent className="space-y-4 py-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Passport Readiness</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${readinessMeta.chipBg} ${readinessMeta.chipText}`}>
                    {readinessTier}
                  </span>
                </div>
                <div className="flex gap-1">
                  {(["Basic", "Good", "Excellent", "Premium"] as const).map((tier, i) => {
                    const tierOrder = ["Basic", "Good", "Excellent", "Premium"];
                    const reached = tierOrder.indexOf(readinessTier) >= i;
                    return (
                      <div
                        key={tier}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                          reached ? "bg-blue-600" : "bg-slate-200"
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500">
                  Step {step + 1} of {STEPS.length}
                </p>
                <ul className="space-y-0">
                  {STEPS.map((label, i) => {
                    // Smart Skip: step 3 ("Performance") has no content for a
                    // non-sales candidate -- goNext()/goBack() already jump
                    // over it, so the step list should say so rather than
                    // showing a step they'll never actually land on as
                    // "Pending" forever.
                    const isSkipped = i === 4 && !isSalesCategory;
                    return (
                      <li key={label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isSkipped
                                ? "bg-slate-100 text-slate-400"
                                : i < step
                                  ? "bg-emerald-500 text-white"
                                  : i === step
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {isSkipped ? "–" : i < step ? "✓" : i + 1}
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className={`w-px flex-1 ${i < step ? "bg-emerald-300" : "bg-slate-200"}`} style={{ minHeight: 24 }} />
                          )}
                        </div>
                        <div className="pb-4">
                          <p
                            className={`text-sm ${
                              isSkipped
                                ? "text-slate-300 line-through"
                                : i === step
                                  ? "font-semibold text-blue-600"
                                  : i < step
                                    ? "text-slate-700"
                                    : "text-slate-400"
                            }`}
                          >
                            {label}
                          </p>
                          <p className="text-xs text-slate-400">
                            {isSkipped ? "Not applicable" : i < step ? "Completed" : i === step ? "In Progress" : "Pending"}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]">
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

        <Card className="w-full rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]">
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start gap-3.5 pb-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/60 text-blue-600 ring-1 ring-blue-100">
                <StepIcon className="h-5.5 w-5.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                  {STEP_META[step].eyebrow}
                </p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{STEP_META[step].heading}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{STEP_META[step].subtext}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/70 px-3.5 py-3 text-sm text-blue-900 ring-1 ring-blue-100/80">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
              <span className="leading-relaxed">{STEP_TIPS[step]}</span>
            </div>
            <p className="text-xs italic leading-relaxed text-slate-400">&ldquo;{quote}&rdquo;</p>
          {step === 0 && (
            <>
              <FormField label="Full Name" required>
                <Input value={values.fullName} onChange={(e) => update("fullName", e.target.value)} />
              </FormField>
              <FormField label="Email" required>
                <Input
                  type="email"
                  value={values.email}
                  disabled={isEditMode}
                  onChange={(e) => update("email", e.target.value)}
                  className={isEditMode ? "bg-slate-50 text-slate-500" : undefined}
                />
                {isEditMode && (
                  <p className="text-xs text-slate-400">
                    This is your sign-in email and can&apos;t be changed here.
                  </p>
                )}
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
                    resumeFile || hasExistingResume
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <span className="text-2xl">{resumeFile || hasExistingResume ? "✓" : "📄"}</span>
                  {resumeFile ? (
                    <span className="text-sm font-medium text-emerald-700">{resumeFile.name}</span>
                  ) : hasExistingResume ? (
                    <>
                      <span className="text-sm font-medium text-emerald-700">Resume on file</span>
                      <span className="text-xs text-slate-400">Click to replace it</span>
                    </>
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
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setResumeFile(file);
                      if (file && /\.(pdf|docx)$/i.test(file.name)) {
                        parseResumeLive(file);
                      } else {
                        setResumeParseStatus("idle");
                        setResumeExtraction(null);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </FormField>

              {resumeParseStatus === "parsing" && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3.5 transition-all duration-300">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-600" />
                    Scanning your resume
                  </p>
                  <ul className="space-y-1.5">
                    {TRIAGE_STEPS.map((label, i) => (
                      <li key={label} className="flex items-center gap-2 text-xs">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] transition-colors duration-300 ${
                            i < triageStepIndex
                              ? "bg-emerald-500 text-white"
                              : i === triageStepIndex
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {i < triageStepIndex ? "✓" : ""}
                        </span>
                        <span className={i <= triageStepIndex ? "text-slate-700" : "text-slate-400"}>{label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {resumeParseStatus === "done" && resumeExtraction && !extractionHandled && (
                <div className="space-y-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3.5 transition-all duration-300">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Here&apos;s what we found in your resume
                  </p>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {resumeExtraction.full_name && <li>• Name: {resumeExtraction.full_name}</li>}
                    {resumeExtraction.current_employer && (
                      <li>
                        • Current role: {resumeExtraction.current_job_title || "—"} at {resumeExtraction.current_employer}
                      </li>
                    )}
                    {resumeExtraction.total_experience_years != null && (
                      <li>• Experience: ~{resumeExtraction.total_experience_years} years</li>
                    )}
                    {resumeExtraction.highest_qualification && <li>• Qualification: {resumeExtraction.highest_qualification}</li>}
                    {resumeExtraction.current_industry && <li>• Industry: {resumeExtraction.current_industry}</li>}
                    {resumeExtraction.skills.length > 0 && <li>• Skills: {resumeExtraction.skills.join(", ")}</li>}
                  </ul>
                  <p className="text-[11px] text-emerald-700/80">
                    Look right? We&apos;ll pre-fill the next steps so you don&apos;t have to retype it.
                  </p>
                  <div className="flex gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={applyResumeExtraction}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-all duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:bg-emerald-700 active:scale-[0.98]"
                    >
                      Looks right, use this
                    </button>
                    <button
                      type="button"
                      onClick={() => setExtractionHandled(true)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-slate-400 active:scale-[0.98]"
                    >
                      I&apos;ll fill it myself
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <CareerTimelinePanel
              entries={values.careerTimeline}
              onChange={(next) => update("careerTimeline", next)}
              currentEmployer={values.currentEmployer || null}
              resumeEntries={(existingProfile?.career_timeline_resume ?? []) as ResumeTimelineEntry[]}
            />
          )}

          {step === 2 && (
            <>
              {(values.currentEmployer || values.currentJobTitle) && (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  Current role: <span className="font-medium text-slate-700">{values.currentJobTitle || "—"}</span> at{" "}
                  <span className="font-medium text-slate-700">{values.currentEmployer || "—"}</span> — from your Career
                  Timeline entry. Edit it on the Career Timeline step if this needs updating.
                </p>
              )}
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
              <FormField label="Function / Domain" required>
                <Select
                  value={values.category}
                  onChange={(e) => {
                    const next = e.target.value as CategoryValue | "";
                    update("category", next);
                    update("subDomain", "");
                    update("customSubDomain", "");
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
                      <option value="Other">Other</option>
                    </Select>
                    {values.subDomain === "Other" && (
                      <Input
                        className="mt-2"
                        value={values.customSubDomain}
                        onChange={(e) => update("customSubDomain", e.target.value)}
                        placeholder="Please specify"
                      />
                    )}
                  </FormField>

                  <FormField label="Secondary Specializations" required>
                    {values.secondarySubDomains.length === 0 && (
                      <p className="mb-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-medium text-blue-700">
                        Even one extra specialization can open up more mandates you'd be a fit for — pick "None" if you're a
                        true specialist.
                      </p>
                    )}
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

                  <p className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-medium text-blue-700">
                    Deal size, sales cycle, selling style, sales motion, and other role-specific details are captured on
                    your current role's Career Timeline entry — you'll find them there, not repeated here.
                  </p>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <FormField label="Key Skills / Tools" required>
                <div className="space-y-2">
                  {values.selectedSkills.length === 0 && (
                    <p className="rounded-lg border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-medium text-blue-700">
                      Profiles with 5+ specific skills get shortlisted noticeably more often — tap a few below to get started.
                    </p>
                  )}
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
              <FormField label="Current Industry" required>
                <Select
                  value={values.currentIndustry}
                  onChange={(e) => update("currentIndustry", e.target.value)}
                >
                  <option value="">Select...</option>
                  {industryOptions.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </Select>
              </FormField>
              {values.currentIndustry === "Other" && (
                <FormField label="Please specify your current industry" required>
                  <Input
                    value={values.customCurrentIndustry}
                    onChange={(e) => update("customCurrentIndustry", e.target.value)}
                  />
                </FormField>
              )}
              <FormField label="Previous Industries Worked In (multi-select, for searchability)" required>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={values.noOtherIndustries}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setValues((prev) => ({
                          ...prev,
                          noOtherIndustries: checked,
                          selectedIndustries: checked ? [] : prev.selectedIndustries,
                        }));
                      }}
                    />
                    No other industries — I&apos;ve only worked in my current industry
                  </label>
                  {!values.noOtherIndustries && (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {industryOptions
                          .filter((industry) => industry !== values.currentIndustry)
                          .map((industry) => {
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
                    </>
                  )}
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

          <div className="flex items-center justify-between border-t border-slate-100 pt-5">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={step === 0 || submitting}
              className="rounded-xl"
            >
              ← Previous
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={goNext}
                className="rounded-xl bg-blue-600 px-6 shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25"
              >
                Continue →
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-6 shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25"
              >
                {submitting ? "Submitting..." : "Submit My Profile"}
              </Button>
            )}
          </div>
        </CardContent>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <Card className="rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]">
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

          <Card className="rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]">
            <CardContent className="space-y-4 py-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Passport Readiness</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${readinessMeta.chipBg} ${readinessMeta.chipText}`}>
                  {readinessTier}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-all duration-500"
                  style={{
                    background: `conic-gradient(${readinessMeta.ring} ${profileStrength * 3.6}deg, #e2e8f0 0deg)`,
                  }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
                    {profileStrength}%
                  </div>
                </div>
                <p className="text-xs leading-5 text-slate-500">{readinessMeta.blurb}</p>
              </div>
              <ul className="space-y-2 border-t border-slate-100 pt-3">
                {STEPS.map((label, i) => {
                  const isSkipped = i === 4 && !isSalesCategory;
                  return (
                    <li key={label} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            isSkipped ? "bg-slate-200" : i < step ? "bg-emerald-500" : i === step ? "bg-blue-600" : "bg-slate-300"
                          }`}
                        />
                        <span
                          className={
                            isSkipped
                              ? "text-slate-300 line-through"
                              : i === step
                                ? "font-medium text-slate-900"
                                : i < step
                                  ? "text-slate-600"
                                  : "text-slate-400"
                          }
                        >
                          {label}
                        </span>
                      </span>
                      <span className="font-medium text-slate-400">{isSkipped ? "n/a" : `+${STEP_WEIGHTS[i]}%`}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]">
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
