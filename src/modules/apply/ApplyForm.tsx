"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { FormField, CollapsibleFormField } from "@/components/forms/form-field";
import {
  achievementBandOptions,
  b2bSalesMotionTypeGroups,
  b2bSubDomains,
  b2cSalesMotionOptions,
  b2cSubDomains,
  categoryOptions,
  cityOptions,
  cityStateMap,
  clientProfileOptions,
  crmToolOptions,
  ctcOptions,
  currencyOptions,
  customerSegmentOptions,
  dealSizeBandsFor,
  defaultNoticePeriods,
  employmentStatusOptions,
  experienceOptions,
  funnelStageOptions,
  geographicScopeOptions,
  highestQualificationOptions,
  industryOptions,
  motionTypeOptions,
  nonSalesSubDomains,
  promotionHistoryOptions,
  relocationOptions,
  revenuePeriodOptions,
  revenueTargetBandOptionsFor,
  roleLevelOptions,
  roleTypeOptions,
  salesCycleOptions,
  internationalRegionOptions,
  salesMotionOptions,
  searchSkills,
  sellingStyleOptions,
  skillSuggestionsFor,
  subDomainsForCategory,
  level1OptionsForProfileType,
  subDomainsForPractice,
  secondarySpecializationGroups,
  primaryAsSecondaryLabel,
  languageOptions,
  teamSizeOptions,
  tenderRfpExperienceOptions,
  travelPreferenceOptions,
  workModeOptions,
  type CategoryValue,
  type CurrencyValue,
  type RevenuePeriodValue,
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
  // Level-2 refinement, only asked when subDomain === "Other B2B" -- purely
  // for internal taxonomy-building (see options.ts otherB2BSubDomains comment).
  otherB2BSubDomain: string;
  customOtherB2BSubDomain: string;
  secondarySubDomains: string[];
  // Same Level-2 refinement, but for whichever secondary specialization entry
  // is itself "Other B2B" -- one free-text slot is enough since a candidate
  // realistically has at most one "Other B2B" tag whether primary or secondary.
  secondaryOtherB2BSubDomain: string;
  customSecondaryOtherB2BSubDomain: string;
  // Free-text specify for the disambiguated generic "Other" tail entries in
  // the combined cross-Profile-Type secondary specialization list (see
  // options.ts secondarySpecializationGroups) -- a candidate could plausibly
  // pick both if their background genuinely spans B2C and Non-Sales, so these
  // are two independent slots, not one shared with the B2B "Other B2B" field.
  secondaryOtherB2CSpecify: string;
  secondaryOtherNonSalesSpecify: string;
  roleLevel: string;
  roleType: string;
  customRoleType: string;
  teamSize: string;
  // "Are you a fresher?" toggle -- gates whether Career Timeline entries and
  // role-level/role-type/team-size/secondary-specialization fields are asked
  // at all, since none of those describe someone with no work history yet.
  isFresher: "Yes" | "No" | "";
  // Freshers get a lightweight internship question instead of Career Timeline
  // / Sales Motion / Revenue Snapshot, which all describe an actual job.
  hasInternship: "Yes" | "No" | "";
  internshipCompany: string;
  internshipRole: string;
  internshipDuration: string;
  internshipDescription: string;
  // Stage 1B -- Languages Known (mandatory multi-select, every candidate).
  languagesKnown: string[];
  customLanguage: string;
  // Stage 1B item 19 -- "Open to relocation (Yes/No -> preferred cities if Yes)".
  relocationPreferredCities: string[];
  customRelocationCity: string;

  // ---- Stage 2: Profile-Type-Specific block ----
  // B2B: Sales Motion is the PRIMARY branch (asked before AE/SDR sub-fields).
  b2bSalesMotionType: string[];
  aeSellingStyle: string; // Hunter / Farmer / Hybrid
  aeDealSizeBand: string;
  aeDealSizeCurrency: CurrencyValue | "";
  aeSalesCycle: string;
  aeBuyerPersona: string;
  sdrAht: string;
  sdrDailyCallTarget: string;
  sdrDailyTalkTime: string;
  sdrLeadSource: string;
  // B2C
  b2cSalesMotion: string[];
  b2cTicketBand: string;
  b2cTicketCurrency: CurrencyValue | "";

  // ---- Stage 3: Revenue Snapshot (profile-level; supersedes the old
  // per-role quarterly grid that used to live on the Career Timeline's
  // current-role card -- see CareerTimelinePanel.tsx) ----
  revenuePeriod: RevenuePeriodValue | "";
  revenueTarget: string;
  revenueTargetCurrency: CurrencyValue | "";
  revenueAchievement: string;
  hasIndividualQuota: "Yes" | "No" | "";
  individualTarget: string;
  individualTargetCurrency: CurrencyValue | "";
  individualAchievement: string;

  // ---- Stage 4 (optional, post-submit): Career History extras + Profile &
  // Documents + B2B extra depth + Industrial extra depth ----
  promotionHistory: "Yes" | "No" | "";
  promotionDescription: string;
  crmTools: string[];
  customCrmTool: string;
  motionType: string;
  customerSegmentSold: string[];
  productLinesBrands: string;
  technicalCertifications: string;
  tenderRfpExperience: "Yes" | "No" | "";
  tenderRfpDescription: string;
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
  otherB2BSubDomain: "",
  customOtherB2BSubDomain: "",
  secondarySubDomains: [],
  secondaryOtherB2BSubDomain: "",
  customSecondaryOtherB2BSubDomain: "",
  secondaryOtherB2CSpecify: "",
  secondaryOtherNonSalesSpecify: "",
  roleLevel: "",
  roleType: "",
  customRoleType: "",
  teamSize: "",
  isFresher: "",
  hasInternship: "",
  internshipCompany: "",
  internshipRole: "",
  internshipDuration: "",
  internshipDescription: "",
  languagesKnown: [],
  customLanguage: "",
  relocationPreferredCities: [],
  customRelocationCity: "",
  b2bSalesMotionType: [],
  aeSellingStyle: "",
  aeDealSizeBand: "",
  aeDealSizeCurrency: "",
  aeSalesCycle: "",
  aeBuyerPersona: "",
  sdrAht: "",
  sdrDailyCallTarget: "",
  sdrDailyTalkTime: "",
  sdrLeadSource: "",
  b2cSalesMotion: [],
  b2cTicketBand: "",
  b2cTicketCurrency: "",
  revenuePeriod: "",
  revenueTarget: "",
  revenueTargetCurrency: "",
  revenueAchievement: "",
  hasIndividualQuota: "",
  individualTarget: "",
  individualTargetCurrency: "",
  individualAchievement: "",
  promotionHistory: "",
  promotionDescription: "",
  crmTools: [],
  customCrmTool: "",
  motionType: "",
  customerSegmentSold: [],
  productLinesBrands: "",
  technicalCertifications: "",
  tenderRfpExperience: "",
  tenderRfpDescription: "",
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
//
// Unified Candidate Intake restructure (frozen spec): the wizard is now
// staged as 1A (Critical Core) / 1B (Extended Core) / 2 (Profile-Type-
// Specific) / 3 (Revenue Snapshot) -> Submit -> Stage 4 (optional, post-
// submit, same screen). `source` (quick_apply / recruiter_created /
// build_profile) never changes which fields render -- only submit-button
// copy and success copy, per spec section 0. Stage 2 and Stage 3 are
// entirely skipped for `category === "non_sales"` (spec section 6):
// Non-Sales candidates go Stage 1 (1A+1B) straight to Submit.
// `ALL_STAGES` is indexed 0=1A, 1=1B, 2=Stage 2, 3=Stage 3. `step` (React
// state) holds a position WITHIN the visible sequence for the candidate's
// category, not a raw index into ALL_STAGES -- see `stepSequence` below.
const ALL_STAGES = ["1A", "1B", "2", "3"] as const;

const STAGE_TIME_MINUTES = [1, 1.5, 1.5, 1];

const STAGE_WEIGHTS = [15, 35, 30, 20];

const STAGE_META = [
  {
    icon: User,
    eyebrow: "Stage 1A — Critical Core",
    heading: "Let's start with the basics",
    subtext: "Your contact details, resume, and what you do — how a recruiter actually reaches and places you.",
  },
  {
    icon: Target,
    eyebrow: "Stage 1B — Extended Core",
    heading: "Tell us where you stand today",
    subtext: "Employment, compensation, qualifications, and preferences — the context every mandate is filtered by.",
  },
  {
    icon: Briefcase,
    eyebrow: "Stage 2 — Specialization",
    heading: "How you actually sell",
    subtext: "The specifics of your motion, deal size, and buyers — this is what makes a mandate match precise.",
  },
  {
    icon: Settings2,
    eyebrow: "Stage 3 — Revenue Snapshot",
    heading: "Your current-role numbers",
    subtext: "Target vs. achievement on your current role — the single most-checked detail on a sales profile.",
  },
] as const;

const STAGE_TIPS: Record<number, string> = {
  0: "Recruiters reach out fastest when your contact details, resume, and specialty are on record.",
  1: "Comp and qualification context lets a recruiter tell whether a mandate is even a fit -- before wasting your time on a call.",
  2: "Specific motion, deal size, and buyer details are how recruiters match you to the right kind of mandate, not just the right domain.",
  3: "Real target vs. achievement is the single biggest thing that turns a resume into a story a recruiter can actually pitch to a client.",
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
    secondaryOtherB2BSubDomain: seg(sd, "secondary_other_b2b_subdomain"),
    secondaryOtherB2CSpecify: seg(sd, "secondary_other_b2c_specify"),
    secondaryOtherNonSalesSpecify: seg(sd, "secondary_other_non_sales_specify"),
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

// ---------------------------------------------------------------------------
// My Profile read-first display -- Round 5 redesign.
//
// Naukri/iimjobs-style profile pages show data as label/value cards with a
// pencil that opens editing for just that section; the previous My Profile
// build kept every field as an always-open input the whole time, which read
// as "the same form" rather than a profile. These pieces implement the new
// pattern: a plain label/value row, a section shell that swaps between a
// read summary and the (unchanged) input fields plus a Save/Cancel pair, and
// one summary component per stage built straight from FormState so it can
// never drift out of sync with what the fields actually collect.
// ---------------------------------------------------------------------------

function ProfileRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-1.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-sm text-slate-800">
        {value && value.trim() ? value : <span className="text-slate-300">Not provided</span>}
      </p>
    </div>
  );
}

// Read-only card shell for a closed section -- title + completion check +
// Edit pencil, wrapping whatever summary content the caller passes in.
function ProfileSummaryCard({
  id,
  title,
  complete,
  onEdit,
  children,
}: {
  id: string;
  title: string;
  complete: boolean;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100">
      <div className="flex items-center justify-between bg-slate-50/70 px-5 py-3">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
          {complete && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// Cancel/Save row shown under an open section's fields in My Profile edit
// mode -- "one section at a time and save," per the approved design: closes
// the section back to its read card either way.
function SectionSaveBar({ onCancel, onSave, saving }: { onCancel: () => void; onSave: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
      <Button type="button" variant="outline" onClick={onCancel} className="rounded-xl">
        Cancel
      </Button>
      <Button type="button" onClick={onSave} disabled={saving} className="rounded-xl bg-blue-600 hover:bg-blue-700">
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

function Stage1ASummary({ v }: { v: FormState }) {
  const categoryLabel = categoryOptions.find((c) => c.value === v.category)?.label ?? "";
  const specialization =
    v.subDomain === "Other"
      ? v.customSubDomain
      : v.subDomain === "Other B2B"
        ? v.otherB2BSubDomain === "Other"
          ? v.customOtherB2BSubDomain
          : v.otherB2BSubDomain
        : v.subDomain;
  const city = v.cityChoice === "Other" ? [v.customCity, v.customState].filter(Boolean).join(", ") : v.cityChoice;
  return (
    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
      <ProfileRow label="Full Name" value={v.fullName} />
      <ProfileRow label="Email" value={v.email} />
      <ProfileRow label="Phone" value={v.phone} />
      <ProfileRow label="Current City" value={city} />
      <ProfileRow label="Current Profile Type" value={categoryLabel} />
      <ProfileRow label="Primary Specialization" value={specialization} />
    </div>
  );
}

function Stage1BSummary({ v }: { v: FormState }) {
  const relocation =
    v.openToRelocation === "Yes" && (v.relocationPreferredCities.length || v.customRelocationCity.trim())
      ? `Yes — ${[...v.relocationPreferredCities, v.customRelocationCity].filter(Boolean).join(", ")}`
      : v.openToRelocation;
  const roleType =
    v.roleType === "Leading a Team" && v.teamSize
      ? `Leading a Team (${v.teamSize})`
      : v.roleType === "Other"
        ? v.customRoleType
        : v.roleType;
  return (
    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
      {v.isFresher === "Yes" ? (
        <>
          <ProfileRow label="Employment Status" value="First Job Seeker" />
          <ProfileRow label="Internship" value={v.hasInternship === "Yes" ? `${v.internshipCompany} — ${v.internshipRole}` : v.hasInternship} />
        </>
      ) : (
        <>
          <ProfileRow label="Current Employer" value={v.currentEmployer} />
          <ProfileRow label="Current Job Title" value={v.currentJobTitle} />
          <ProfileRow label="Employment Status" value={v.currentEmploymentStatus} />
          <ProfileRow label="Current Fixed CTC" value={v.currentFixedCtc ? `₹${v.currentFixedCtc}L` : ""} />
        </>
      )}
      <ProfileRow label="Total Experience" value={v.totalExperienceYears ? `${v.totalExperienceYears} yrs` : ""} />
      <ProfileRow label="Expected Fixed CTC" value={v.expectedFixedCtc ? `₹${v.expectedFixedCtc}L` : ""} />
      <ProfileRow label="Days to Join" value={v.noticePeriod} />
      <ProfileRow label="Highest Qualification" value={v.highestQualification === "Other" ? v.customQualification : v.highestQualification} />
      <ProfileRow label="Work Mode" value={v.workMode} />
      <ProfileRow label="Open to Relocation" value={relocation} />
      <ProfileRow label="Travel Preference" value={v.travelPreference} />
      <ProfileRow label="Languages Known" value={[...v.languagesKnown.filter((l) => l !== "Other"), v.customLanguage].filter(Boolean).join(", ")} />
      {v.isFresher !== "Yes" && (
        <>
          <ProfileRow label="Role Level" value={v.roleLevel} />
          <ProfileRow label="Role Type" value={roleType} />
          <ProfileRow
            label="Secondary Specializations"
            value={v.secondarySubDomains.length ? v.secondarySubDomains.join(", ") : ""}
          />
        </>
      )}
      <ProfileRow label="Current Industry" value={v.currentIndustry === "Other" ? v.customCurrentIndustry : v.currentIndustry} />
      <ProfileRow
        label="Previous Industries"
        value={v.noOtherIndustries ? "None" : v.selectedIndustries.join(", ")}
      />
    </div>
  );
}

function Stage2Summary({ v, isB2B, isB2C }: { v: FormState; isB2B: boolean; isB2C: boolean }) {
  if (v.isFresher === "Yes") {
    return <p className="text-sm text-slate-400">Not applicable — no work history yet.</p>;
  }
  if (isB2B) {
    return (
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <ProfileRow label="Sales Motion" value={v.b2bSalesMotionType.join(", ")} />
        {v.b2bSalesMotionType.length > 0 && (
          <>
            <ProfileRow label="Selling Style" value={v.aeSellingStyle} />
            <ProfileRow label="Avg. Deal Size" value={v.aeDealSizeBand ? `${v.aeDealSizeCurrency} ${v.aeDealSizeBand}` : ""} />
            <ProfileRow label="Sales Cycle" value={v.aeSalesCycle} />
            <ProfileRow label="Buyer Persona" value={v.aeBuyerPersona} />
          </>
        )}
      </div>
    );
  }
  if (isB2C) {
    return (
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <ProfileRow label="Sales Motion" value={v.b2cSalesMotion.join(", ")} />
        <ProfileRow label="Avg. Ticket Size" value={v.b2cTicketBand ? `${v.b2cTicketCurrency} ${v.b2cTicketBand}` : ""} />
      </div>
    );
  }
  return <p className="text-sm text-slate-400">Not applicable for this profile type.</p>;
}

function Stage3Summary({ v, isSales }: { v: FormState; isSales: boolean }) {
  if (!isSales) return <p className="text-sm text-slate-400">Not applicable for this profile type.</p>;
  if (v.isFresher === "Yes") {
    return <p className="text-sm text-slate-400">Not applicable — no work history yet.</p>;
  }
  return (
    <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
      <ProfileRow label="Reporting Period" value={v.revenuePeriod} />
      <ProfileRow
        label={v.roleType === "Leading a Team" ? "Team Target" : "Target"}
        value={v.revenueTarget ? `${v.revenueTargetCurrency} ${v.revenueTarget}` : ""}
      />
      <ProfileRow label="Achievement %" value={v.revenueAchievement} />
      {v.roleType === "Leading a Team" && v.hasIndividualQuota === "Yes" && (
        <>
          <ProfileRow label="Individual Target" value={v.individualTarget ? `${v.individualTargetCurrency} ${v.individualTarget}` : ""} />
          <ProfileRow label="Individual Achievement %" value={v.individualAchievement} />
        </>
      )}
    </div>
  );
}

// Entry point this component was opened from -- recorded as a `source` tag
// for attribution/analytics only. Per the frozen spec (section 0), the form
// varies ONLY by Profile Type / Practice / Vertical, never by entry point --
// `source` purely drives submit-button copy and success-screen copy below.
// Wiring the other two callers (Quick Apply, Recruiter Created) is explicitly
// someone else's follow-up work; this component just needs to accept and
// correctly react to the prop today.
export type ApplyFormSource = "quick_apply" | "recruiter_created" | "build_profile";

export default function ApplyForm({
  existingProfile,
  onSaved,
  source = "build_profile",
  mandateTitle,
  mandateId,
}: {
  existingProfile?: ExistingProfile;
  onSaved?: () => void;
  source?: ApplyFormSource;
  mandateTitle?: string;
  mandateId?: string;
} = {}) {
  const router = useRouter();
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
  // Quick Apply "already registered?" check -- see the real-time email lookup
  // effect below. Deliberately Quick-Apply-only: Build Your Profile and
  // Recruiter Created have no reason to short-circuit, they're already the
  // "fill everything" / "edit everything" paths respectively.
  const [existingCheck, setExistingCheck] = useState<{
    exists: boolean;
    firstName: string | null;
    alreadyApplied: boolean;
  } | null>(null);
  const [existingCheckDismissed, setExistingCheckDismissed] = useState(false);
  const [fastApplying, setFastApplying] = useState(false);
  const [fastApplied, setFastApplied] = useState(false);
  const [quotes, setQuotes] = useState<string[]>(FALLBACK_QUOTES);
  const [noticePeriods, setNoticePeriods] = useState<string[]>(defaultNoticePeriods);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savedLabel, setSavedLabel] = useState<string>("");
  const [stepJustCompleted, setStepJustCompleted] = useState(false);
  const [earlySaveCandidateId, setEarlySaveCandidateId] = useState<string | null>(null);
  // Tracks the last File object actually uploaded to storage + the resulting
  // path, so Stage 4's post-submit autosave (which re-runs the same
  // handleSubmit) never re-uploads the identical resume on every tick.
  const uploadedResumeRef = useRef<{ file: File | null; path: string | null }>({ file: null, path: null });

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
        // Freshers never have a currentEmployer/currentJobTitle (there is no
        // current role yet) -- gate on totalExperienceYears alone for them so
        // they aren't permanently stuck at "lead" stage.
        const hasStage2Core =
          values.isFresher === "Yes"
            ? !!values.totalExperienceYears
            : !!(values.currentEmployer && values.currentJobTitle && values.totalExperienceYears);
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
    values.isFresher,
    values.totalExperienceYears,
    values.noticePeriod,
    values.highestQualification,
    values.currentIndustry,
    values.selectedSkills,
  ]);

  // Quick Apply real-time "you're already registered" check -- fires once the
  // email looks valid, Quick-Apply-only. Lets a returning candidate apply with
  // their existing profile instead of re-filling Stage 1B/2/3 from scratch
  // (feedback: "why do I have to redo everything"). Deliberately debounced and
  // best-effort -- a failed lookup just means the candidate falls through to
  // the normal full form, never blocks it.
  useEffect(() => {
    if (source !== "quick_apply" || isEditMode) return;
    if (fastApplied || existingCheckDismissed) return;
    if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      setExistingCheck(null);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const res = await fetch("/api/candidate-lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email.trim(), mandateId }),
        });
        const json = await res.json().catch(() => ({ exists: false }));
        setExistingCheck(
          json.exists ? { exists: true, firstName: json.firstName ?? null, alreadyApplied: !!json.alreadyApplied } : null
        );
      } catch {
        // best-effort only
      }
    }, 700);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.email, source, isEditMode, mandateId, fastApplied, existingCheckDismissed]);

  // "Use my existing profile" fast path -- calls the exact same
  // candidate-submit -> quick_apply RPC route the full form uses, but with a
  // minimal { email } payload. quick_apply's own SQL coalesces every field
  // against the existing row (see options.ts / hand-off notes), so this can
  // never blank out anything already on file -- it only inserts the new
  // candidate_mandate_links row for this job.
  async function handleFastApply() {
    setFastApplying(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/candidate-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: { email: values.email.trim() }, mandateId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Something went wrong. Please try again.");
      setFastApplied(true);
      toast.success("You're all set -- your existing profile has been submitted for this role.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setFastApplying(false);
    }
  }

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
  // Profile-level specialization now uses the Unified Candidate Intake
  // taxonomy (Practice under B2B / Vertical under B2C / Function under
  // Non-Sales) instead of the old flat sub-domain list -- `subDomainsForCategory`
  // is kept only for the mandate-creation form and for reverse-mapping an
  // existing candidate's pre-migration sub_domain value in edit mode above.
  const subDomainOptions = level1OptionsForProfileType(values.category || null);

  // Non-Sales candidates skip Stage 2 (Profile-Type-Specific) and Stage 3
  // (Revenue Snapshot) entirely (spec section 6) -- `stepSequence` is the
  // list of ALL_STAGES indices actually visible to this candidate; `step`
  // (React state) is a position WITHIN this sequence, not a raw ALL_STAGES
  // index, so the wizard is genuinely shorter (not just visually skipped)
  // for Non-Sales. `stageIndex` below is the raw ALL_STAGES index for
  // whatever `step` currently points at.
  const isSalesCategory = values.category === "b2b_sales" || values.category === "b2c_sales";
  const isB2B = values.category === "b2b_sales";
  const isB2C = values.category === "b2c_sales";
  const isIndustrialPractice = isB2B && values.subDomain === "Industrial & Infrastructure";
  const stepSequence = isSalesCategory ? [0, 1, 2, 3] : [0, 1];
  const stageIndexFromStep = stepSequence[Math.min(step, stepSequence.length - 1)];
  // Kept as `stageIndex` everywhere else in this component (JSX conditionals,
  // isStageComplete, etc.) -- only validateStep() needs to distinguish "the
  // wizard's current step" from "the stage a caller explicitly asks about".
  const stageIndex = stageIndexFromStep;
  const isLastStage = step >= stepSequence.length - 1;

  const suggestedSkills = useMemo(() => skillSuggestionsFor(values.subDomain || null), [values.subDomain]);
  const skillSearchResults = useMemo(
    () => searchSkills(values.customSkill, values.selectedSkills),
    [values.customSkill, values.selectedSkills]
  );

  // Weighted 65% Stage 1-3 core / 35% Stage 4 optional depth (feedback: the
  // profile shouldn't be able to read 90%+ "Excellent" while Stage 4 -- the
  // whole "boost your shortlisting odds" section -- is completely untouched;
  // that only happened before because Stage 4 barely moved the number at
  // all). Each half is its own applicable/filled fraction so a candidate for
  // whom a given Stage 4 cluster genuinely doesn't apply (e.g. "B2B Extra
  // Depth" for a B2C candidate) is never penalized for leaving it blank.
  const profileStrength = useMemo(() => {
    // ---- Core: Stage 1A/1B/2/3 -------------------------------------------
    const applicableFields: (keyof FormState)[] = [...STRENGTH_FIELDS_BASE];
    const filledCore = applicableFields.filter((k) => {
      const v = values[k];
      return Array.isArray(v) ? v.length > 0 : String(v).trim() !== "";
    }).length;
    const coreFraction = applicableFields.length ? filledCore / applicableFields.length : 0;

    // ---- Stage 4: optional post-submit depth -----------------------------
    let stage4Applicable = 0;
    let stage4Filled = 0;

    // Career Timeline -- several sub-questions in one, so weighted like 3
    // plain fields rather than 1 (unchanged from the pre-existing scoring).
    const timelineWeight = 3;
    let timelineScore = 0;
    const timelineEntries = values.careerTimeline ?? [];
    const resumeEntries = (existingProfile?.career_timeline_resume ?? []) as ResumeTimelineEntry[];
    if (values.isFresher === "Yes") {
      // Nothing to fill here for a fresher -- don't let an inapplicable
      // section drag the score down.
      timelineScore = timelineWeight;
    } else {
      if (timelineEntries.length > 0) timelineScore += 1;
      const currentEntry = timelineEntries.find((e) => e.end_month === null);
      const isCurrentSales = currentEntry?.category === "b2b_sales" || currentEntry?.category === "b2c_sales";
      if (currentEntry && (!isCurrentSales || currentEntry.deal_size_band)) timelineScore += 1;
      if (!isCurrentSales || (currentEntry && currentEntry.achieved_q4 && (currentEntry.best_win ?? "").length >= 100)) {
        timelineScore += 1;
      }
    }
    stage4Applicable += timelineWeight;
    stage4Filled += timelineScore;

    // Promotion history -- only a meaningful question once there's an actual
    // career to have been promoted within.
    if (values.isFresher !== "Yes") {
      stage4Applicable += 1;
      if (values.promotionHistory) stage4Filled += 1;
    }

    // B2B Extra Depth cluster (CRM tools / PLG-vs-Sales-Led / customer segment).
    if (isB2B) {
      stage4Applicable += 3;
      if (values.crmTools.length > 0 || values.customCrmTool.trim()) stage4Filled += 1;
      if (values.motionType) stage4Filled += 1;
      if (values.customerSegmentSold.length > 0) stage4Filled += 1;
    }

    // Industrial & Infrastructure Extra Depth cluster.
    if (isIndustrialPractice) {
      stage4Applicable += 1;
      if (values.productLinesBrands.trim() || values.technicalCertifications.trim() || values.tenderRfpExperience) {
        stage4Filled += 1;
      }
    }

    const gaps = computeCareerGaps({
      profileEntries: timelineEntries,
      resumeEntries,
      currentEmployer: values.currentEmployer || null,
    });
    void gaps; // computed for future use (unresolved-resume-flag surfacing); not yet folded into the score

    const stage4Fraction = stage4Applicable ? stage4Filled / stage4Applicable : 1;
    const CORE_WEIGHT = 0.65;
    const STAGE4_WEIGHT = 0.35;
    return Math.round((coreFraction * CORE_WEIGHT + stage4Fraction * STAGE4_WEIGHT) * 100);
  }, [values, existingProfile, isB2B, isIndustrialPractice]);

  const minutesLeft = useMemo(
    () => stepSequence.slice(step).reduce((a, i) => a + STAGE_TIME_MINUTES[i], 0),
    [step, stepSequence]
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

  // Nudge candidates who try to leave mid-way -- an incomplete profile means
  // fewer/worse recruiter matches later, and it's cheap to remind them
  // they're close (progressive save already means nothing is lost, but the
  // fields still need to actually get filled in for matching to work well).
  // Pre-submit (Stage 1-3 not yet committed) this gates the existing "you may
  // not get matched" warning; post-submit (now in Stage 4, which is purely
  // optional) the same flag instead gates a softer nudge -- the record is
  // already committed either way, so leaving is never actually risky post-
  // submit, just leaves some optional upside on the table. See the modal copy
  // below, which branches on `submitted`.
  const isIncomplete = profileStrength < 100;
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);

  // Real tab-close / refresh / address-bar navigation: browsers force their
  // own generic confirmation text here for security reasons (no custom copy
  // is allowed to appear), so this only controls *whether* that native
  // prompt fires, gated on completeness.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (!isIncomplete) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isIncomplete]);

  // Same-origin link clicks (navbar, "browse roles", footer, etc.) never
  // trigger beforeunload since the page doesn't actually unload in a Next.js
  // client-side navigation -- so those need their own interception with our
  // actual custom message, via a capture-phase click listener on the whole
  // page.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!isIncomplete) return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank") return;
      if (/^https?:\/\//.test(href) && !href.startsWith(window.location.origin)) return;
      if (href === window.location.pathname) return;
      e.preventDefault();
      e.stopPropagation();
      pendingHrefRef.current = href;
      setShowLeaveWarning(true);
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isIncomplete]);

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
    key:
      | "secondarySubDomains"
      | "selectedSkills"
      | "selectedIndustries"
      | "relocationPreferredCities"
      | "crmTools"
      | "customerSegmentSold"
      | "languagesKnown"
      | "b2bSalesMotionType"
      | "b2cSalesMotion",
    value: string
  ) {
    setValues((prev) => {
      const current = prev[key];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function validateStep(stageOverride?: number): string | null {
    // In the step-by-step wizard this always validates the current step
    // (the closure `stageIndex`). My Profile edit mode's per-section Save
    // passes the specific stage index of whichever section is actually open
    // (see saveSection() below), since `stageIndex` itself never advances in
    // edit mode -- without this override, a section-level Save had no way to
    // check the right stage's required fields at all.
    const stageIndex = stageOverride ?? stageIndexFromStep;
    const isSales = isSalesCategory;

    // Stage 1A -- Critical Core
    if (stageIndex === 0) {
      if (!values.fullName.trim()) return "Full name is required.";
      if (!/^\S+@\S+\.\S+$/.test(values.email)) return "A valid email is required.";
      if (values.phone.length !== 10) return "Please enter a valid 10-digit phone number.";
      if (!values.cityChoice) return "Please select your current city.";
      if (values.cityChoice === "Other" && (!values.customCity.trim() || !values.customState.trim())) {
        return "Please enter both city and state.";
      }
      if (!resumeFile && !hasExistingResume) return "Please upload your resume.";
      if (!values.category) return "Please select your Current Profile Type.";
      if (!values.subDomain) return "Please select your Practice / Vertical / Function.";
      if (values.subDomain === "Other" && !values.customSubDomain.trim()) {
        return "Please specify your Practice / Vertical / Function.";
      }
      if (values.subDomain === "Other B2B") {
        if (!values.otherB2BSubDomain) return "Please tell us more about your B2B specialization.";
        if (values.otherB2BSubDomain === "Other" && !values.customOtherB2BSubDomain.trim()) {
          return "Please specify your B2B specialization.";
        }
      }
    }

    // Stage 1B -- Extended Core (mandatory, identical regardless of Profile Type)
    if (stageIndex === 1) {
      // A fresher has no current employer/job title -- there is no "current
      // role" yet, that's the whole point of being a fresher. Employment
      // Status is auto-set to "First Job Seeker" the moment the fresher toggle
      // is chosen (see the button handlers below), so it's still required but
      // never actually blocks a fresher. Current CTC is likewise inapplicable
      // (nothing to have been paid yet) and is auto-zeroed the same way --
      // only Expected CTC (what they're looking for) makes sense to ask them.
      if (values.isFresher !== "Yes") {
        if (!values.currentEmployer.trim()) return "Current employer is required.";
        if (!values.currentJobTitle.trim()) return "Current job title is required.";
        if (!values.currentFixedCtc) return "Current fixed CTC is required.";
        if (!values.currentVariableCtc) return "Current variable CTC is required (select 0 LPA if none).";
      }
      if (!values.currentEmploymentStatus) return "Employment status is required.";
      if (!values.currentIndustry) return "Please select your current industry.";
      if (values.currentIndustry === "Other" && !values.customCurrentIndustry.trim()) {
        return "Please specify your current industry.";
      }
      if (!values.noOtherIndustries && !values.selectedIndustries.length) {
        return "Please select at least one previous industry, or check 'No other industries'.";
      }
      if (!values.isFresher) return "Please let us know if you're a fresher or already have work experience.";
      if (!values.totalExperienceYears) return "Total experience is required.";
      if (!values.expectedFixedCtc) return "Expected fixed CTC is required.";
      if (!values.expectedVariableCtc) return "Expected variable CTC is required (select 0 LPA if none).";
      if (!values.noticePeriod) return "Please let us know how many days you'd need to join.";
      if (!values.highestQualification) return "Highest qualification is required.";
      if (values.highestQualification === "Other" && !values.customQualification.trim()) {
        return "Please specify your qualification.";
      }
      if (!values.workMode) return "Please select a work mode preference.";
      if (!values.openToRelocation) return "Please select your relocation preference.";
      if (values.openToRelocation === "Yes" && !values.relocationPreferredCities.length && !values.customRelocationCity.trim()) {
        return "Please select at least one preferred city to relocate to.";
      }
      if (!values.travelPreference) return "Please select your travel preference.";
      if (!values.languagesKnown.length) return "Please select at least one language you know.";
      if (values.languagesKnown.includes("Other") && !values.customLanguage.trim()) {
        return "Please specify the other language(s) you know.";
      }
      // A fresher has no role level, IC-vs-team, team size, or secondary
      // specializations to speak of yet -- those describe an existing career,
      // not a preference. Only ask them once there's actual experience --
      // instead, a fresher gets one lightweight internship question.
      if (values.isFresher === "No") {
        if (!values.roleLevel) return "Please select your role level.";
        if (!values.roleType) return "Please select whether you are an IC or leading a team.";
        if (values.roleType === "Leading a Team" && !values.teamSize) return "Please select your team size.";
        if (values.roleType === "Other" && !values.customRoleType.trim()) return "Please describe your role type.";
        if (isSales && !values.secondarySubDomains.length) {
          return "Please select at least one option (choose 'None — single specialization only' if not applicable).";
        }
        if (values.secondarySubDomains.includes("Other (B2B)") && !values.secondaryOtherB2BSubDomain.trim()) {
          return "Please specify your secondary B2B specialization.";
        }
        if (values.secondarySubDomains.includes("Other (B2C)") && !values.secondaryOtherB2CSpecify.trim()) {
          return "Please specify your secondary B2C specialization.";
        }
        if (values.secondarySubDomains.includes("Other (Non-Sales)") && !values.secondaryOtherNonSalesSpecify.trim()) {
          return "Please specify your secondary Non-Sales specialization.";
        }
      } else {
        if (!values.hasInternship) return "Please let us know if you've done an internship.";
        if (values.hasInternship === "Yes") {
          if (!values.internshipCompany.trim()) return "Please enter the company you interned at.";
          if (!values.internshipRole.trim()) return "Please enter your internship role/title.";
          if (!values.internshipDuration.trim()) return "Please enter how long your internship was.";
          if (!values.internshipDescription.trim()) return "Please add one line on what you did during the internship.";
        }
      }
      if (!values.consent) return "Please confirm consent to continue.";
    }

    // Stage 2 -- Profile-Type-Specific (B2B / B2C only; skipped for Non-Sales)
    if (stageIndex === 2 && isSales) {
      if (values.isFresher === "Yes") return null;
      if (isB2B) {
        if (values.b2bSalesMotionType.length === 0) return "Please select at least one Sales Motion.";
        // Every B2B Sales Motion gets the same field set -- Hunter/Farmer,
        // deal size, sales cycle, and buyer persona.
        if (!values.aeSellingStyle) return "Please select Hunter, Farmer, or Hybrid.";
        if (!values.aeDealSizeCurrency) return "Please select a currency for your average deal size.";
        if (!values.aeDealSizeBand) return "Please select your average deal size.";
        if (!values.aeSalesCycle) return "Please select your typical sales cycle length.";
        if (!values.aeBuyerPersona) return "Please select your primary buyer persona.";
      } else if (isB2C) {
        if (values.b2cSalesMotion.length === 0) return "Please select at least one Sales Motion.";
        if (!values.b2cTicketCurrency) return "Please select a currency for your average ticket size.";
        if (!values.b2cTicketBand) return "Please select your average ticket size.";
      }
    }

    // Stage 3 -- Revenue Snapshot (B2B / B2C only; skipped for Non-Sales)
    if (stageIndex === 3 && isSales) {
      if (values.isFresher === "Yes") return null;
      if (!values.revenuePeriod) return "Please select Quarterly or Annual.";
      if (!values.revenueTargetCurrency) return "Please select a currency for your target.";
      if (!values.revenueTarget) return `Please select ${values.roleType === "Leading a Team" ? "your team's" : "your"} target.`;
      if (!values.revenueAchievement) return "Please select your achievement %.";
      if (values.roleType === "Leading a Team") {
        if (!values.hasIndividualQuota) return "Please let us know if you also carry an individual quota.";
        if (values.hasIndividualQuota === "Yes") {
          if (!values.individualTargetCurrency) return "Please select a currency for your individual target.";
          if (!values.individualTarget) return "Please select your individual target.";
          if (!values.individualAchievement) return "Please select your individual achievement %.";
        }
      }
    }
    return null;
  }

  // Real per-stage completion, independent of the wizard's current `step`.
  // validateStep() above only ever checks the *current* stage (it reads the
  // closure `stageIndex`), which is fine for the step-by-step wizard but
  // breaks down in My Profile edit mode, where `step` never advances -- that
  // used to leave every stage stuck showing "Pending" (or the current one
  // stuck on "In Progress") regardless of how much data actually existed.
  // This mirrors validateStep's field checks exactly, just parameterized by
  // stage index and returning a boolean instead of an error string, so the
  // Passport Readiness rail can show real completion for any stage at any time.
  function isStageComplete(i: number): boolean {
    const isSales = isSalesCategory;
    if (i === 0) {
      if (!values.fullName.trim()) return false;
      if (!/^\S+@\S+\.\S+$/.test(values.email)) return false;
      if (values.phone.length !== 10) return false;
      if (!values.cityChoice) return false;
      if (values.cityChoice === "Other" && (!values.customCity.trim() || !values.customState.trim())) return false;
      if (!resumeFile && !hasExistingResume) return false;
      if (!values.category) return false;
      if (!values.subDomain) return false;
      if (values.subDomain === "Other" && !values.customSubDomain.trim()) return false;
      if (values.subDomain === "Other B2B") {
        if (!values.otherB2BSubDomain) return false;
        if (values.otherB2BSubDomain === "Other" && !values.customOtherB2BSubDomain.trim()) return false;
      }
      return true;
    }
    if (i === 1) {
      if (values.isFresher !== "Yes") {
        if (!values.currentEmployer.trim()) return false;
        if (!values.currentJobTitle.trim()) return false;
        if (!values.currentFixedCtc) return false;
        if (!values.currentVariableCtc) return false;
      }
      if (!values.currentEmploymentStatus) return false;
      if (!values.currentIndustry) return false;
      if (values.currentIndustry === "Other" && !values.customCurrentIndustry.trim()) return false;
      if (!values.noOtherIndustries && !values.selectedIndustries.length) return false;
      if (!values.isFresher) return false;
      if (!values.totalExperienceYears) return false;
      if (!values.expectedFixedCtc) return false;
      if (!values.expectedVariableCtc) return false;
      if (!values.noticePeriod) return false;
      if (!values.highestQualification) return false;
      if (values.highestQualification === "Other" && !values.customQualification.trim()) return false;
      if (!values.workMode) return false;
      if (!values.openToRelocation) return false;
      if (
        values.openToRelocation === "Yes" &&
        !values.relocationPreferredCities.length &&
        !values.customRelocationCity.trim()
      ) {
        return false;
      }
      if (!values.travelPreference) return false;
      if (!values.languagesKnown.length) return false;
      if (values.languagesKnown.includes("Other") && !values.customLanguage.trim()) return false;
      if (values.isFresher === "No") {
        if (!values.roleLevel) return false;
        if (!values.roleType) return false;
        if (values.roleType === "Leading a Team" && !values.teamSize) return false;
        if (values.roleType === "Other" && !values.customRoleType.trim()) return false;
        if (isSales && !values.secondarySubDomains.length) return false;
        if (values.secondarySubDomains.includes("Other (B2B)") && !values.secondaryOtherB2BSubDomain.trim()) return false;
        if (values.secondarySubDomains.includes("Other (B2C)") && !values.secondaryOtherB2CSpecify.trim()) return false;
        if (values.secondarySubDomains.includes("Other (Non-Sales)") && !values.secondaryOtherNonSalesSpecify.trim()) {
          return false;
        }
      } else if (values.isFresher === "Yes") {
        if (!values.hasInternship) return false;
        if (values.hasInternship === "Yes") {
          if (!values.internshipCompany.trim()) return false;
          if (!values.internshipRole.trim()) return false;
          if (!values.internshipDuration.trim()) return false;
          if (!values.internshipDescription.trim()) return false;
        }
      }
      if (!values.consent) return false;
      return true;
    }
    if (i === 2) {
      if (!isSales) return true; // not applicable -- treated as satisfied
      if (values.isFresher === "Yes") return true;
      if (isB2B) {
        if (values.b2bSalesMotionType.length === 0) return false;
        if (!values.aeSellingStyle) return false;
        if (!values.aeDealSizeCurrency) return false;
        if (!values.aeDealSizeBand) return false;
        if (!values.aeSalesCycle) return false;
        if (!values.aeBuyerPersona) return false;
      } else if (isB2C) {
        if (values.b2cSalesMotion.length === 0) return false;
        if (!values.b2cTicketCurrency) return false;
        if (!values.b2cTicketBand) return false;
      }
      return true;
    }
    if (i === 3) {
      if (!isSales) return true;
      if (values.isFresher === "Yes") return true;
      if (!values.revenuePeriod) return false;
      if (!values.revenueTargetCurrency) return false;
      if (!values.revenueTarget) return false;
      if (!values.revenueAchievement) return false;
      if (values.roleType === "Leading a Team") {
        if (!values.hasIndividualQuota) return false;
        if (values.hasIndividualQuota === "Yes") {
          if (!values.individualTargetCurrency) return false;
          if (!values.individualTarget) return false;
          if (!values.individualAchievement) return false;
        }
      }
      return true;
    }
    return false;
  }

  function goNext() {
    const err = validateStep();
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    const completedLabel = `Stage ${ALL_STAGES[stageIndex]}`;
    toast.success(`${completedLabel} completed — profile strength ${profileStrength}%`);
    setStepJustCompleted(true);
    setTimeout(() => setStepJustCompleted(false), 1200);
    setStep((s) => Math.min(s + 1, stepSequence.length - 1));
  }

  function goBack() {
    setErrorMsg(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  // `opts.silent` is used exclusively by Stage 4's post-submit autosave effect
  // below -- same save path as the real Submit button, just without the
  // spinner/toast/step-jump side effects that make sense for an explicit,
  // user-initiated submit but would be noisy/disruptive fired automatically
  // every time an optional Stage 4 field changes.
  async function handleSubmit(opts?: { silent?: boolean }) {
    const silent = !!opts?.silent;
    if (!silent) {
      // Defensive re-check of every stage that applies to this candidate, not
      // just whichever one `step` currently points to. validateStep() alone
      // only checks the current stage -- fine for goNext()'s per-stage gate,
      // but for a sales-category candidate the final Submit click happens on
      // Stage 3, so relying on validateStep() alone here left Stage 1B's
      // required fields (Expected CTC, Work Mode, Relocation, etc.)
      // unchecked at the moment of the actual save. This is what let some
      // profiles reach the database with those fields blank despite the
      // wizard supposedly requiring them at every step.
      for (const i of stepSequence) {
        const err = validateStep(i);
        if (err) {
          setErrorMsg(err);
          setStep(stepSequence.indexOf(i));
          return;
        }
      }
      // Belt-and-suspenders: resume is only checked by validateStep() on Stage
      // 1A, but a restored draft (or any future step-reordering) could
      // otherwise reach this point with no resume attached. Never let that submit.
      if (!resumeFile && !hasExistingResume) {
        setErrorMsg("Please upload your resume before submitting.");
        setStep(0);
        return;
      }
      setSubmitting(true);
      setErrorMsg(null);
    }
    try {
      // Guarded so Stage 4's post-submit autosave (which calls this same
      // handleSubmit again whenever a Stage 4 field changes) never re-uploads
      // the identical resume File object on every autosave tick -- only a
      // genuinely new file picked by the candidate triggers a fresh upload.
      let resumeFileUrl: string | null = uploadedResumeRef.current.path;
      if (resumeFile && uploadedResumeRef.current.file !== resumeFile) {
        // Supabase Storage object keys reject several characters real resume
        // filenames commonly contain (square brackets from "Naukri_Name[3y_6m].pdf"
        // being the one that surfaced this, but parentheses/braces/backslashes
        // and non-ASCII characters can also fail) -- sanitize to a safe charset
        // instead of passing the raw filename straight into the object key.
        const safeName = resumeFile.name
          .normalize("NFKD")
          .replace(/[^\w.\-]+/g, "_")
          .replace(/_+/g, "_");
        const path = `${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("resumes").upload(path, resumeFile, {
          contentType: resumeFile.type || undefined,
        });
        if (uploadError) throw new Error(`Resume upload failed: ${uploadError.message}`);
        // Store the exact object path within the 'resumes' bucket (no bucket-name
        // prefix) so it matches storage.objects.name and can be resolved later
        // via supabase.storage.from('resumes').createSignedUrl(resumeFileUrl, ...).
        resumeFileUrl = path;
        uploadedResumeRef.current = { file: resumeFile, path };
      }

      // Unified Candidate Intake restructure: Stage 2 (Profile-Type-Specific)
      // and Stage 3 (Revenue Snapshot) are now profile-level FormState fields
      // (not derived from the Career Timeline's current-role entry the way
      // deal size/motion/quarterly targets used to be pre-restructure) --
      // assembled into segment_data here. `currentTimelineEntry` is kept only
      // for the best-win/missed-target self_assessment reflections, which
      // still live on the Career Timeline current-role entry (now Stage 4).
      const currentTimelineEntry = values.careerTimeline.find((e) => e.end_month === null);

      const segmentData: Record<string, unknown> = {
        role_level: values.roleLevel || undefined,
        role_type:
          values.roleType === "Leading a Team" ? "Team Lead" : values.roleType === "Other" ? values.customRoleType || "Other" : "IC",
        travel_preference: values.travelPreference || undefined,
      };

      if (values.roleType === "Leading a Team" && values.teamSize) {
        segmentData.team_size = values.teamSize;
      }

      if (values.openToRelocation === "Yes") {
        const preferredCities = Array.from(
          new Set([...values.relocationPreferredCities, values.customRelocationCity.trim()].filter(Boolean))
        );
        if (preferredCities.length) segmentData.relocation_preferred_cities = preferredCities;
      }

      // Languages known -- mandatory, every candidate regardless of category.
      const languages = Array.from(
        new Set(
          values.languagesKnown
            .filter((l) => l !== "Other")
            .concat(values.languagesKnown.includes("Other") ? [values.customLanguage.trim()] : [])
            .filter(Boolean)
        )
      );
      if (languages.length) segmentData.languages_known = languages;

      // "Other B2B" Level-2 specify -- primary Practice and/or Secondary
      // Specialization, purely for internal taxonomy-building (see
      // options.ts otherB2BSubDomains).
      if (values.subDomain === "Other B2B" && values.otherB2BSubDomain) {
        segmentData.other_b2b_subdomain =
          values.otherB2BSubDomain === "Other" ? values.customOtherB2BSubDomain.trim() : values.otherB2BSubDomain;
      }
      if (values.secondarySubDomains.includes("Other (B2B)") && values.secondaryOtherB2BSubDomain.trim()) {
        segmentData.secondary_other_b2b_subdomain = values.secondaryOtherB2BSubDomain.trim();
      }
      // Generic "Other" specify for the disambiguated B2C / Non-Sales tail
      // entries in the cross-Profile-Type Secondary Specialization list.
      if (values.secondarySubDomains.includes("Other (B2C)") && values.secondaryOtherB2CSpecify.trim()) {
        segmentData.secondary_other_b2c_specify = values.secondaryOtherB2CSpecify.trim();
      }
      if (values.secondarySubDomains.includes("Other (Non-Sales)") && values.secondaryOtherNonSalesSpecify.trim()) {
        segmentData.secondary_other_non_sales_specify = values.secondaryOtherNonSalesSpecify.trim();
      }

      // Fresher internship gate -- replaces Career Timeline/Sales Motion/
      // Revenue Snapshot for candidates with no work experience yet.
      if (values.isFresher === "Yes" && values.hasInternship) {
        segmentData.has_internship = values.hasInternship;
        if (values.hasInternship === "Yes") {
          segmentData.internship = {
            company: values.internshipCompany.trim() || undefined,
            role: values.internshipRole.trim() || undefined,
            duration: values.internshipDuration.trim() || undefined,
            description: values.internshipDescription.trim() || undefined,
          };
        }
      }

      // ---- Stage 2: Profile-Type-Specific ----
      if (isB2B) {
        segmentData.b2b_sales_motion_type = values.b2bSalesMotionType.length > 0 ? values.b2bSalesMotionType : undefined;
        // Every B2B Sales Motion gets the same Hunter/Farmer, deal size, sales
        // cycle, and buyer persona fields.
        Object.assign(segmentData, {
          style: values.aeSellingStyle || undefined,
          deal_size: values.aeDealSizeBand || undefined,
          deal_size_currency: values.aeDealSizeCurrency || undefined,
          cycle: values.aeSalesCycle || undefined,
          buyer_persona: values.aeBuyerPersona || undefined,
        });
      } else if (isB2C) {
        Object.assign(segmentData, {
          motion: values.b2cSalesMotion.length > 0 ? values.b2cSalesMotion : undefined,
          ticket: values.b2cTicketBand || undefined,
          ticket_currency: values.b2cTicketCurrency || undefined,
        });
      }

      // ---- Stage 3: Revenue Snapshot -- a dedicated profile-level step
      // (period toggle + IC/Team-Lead banded target + achievement %, with an
      // optional "do you also carry an individual quota" sub-branch). This
      // supersedes the old per-role quarterly target/achievement grid that
      // used to live on the Career Timeline's current-role card -- see the
      // judgment-call note in CareerTimelinePanel.tsx and the hand-off report.
      if (isSalesCategory && values.isFresher !== "Yes" && values.revenuePeriod) {
        segmentData.revenue_snapshot = {
          period: values.revenuePeriod,
          target: values.revenueTarget || undefined,
          target_currency: values.revenueTargetCurrency || undefined,
          achievement: values.revenueAchievement || undefined,
          has_individual_quota: values.roleType === "Leading a Team" ? values.hasIndividualQuota || undefined : undefined,
          individual_target: values.hasIndividualQuota === "Yes" ? values.individualTarget || undefined : undefined,
          individual_target_currency:
            values.hasIndividualQuota === "Yes" ? values.individualTargetCurrency || undefined : undefined,
          individual_achievement: values.hasIndividualQuota === "Yes" ? values.individualAchievement || undefined : undefined,
        };
        // Flat single-value convenience keys for simple CRM reads that just
        // want "the current achievement %" without unpacking the nested
        // object above (this restructure retires the old 4-quarter arrays
        // in favor of one banded target + one achievement per period).
        if (values.roleType === "Leading a Team") {
          segmentData.team_quota = values.revenueAchievement || undefined;
          if (values.hasIndividualQuota === "Yes") segmentData.quota = values.individualAchievement || undefined;
        } else {
          segmentData.quota = values.revenueAchievement || undefined;
        }
      }

      // ---- Stage 4 (optional, post-submit) extra depth -- present only once
      // the candidate has actually filled it in; safe to include on every
      // save (initial submit or later autosave) since profile_stage below
      // still reads the same completeness signals either way. ----
      if (values.promotionHistory) segmentData.promotion_history = values.promotionHistory;
      if (values.promotionDescription.trim()) segmentData.promotion_description = values.promotionDescription.trim();
      if (isB2B) {
        const crmTools = Array.from(new Set([...values.crmTools, values.customCrmTool.trim()].filter(Boolean)));
        if (crmTools.length) segmentData.crm_tools = crmTools;
        if (values.motionType) segmentData.motion_type = values.motionType;
        if (values.customerSegmentSold.length) segmentData.customer_segment_sold = values.customerSegmentSold;
      }
      if (isIndustrialPractice) {
        if (values.productLinesBrands.trim()) segmentData.product_lines_brands = values.productLinesBrands.trim();
        if (values.technicalCertifications.trim()) segmentData.technical_certifications = values.technicalCertifications.trim();
        if (values.tenderRfpExperience) segmentData.tender_rfp_experience = values.tenderRfpExperience;
        if (values.tenderRfpDescription.trim()) segmentData.tender_rfp_description = values.tenderRfpDescription.trim();
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
        // "full_profile" used to be triggered by whether the candidate filled
        // in optional depth extras (secondary specializations, a best-win
        // write-up, LinkedIn, etc.) -- which meant a candidate could be
        // labeled "fully done" while Expected CTC / Work Mode / Relocation
        // (all genuinely required fields) were still blank, and conversely a
        // candidate who filled every required field but skipped the optional
        // extras never got the "full_profile" label at all. This now checks
        // real completeness of every stage that actually applies to this
        // candidate (isStageComplete mirrors validateStep's own field list),
        // so the label means what it says.
        profile_stage:
          isStageComplete(1) && isStageComplete(2) && isStageComplete(3) ? "full_profile" : "applicant",
      };

      // Server-side submit route: creates/links a real auth.users account for
      // this email (service-role only, never exposed to the browser), calls
      // submit_candidate the same way the old direct supabase.rpc() call used
      // to, then stamps candidates.user_id -- see src/app/api/candidate-submit
      // for the full flow. Transport-only change; every field above and the
      // Stage 4 silent-autosave behavior below are unchanged.
      const submitRes = await fetch("/api/candidate-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, mandateId }),
      });
      const submitJson = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) throw new Error(submitJson?.error ?? "Something went wrong. Please try again.");

      if (silent) {
        setLastSavedAt(Date.now());
      } else if (isEditMode) {
        toast.success("Profile saved.");
        onSaved?.();
      } else {
        setSubmitted(true);
        toast.success("Your profile is on record. Thank you.");
      }
    } catch (e) {
      if (silent) return; // best-effort autosave -- never surface an error toast for it
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      if (!silent) setSubmitting(false);
    }
  }

  // Submit-button copy varies by entry source only (spec section "Submit"),
  // never by which fields render.
  const submitButtonLabel =
    source === "recruiter_created" ? "Create Profile" : source === "quick_apply" ? "Submit Application" : "Save My Profile";

  // Stage 4 (optional, post-submit) renders inline on the SAME screen right
  // after a successful fresh submit, and is always available in edit mode
  // (an existing candidate revisiting "My Profile" already has a committed
  // record, so there's no separate "submit" gate for them) -- autosaves via
  // the same progressive-save mechanism used pre-submit (see the
  // `onboarding_progressive_save` effect above), just reusing handleSubmit's
  // full payload builder in `silent` mode instead of a second save path.
  const showStage4 = submitted || isEditMode;

  // My Profile only: Stage 4 is optional/post-submit depth, so on the
  // one-page profile it should read as empty (collapsed) until the candidate
  // has actually filled something in it, then open by default so they can
  // see what's already there. Fresh submits (!isEditMode) always show it
  // fully expanded, unchanged from before -- this collapse only applies to
  // the one-page My Profile view.
  const hasStage4Data =
    values.careerTimeline.some((e) => e.end_month !== null || (e.best_win ?? "").trim() || (e.tough_loss ?? "").trim()) ||
    !!values.promotionHistory ||
    !!values.revenuePeriod ||
    !!values.linkedinUrl.trim();
  const [stage4Open, setStage4Open] = useState(hasStage4Data);

  // My Profile read-first cards -- only one section's fields are open for
  // editing at a time (per the approved design: "one section at a time and
  // save"); everything else on the page renders as a read-only summary.
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [savingSection, setSavingSection] = useState(false);
  const SECTION_STAGE_INDEX: Record<string, number> = { "1A": 0, "1B": 1, "2": 2, "3": 3 };
  async function saveSection() {
    // handleSubmit({ silent: true }) skips validateStep() entirely (silent
    // mode exists for Stage 4's autosave, where fields are optional) -- a
    // section-level Save must not reuse that path unchecked, or required
    // fields silently get persisted blank. Validate the specific section
    // that's actually open before saving anything.
    const idx = openSection ? SECTION_STAGE_INDEX[openSection] : undefined;
    if (idx !== undefined) {
      const err = validateStep(idx);
      if (err) {
        setErrorMsg(err);
        return;
      }
    }
    setErrorMsg(null);
    setSavingSection(true);
    try {
      await handleSubmit({ silent: true });
    } finally {
      setSavingSection(false);
      setOpenSection(null);
    }
  }

  useEffect(() => {
    if (!showStage4) return;
    const handle = setTimeout(() => {
      void handleSubmit({ silent: true });
    }, 1200);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showStage4,
    values.linkedinUrl,
    values.selectedSkills,
    values.careerTimeline,
    values.promotionHistory,
    values.promotionDescription,
    values.crmTools,
    values.customCrmTool,
    values.motionType,
    values.customerSegmentSold,
    values.productLinesBrands,
    values.technicalCertifications,
    values.tenderRfpExperience,
    values.tenderRfpDescription,
  ]);

  const StepIcon = STAGE_META[stageIndex].icon;

  // Fast-apply success: a returning candidate chose "use my existing
  // profile" instead of re-filling Stage 1B/2/3 -- short-circuit straight to
  // a clean confirmation instead of rendering the full wizard chrome.
  if (fastApplied) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-emerald-200 bg-emerald-50/60 px-6 py-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          ✓
        </div>
        <h2 className="text-xl font-bold text-slate-950">
          {existingCheck?.firstName ? `Thanks, ${existingCheck.firstName}` : "Thank you"} — you&apos;re all set
          {mandateTitle ? ` for ${mandateTitle}` : ""}.
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          We applied your existing profile to this role. A StaffAnchor recruiter will review it and reach out if
          there&apos;s a fit. If anything about your profile has changed, head to My Profile in your candidate
          portal any time to update it.
        </p>
      </div>
    );
  }

  return (
    <>
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

        {!(submitted && !isEditMode) && (
        <div
          className={
            isEditMode
              ? "grid gap-4 lg:grid-cols-6 lg:items-stretch"
              : "grid gap-6 lg:grid-cols-[260px_1fr_320px] lg:items-start"
          }
        >
          <aside className={isEditMode ? "contents" : "space-y-4 lg:sticky lg:top-6"}>
            <Card
              className={`${isEditMode ? "order-1 flex h-full flex-col lg:col-span-2 " : ""}rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]`}
            >
              <CardContent className={`space-y-4 py-5${isEditMode ? " flex h-full flex-col" : ""}`}>
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
                  {isEditMode
                    ? "All sections editable — click any to open it"
                    : `Stage ${ALL_STAGES[stageIndex]} — step ${step + 1} of ${stepSequence.length}`}
                </p>
                <ul className="space-y-0">
                  {ALL_STAGES.map((label, i) => {
                    // Non-Sales candidates skip Stage 2 and Stage 3 entirely
                    // (spec section 6) -- goNext()/goBack() already jump over
                    // them via `stepSequence`, so the step list should say so
                    // rather than showing a stage they'll never land on as
                    // "Pending" forever.
                    const isSkipped = (i === 2 || i === 3) && !isSalesCategory;
                    const posInSequence = stepSequence.indexOf(i);
                    // Edit mode has no "current step" concept (it's one
                    // continuous page, not a wizard) -- completion there is
                    // computed from real field data via isStageComplete()
                    // instead of the wizard's step position, otherwise every
                    // stage but the first showed "Pending" forever regardless
                    // of how much was actually filled in.
                    const isCurrent = !isEditMode && posInSequence === step;
                    const isDone = isEditMode ? isStageComplete(i) : posInSequence >= 0 && posInSequence < step;
                    const content = (
                      <>
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isSkipped
                                ? "bg-slate-100 text-slate-400"
                                : isDone
                                  ? "bg-emerald-500 text-white"
                                  : isCurrent
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {isSkipped ? "–" : isDone ? "✓" : label}
                          </div>
                          {i < ALL_STAGES.length - 1 && (
                            <div className={`w-px flex-1 ${isDone ? "bg-emerald-300" : "bg-slate-200"}`} style={{ minHeight: 24 }} />
                          )}
                        </div>
                        <div className="pb-4">
                          <p
                            className={`text-sm ${
                              isSkipped
                                ? "text-slate-300 line-through"
                                : isCurrent
                                  ? "font-semibold text-blue-600"
                                  : isDone
                                    ? "text-slate-700"
                                    : "text-slate-400"
                            }`}
                          >
                            Stage {label} — {STAGE_META[i].eyebrow.replace(/^Stage \S+ — /, "")}
                          </p>
                          <p className="text-xs text-slate-400">
                            {isSkipped ? "Not applicable" : isDone ? "Completed" : isCurrent ? "In Progress" : "Pending"}
                          </p>
                        </div>
                      </>
                    );
                    if (isEditMode && !isSkipped) {
                      return (
                        <li key={label}>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenSection(label);
                              // Scroll after the section's fields have had a
                              // chance to render -- scrolling synchronously
                              // (like a plain anchor href would) targets the
                              // element's pre-open position and reads as
                              // "broken" once the layout reflows underneath it.
                              requestAnimationFrame(() => {
                                document.getElementById(`stage-${label}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                              });
                            }}
                            className="flex w-full gap-3 rounded-lg text-left transition-colors hover:bg-slate-50"
                          >
                            {content}
                          </button>
                        </li>
                      );
                    }
                    return (
                      <li key={label} className="flex gap-3">
                        {content}
                      </li>
                    );
                  })}
                  {isEditMode && (
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          setStage4Open(true);
                          requestAnimationFrame(() => {
                            document.getElementById("stage-4")?.scrollIntoView({ behavior: "smooth", block: "start" });
                          });
                        }}
                        className="flex w-full gap-3 rounded-lg text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              hasStage4Data ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                            }`}
                          >
                            {hasStage4Data ? "✓" : "4"}
                          </div>
                        </div>
                        <div>
                          <p className={`text-sm ${hasStage4Data ? "text-slate-700" : "text-slate-400"}`}>
                            Stage 4 — Optional Depth
                          </p>
                          <p className="text-xs text-slate-400">{hasStage4Data ? "Completed" : "Optional"}</p>
                        </div>
                      </button>
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            <Card
              className={`${isEditMode ? "order-2 flex h-full flex-col " : ""}rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]`}
            >
              <CardContent
                className={`space-y-3 py-5 text-center${isEditMode ? " flex h-full flex-col items-center justify-center" : ""}`}
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-slate-900">Need Help?</p>
                <p className="text-xs leading-5 text-slate-500">
                  Our team is here to help you build the perfect profile.
                </p>
                <a href="https://www.staffanchor.com/contact" target="_blank" rel="noreferrer" className="w-full">
                  <Button variant="outline" className="w-full">
                    Chat with Us
                  </Button>
                </a>
              </CardContent>
            </Card>
          </aside>

        <Card
          className={`w-full${isEditMode ? " order-6 lg:col-span-6" : ""} rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]`}
        >
          <CardContent className="space-y-5 p-6">
            {isEditMode ? (
              // My Profile: one continuous page (all stages stacked below),
              // not a stage-by-stage wizard replay -- so the header here is a
              // single overview with the profile score up top, not a
              // per-stage eyebrow/heading that would repeat once per section.
              <>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/60 text-blue-600 ring-1 ring-blue-100">
                    <StepIcon className="h-5.5 w-5.5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Your Profile</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      Everything you&apos;ve told us, grouped by section. Tap Edit on any card to update it.
                    </p>
                  </div>
                </div>
                <div className="hidden shrink-0 items-center gap-3 sm:flex">
                  <div
                    className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-all duration-500"
                    style={{ background: `conic-gradient(${readinessMeta.ring} ${profileStrength * 3.6}deg, #e2e8f0 0deg)` }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
                      {profileStrength}%
                    </div>
                  </div>
                </div>
              </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-3.5 pb-1">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/60 text-blue-600 ring-1 ring-blue-100">
                    <StepIcon className="h-5.5 w-5.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                      {STAGE_META[stageIndex].eyebrow}
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{STAGE_META[stageIndex].heading}</h2>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{STAGE_META[stageIndex].subtext}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/70 px-3.5 py-3 text-sm text-blue-900 ring-1 ring-blue-100/80">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span className="leading-relaxed">{STAGE_TIPS[stageIndex]}</span>
                </div>
                <p className="text-xs italic leading-relaxed text-slate-400">&ldquo;{quote}&rdquo;</p>
              </>
            )}

          {isEditMode && openSection !== "1A" && (
            <ProfileSummaryCard id="stage-1A" title="Stage 1A — Core Details" complete={isStageComplete(0)} onEdit={() => setOpenSection("1A")}>
              <Stage1ASummary v={values} />
            </ProfileSummaryCard>
          )}
          {isEditMode && openSection === "1A" && (
            <p className="scroll-mt-24 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Stage 1 — Core Details
            </p>
          )}
          {(stageIndex === 0 || (isEditMode && openSection === "1A")) && (
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

              {existingCheck?.exists && !existingCheckDismissed && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
                  {existingCheck.alreadyApplied ? (
                    <>
                      <p className="text-sm font-semibold text-blue-900">
                        You&apos;ve already applied to this role{existingCheck.firstName ? `, ${existingCheck.firstName}` : ""}.
                      </p>
                      <p className="mt-1 text-xs text-blue-800">
                        No need to apply again -- a recruiter already has this application on file. If something
                        about your profile has changed, update it any time from My Profile in your candidate
                        portal.
                      </p>
                      <button
                        type="button"
                        onClick={() => setExistingCheckDismissed(true)}
                        className="mt-2 text-xs font-medium text-blue-700 underline hover:text-blue-900"
                      >
                        Fill this out as a new application anyway
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-blue-900">
                        Looks like you&apos;re already registered with us{existingCheck.firstName ? `, ${existingCheck.firstName}` : ""}!
                      </p>
                      <p className="mt-1 text-xs text-blue-800">
                        Want to apply for this role with your existing profile, or update your profile first?
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button type="button" onClick={handleFastApply} disabled={fastApplying} className="text-xs">
                          {fastApplying ? "Applying..." : "Use my existing profile — apply now"}
                        </Button>
                        <a
                          href="/candidate-login"
                          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-400"
                        >
                          Update my profile first
                        </a>
                        <button
                          type="button"
                          onClick={() => setExistingCheckDismissed(true)}
                          className="text-xs font-medium text-blue-700 underline hover:text-blue-900"
                        >
                          No, fill out a fresh form
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

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

              <FormField label="Current Profile Type" required>
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
                <FormField
                  label="Primary Specialization"
                  required
                >
                  <Select
                    value={values.subDomain}
                    onChange={(e) => {
                      update("subDomain", e.target.value);
                      update("otherB2BSubDomain", "");
                      update("customOtherB2BSubDomain", "");
                    }}
                  >
                    <option value="">Select...</option>
                    {/* subDomainOptions already ends in its own "Other" for B2C
                        Verticals and Non-Sales Functions -- no extra hardcoded
                        option appended here (that used to render two "Other"
                        entries). B2B Practices end in "Other B2B" instead. */}
                    {subDomainOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                  {values.subDomain === "Other" && (
                    <Input
                      className="mt-2"
                      value={values.customSubDomain}
                      onChange={(e) => update("customSubDomain", e.target.value)}
                      placeholder="Please specify"
                    />
                  )}
                  {values.subDomain === "Other B2B" && (
                    <div className="mt-2 space-y-2">
                      <p className="text-xs text-slate-500">
                        We actively focus on Enterprise Tech and Industrial & Infrastructure, but want to place great
                        candidates from every B2B background — tell us a bit more so we can match you well.
                      </p>
                      <Select
                        value={values.otherB2BSubDomain}
                        onChange={(e) => update("otherB2BSubDomain", e.target.value)}
                      >
                        <option value="">Select...</option>
                        {subDomainsForPractice("Other B2B").map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                      {values.otherB2BSubDomain === "Other" && (
                        <Input
                          value={values.customOtherB2BSubDomain}
                          onChange={(e) => update("customOtherB2BSubDomain", e.target.value)}
                          placeholder="Please specify"
                        />
                      )}
                    </div>
                  )}
                </FormField>
              )}
              {isEditMode && <SectionSaveBar onCancel={() => setOpenSection(null)} onSave={saveSection} saving={savingSection} />}
            </>
          )}

          {isEditMode && openSection !== "1B" && (
            <ProfileSummaryCard id="stage-1B" title="Stage 1B — Extended Core" complete={isStageComplete(1)} onEdit={() => setOpenSection("1B")}>
              <Stage1BSummary v={values} />
            </ProfileSummaryCard>
          )}
          {isEditMode && openSection === "1B" && (
            <p className="scroll-mt-24 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Stage 1B — Extended Core
            </p>
          )}
          {(stageIndex === 1 || (isEditMode && openSection === "1B")) && (
            <>
              <FormField label="Are you a fresher, or do you already have work experience?" required>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      update("isFresher", "Yes");
                      if (values.totalExperienceYears !== "0") update("totalExperienceYears", "0");
                      // No current role to speak of yet -- clear/auto-fill
                      // the fields that only make sense once you've had one,
                      // and mark Employment Status accordingly rather than
                      // leaving it for the candidate to guess at.
                      update("currentEmployer", "");
                      update("currentJobTitle", "");
                      update("currentFixedCtc", "0");
                      update("currentVariableCtc", "0");
                      update("currentEmploymentStatus", "First Job Seeker");
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      values.isFresher === "Yes"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    I&apos;m a fresher
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      update("isFresher", "No");
                      if (values.totalExperienceYears === "0") update("totalExperienceYears", "");
                      if (values.currentEmploymentStatus === "First Job Seeker") update("currentEmploymentStatus", "");
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      values.isFresher === "No"
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    I have work experience
                  </button>
                </div>
              </FormField>

              {values.isFresher !== "Yes" && (
                <>
                  <FormField label="Current Employer" required>
                    <Input value={values.currentEmployer} onChange={(e) => update("currentEmployer", e.target.value)} />
                  </FormField>
                  <FormField label="Current Job Title" required>
                    <Input value={values.currentJobTitle} onChange={(e) => update("currentJobTitle", e.target.value)} />
                  </FormField>
                </>
              )}
              {values.isFresher === "Yes" ? (
                <FormField label="Employment Status">
                  <p className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-emerald-700">
                    First Job Seeker
                  </p>
                </FormField>
              ) : (
                <FormField label="Employment Status" required>
                  <Select
                    value={values.currentEmploymentStatus}
                    onChange={(e) => update("currentEmploymentStatus", e.target.value)}
                  >
                    <option value="">Select...</option>
                    {employmentStatusOptions
                      .filter((o) => o !== "First Job Seeker")
                      .map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                  </Select>
                </FormField>
              )}
              <FormField label="Total Experience" required>
                <Select
                  value={values.totalExperienceYears}
                  onChange={(e) => {
                    update("totalExperienceYears", e.target.value);
                    if (e.target.value === "0") {
                      update("isFresher", "Yes");
                      update("currentEmployer", "");
                      update("currentJobTitle", "");
                      update("currentFixedCtc", "0");
                      update("currentVariableCtc", "0");
                      update("currentEmploymentStatus", "First Job Seeker");
                    } else if (e.target.value) {
                      update("isFresher", "No");
                      if (values.currentEmploymentStatus === "First Job Seeker") update("currentEmploymentStatus", "");
                    }
                  }}
                >
                  <option value="">Select...</option>
                  {experienceOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              {values.isFresher !== "Yes" && (
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
              )}
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

              <FormField label="Current Industry" required>
                <Select value={values.currentIndustry} onChange={(e) => update("currentIndustry", e.target.value)}>
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
                    onChange={(e) => update("customCurrentIndustry", e.target.value.slice(0, 60))}
                    maxLength={60}
                    placeholder="e.g. EdTech, Fintech, Insurance"
                  />
                </FormField>
              )}
              <CollapsibleFormField label="Other Industries Previously Worked In (multi-select)" required>
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
                  )}
                </div>
              </CollapsibleFormField>

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
              {values.openToRelocation === "Yes" && (
                <CollapsibleFormField label="Preferred Cities to Relocate To" required>
                  <div className="flex flex-wrap gap-2">
                    {cityOptions
                      .filter((c) => c !== "Other")
                      .map((city) => {
                        const active = values.relocationPreferredCities.includes(city);
                        return (
                          <button
                            type="button"
                            key={city}
                            onClick={() => toggleArrayValue("relocationPreferredCities", city)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {active ? "✓ " : "+ "}
                            {city}
                          </button>
                        );
                      })}
                  </div>
                  <Input
                    className="mt-2"
                    placeholder="Other city..."
                    value={values.customRelocationCity}
                    onChange={(e) => update("customRelocationCity", e.target.value)}
                  />
                </CollapsibleFormField>
              )}
              <FormField label="Willingness to Travel" required>
                <Select value={values.travelPreference} onChange={(e) => update("travelPreference", e.target.value)}>
                  <option value="">Select...</option>
                  {travelPreferenceOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Languages Known" required>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map((lang) => {
                    const active = values.languagesKnown.includes(lang);
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => toggleArrayValue("languagesKnown", lang)}
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {lang}
                      </button>
                    );
                  })}
                </div>
                {values.languagesKnown.includes("Other") && (
                  <Input
                    className="mt-2"
                    placeholder="Please specify other language(s)"
                    value={values.customLanguage}
                    onChange={(e) => update("customLanguage", e.target.value)}
                  />
                )}
              </FormField>

              {values.category && (
                <>
                  {values.isFresher === "Yes" ? (
                    <>
                      <p className="rounded-lg border border-dashed border-emerald-200 bg-emerald-50/60 px-3 py-2 text-xs font-medium text-emerald-700">
                        Since you&apos;re just starting out, we&apos;ll skip role level, team size, and career history for
                        now — you can always come back and add these once you have some experience under your belt.
                      </p>
                      <FormField label="Have you done an internship?" required>
                        <Select
                          value={values.hasInternship}
                          onChange={(e) => update("hasInternship", e.target.value as "" | "Yes" | "No")}
                        >
                          <option value="">Select...</option>
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </Select>
                      </FormField>
                      {values.hasInternship === "Yes" && (
                        <>
                          <FormField label="Internship Company" required>
                            <Input
                              value={values.internshipCompany}
                              onChange={(e) => update("internshipCompany", e.target.value)}
                            />
                          </FormField>
                          <FormField label="Internship Role / Title" required>
                            <Input
                              value={values.internshipRole}
                              onChange={(e) => update("internshipRole", e.target.value)}
                            />
                          </FormField>
                          <FormField label="Duration" required>
                            <Input
                              placeholder="e.g. 3 months"
                              value={values.internshipDuration}
                              onChange={(e) => update("internshipDuration", e.target.value)}
                            />
                          </FormField>
                          <FormField label="What did you do? (one line)" required>
                            <Input
                              value={values.internshipDescription}
                              onChange={(e) => update("internshipDescription", e.target.value)}
                            />
                          </FormField>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <CollapsibleFormField label="Secondary Specializations" required>
                        {values.secondarySubDomains.length === 0 && (
                          <p className="mb-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/60 px-3 py-2 text-xs font-medium text-blue-700">
                            Even one extra specialization can open up more mandates you'd be a fit for -- and if
                            you've worked across B2B and B2C (or moved between sales and a non-sales function), pick
                            all that genuinely apply, not just from your primary type. Choose "None" if you're a true
                            specialist.
                          </p>
                        )}
                        <div className="space-y-3">
                          {secondarySpecializationGroups().map(({ group, options }) => {
                            const excludeLabel = primaryAsSecondaryLabel(values.category || null, values.subDomain);
                            const visibleOptions = options.filter((o) => o !== excludeLabel);
                            if (!visibleOptions.length) return null;
                            return (
                              <div key={group}>
                                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                  {group}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {visibleOptions.map((o) => {
                                    const checked = values.secondarySubDomains.includes(o);
                                    return (
                                      <button
                                        type="button"
                                        key={o}
                                        onClick={() => toggleArrayValue("secondarySubDomains", o)}
                                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                                          checked
                                            ? "border-blue-600 bg-blue-600 text-white"
                                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        }`}
                                      >
                                        {o}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                          <div>
                            <button
                              type="button"
                              onClick={() =>
                                toggleArrayValue("secondarySubDomains", "None — single specialization only")
                              }
                              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                                values.secondarySubDomains.includes("None — single specialization only")
                                  ? "border-slate-700 bg-slate-700 text-white"
                                  : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              None — single specialization only
                            </button>
                          </div>
                        </div>
                        {values.secondarySubDomains.includes("Other (B2B)") && (
                          <div className="mt-2 space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                            <p className="text-xs text-slate-500">
                              You flagged "Other (B2B)" as a secondary specialization — tell us a bit more.
                            </p>
                            <Input
                              value={values.secondaryOtherB2BSubDomain}
                              onChange={(e) => update("secondaryOtherB2BSubDomain", e.target.value)}
                              placeholder="Please specify"
                            />
                          </div>
                        )}
                        {values.secondarySubDomains.includes("Other (B2C)") && (
                          <div className="mt-2 space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                            <p className="text-xs text-slate-500">
                              You flagged "Other" B2C as a secondary specialization — tell us a bit more.
                            </p>
                            <Input
                              value={values.secondaryOtherB2CSpecify}
                              onChange={(e) => update("secondaryOtherB2CSpecify", e.target.value)}
                              placeholder="Please specify"
                            />
                          </div>
                        )}
                        {values.secondarySubDomains.includes("Other (Non-Sales)") && (
                          <div className="mt-2 space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                            <p className="text-xs text-slate-500">
                              You flagged "Other" Non-Sales as a secondary specialization — tell us a bit more.
                            </p>
                            <Input
                              value={values.secondaryOtherNonSalesSpecify}
                              onChange={(e) => update("secondaryOtherNonSalesSpecify", e.target.value)}
                              placeholder="Please specify"
                            />
                          </div>
                        )}
                      </CollapsibleFormField>

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
                      {values.roleType === "Other" && (
                        <FormField label="Please describe your role type" required>
                          <Input value={values.customRoleType} onChange={(e) => update("customRoleType", e.target.value)} />
                        </FormField>
                      )}
                    </>
                  )}
                </>
              )}

              <FormField label="Consent" required>
                <label className="flex items-start gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={values.consent}
                    onChange={(e) => update("consent", e.target.checked)}
                  />
                  This shall create your profile with StaffAnchor for future roles. Do you approve this?
                </label>
              </FormField>
              {isEditMode && <SectionSaveBar onCancel={() => setOpenSection(null)} onSave={saveSection} saving={savingSection} />}
            </>
          )}

          {isEditMode && isSalesCategory && openSection !== "2" && (
            <ProfileSummaryCard id="stage-2" title="Stage 2 — Profile-Type-Specific" complete={isStageComplete(2)} onEdit={() => setOpenSection("2")}>
              <Stage2Summary v={values} isB2B={isB2B} isB2C={isB2C} />
            </ProfileSummaryCard>
          )}
          {isEditMode && isSalesCategory && openSection === "2" && (
            <p className="scroll-mt-24 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Stage 2 — Profile-Type-Specific
            </p>
          )}
          {(stageIndex === 2 || (isEditMode && openSection === "2")) && isSalesCategory && (
            values.isFresher === "Yes" ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center">
                <Briefcase className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-800">Nothing to fill in here yet — and that's fine.</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Sales-motion specifics describe a role you're actually in. Once you gain some experience, come back
                  anytime to fill this in.
                </p>
              </div>
            ) : isB2B ? (
              <>
                <FormField label="Sales Motion (select all that apply)" required>
                  <div className="space-y-3">
                    {b2bSalesMotionTypeGroups.map(({ group, options }) => (
                      <div key={group}>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          {group}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {options.map((o) => {
                            const checked = values.b2bSalesMotionType.includes(o);
                            return (
                              <button
                                type="button"
                                key={o}
                                onClick={() => toggleArrayValue("b2bSalesMotionType", o)}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                                  checked
                                    ? "border-blue-600 bg-blue-600 text-white"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                }`}
                              >
                                {checked ? "✓ " : "+ "}
                                {o}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </FormField>

                {values.b2bSalesMotionType.length > 0 && (
                  <>
                    <FormField label="Hunter or Farmer" required>
                      <Select value={values.aeSellingStyle} onChange={(e) => update("aeSellingStyle", e.target.value)}>
                        <option value="">Select...</option>
                        {sellingStyleOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Deal Size Currency" required>
                        <Select
                          value={values.aeDealSizeCurrency}
                          onChange={(e) => {
                            update("aeDealSizeCurrency", e.target.value as CurrencyValue);
                            update("aeDealSizeBand", "");
                          }}
                        >
                          <option value="">Select...</option>
                          {currencyOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Average Deal Size (ACV)" required>
                        <Select value={values.aeDealSizeBand} onChange={(e) => update("aeDealSizeBand", e.target.value)}>
                          <option value="">Select...</option>
                          {dealSizeBandsFor("b2b_sales", values.aeDealSizeCurrency).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    </div>
                    <FormField label="Sales Cycle Length" required>
                      <Select value={values.aeSalesCycle} onChange={(e) => update("aeSalesCycle", e.target.value)}>
                        <option value="">Select...</option>
                        {salesCycleOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Primary Buyer Persona" required>
                      <Select value={values.aeBuyerPersona} onChange={(e) => update("aeBuyerPersona", e.target.value)}>
                        <option value="">Select...</option>
                        {clientProfileOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </>
                )}
              </>
            ) : (
              <>
                <FormField label="Sales Motion (select all that apply)" required>
                  <div className="flex flex-wrap gap-1.5">
                    {b2cSalesMotionOptions.map((o) => {
                      const checked = values.b2cSalesMotion.includes(o);
                      return (
                        <button
                          type="button"
                          key={o}
                          onClick={() => toggleArrayValue("b2cSalesMotion", o)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                            checked
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {checked ? "✓ " : "+ "}
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Ticket Size Currency" required>
                    <Select
                      value={values.b2cTicketCurrency}
                      onChange={(e) => {
                        update("b2cTicketCurrency", e.target.value as CurrencyValue);
                        update("b2cTicketBand", "");
                      }}
                    >
                      <option value="">Select...</option>
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Average Ticket Size" required>
                    <Select value={values.b2cTicketBand} onChange={(e) => update("b2cTicketBand", e.target.value)}>
                      <option value="">Select...</option>
                      {dealSizeBandsFor("b2c_sales", values.b2cTicketCurrency).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
              </>
            )
          )}
          {isEditMode && isSalesCategory && openSection === "2" && (
            <SectionSaveBar onCancel={() => setOpenSection(null)} onSave={saveSection} saving={savingSection} />
          )}

          {isEditMode && isSalesCategory && openSection !== "3" && (
            <ProfileSummaryCard id="stage-3" title="Stage 3 — Revenue Snapshot" complete={isStageComplete(3)} onEdit={() => setOpenSection("3")}>
              <Stage3Summary v={values} isSales={isSalesCategory} />
            </ProfileSummaryCard>
          )}
          {isEditMode && isSalesCategory && openSection === "3" && (
            <p className="scroll-mt-24 border-t border-slate-100 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Stage 3 — Revenue Snapshot
            </p>
          )}
          {(stageIndex === 3 || (isEditMode && openSection === "3")) && isSalesCategory && (
            values.isFresher === "Yes" ? (
              <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center">
                <BarChart3 className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-800">Nothing to report yet — and that's fine.</p>
                <p className="mt-1 text-xs text-emerald-700">
                  Target vs. achievement describes a role you're actually in. Come back anytime once you have one.
                </p>
              </div>
            ) : (
              <>
                <FormField label="Reporting Period" required>
                  <div className="grid grid-cols-2 gap-2">
                    {revenuePeriodOptions.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => {
                          update("revenuePeriod", o);
                          update("revenueTarget", "");
                          update("individualTarget", "");
                        }}
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                          values.revenuePeriod === o
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </FormField>

                <p className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                  {values.roleType === "Leading a Team" ? (
                    <>
                      You told us you lead a team, so the target below is your <strong>team&apos;s overall</strong>{" "}
                      {values.revenuePeriod ? values.revenuePeriod.toLowerCase() : ""} number.
                    </>
                  ) : (
                    <>
                      You told us you&apos;re an individual contributor, so the target below is <strong>your own</strong>{" "}
                      {values.revenuePeriod ? values.revenuePeriod.toLowerCase() : ""} number.
                    </>
                  )}
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label={values.roleType === "Leading a Team" ? "Team Target Currency" : "Target Currency"} required>
                    <Select
                      value={values.revenueTargetCurrency}
                      onChange={(e) => update("revenueTargetCurrency", e.target.value as CurrencyValue)}
                    >
                      <option value="">Select...</option>
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label={values.roleType === "Leading a Team" ? "Team Target" : "Your Target"} required>
                    <Select
                      value={values.revenueTarget}
                      disabled={!values.revenuePeriod || !values.revenueTargetCurrency}
                      onChange={(e) => update("revenueTarget", e.target.value)}
                    >
                      <option value="">
                        {!values.revenuePeriod
                          ? "Please select Reporting Period first"
                          : !values.revenueTargetCurrency
                            ? "Please select currency first"
                            : "Select..."}
                      </option>
                      {revenueTargetBandOptionsFor(values.revenuePeriod, values.revenueTargetCurrency).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </div>
                <FormField label="Achievement %" required>
                  <div className="flex flex-wrap gap-1.5">
                    {achievementBandOptions.map((o) => {
                      const active = values.revenueAchievement === o;
                      return (
                        <button
                          type="button"
                          key={o}
                          onClick={() => update("revenueAchievement", o)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                            active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {o}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                {values.roleType === "Leading a Team" && (
                  <FormField label="Do you also carry an individual quota?" required>
                    <Select
                      value={values.hasIndividualQuota}
                      onChange={(e) => update("hasIndividualQuota", e.target.value as "" | "Yes" | "No")}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </Select>
                  </FormField>
                )}

                {values.roleType === "Leading a Team" && values.hasIndividualQuota === "Yes" && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Your individual target (in addition to the team number)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Individual Target Currency" required>
                        <Select
                          value={values.individualTargetCurrency}
                          onChange={(e) => update("individualTargetCurrency", e.target.value as CurrencyValue)}
                        >
                          <option value="">Select...</option>
                          {currencyOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                      <FormField label="Individual Target" required>
                        <Select
                          value={values.individualTarget}
                          disabled={!values.revenuePeriod || !values.individualTargetCurrency}
                          onChange={(e) => update("individualTarget", e.target.value)}
                        >
                          <option value="">
                            {!values.revenuePeriod
                              ? "Please select Reporting Period first"
                              : !values.individualTargetCurrency
                                ? "Please select currency first"
                                : "Select..."}
                          </option>
                          {revenueTargetBandOptionsFor(values.revenuePeriod, values.individualTargetCurrency).map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </FormField>
                    </div>
                    <FormField label="Individual Achievement %" required>
                      <div className="flex flex-wrap gap-1.5">
                        {achievementBandOptions.map((o) => {
                          const active = values.individualAchievement === o;
                          return (
                            <button
                              type="button"
                              key={o}
                              onClick={() => update("individualAchievement", o)}
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
                )}
              </>
            )
          )}
          {isEditMode && isSalesCategory && openSection === "3" && (
            <SectionSaveBar onCancel={() => setOpenSection(null)} onSave={saveSection} saving={savingSection} />
          )}

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          {isEditMode ? null : (
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
              {!isLastStage ? (
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
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-6 shadow-sm shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/25"
                >
                  {submitting ? "Submitting..." : submitButtonLabel}
                </Button>
              )}
            </div>
          )}
        </CardContent>
        </Card>

        <aside className={isEditMode ? "contents" : "space-y-4 lg:sticky lg:top-6"}>
          <Card
            className={`${isEditMode ? "order-3 flex h-full flex-col " : ""}rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]`}
          >
            <CardContent className={`space-y-3 py-5${isEditMode ? " flex h-full flex-col" : ""}`}>
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
                className={`flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700${isEditMode ? " mt-auto" : ""}`}
              >
                <Pencil className="h-3 w-3" />
                Edit basic info
              </button>
            </CardContent>
          </Card>

          <Card
            className={`${isEditMode ? "order-4 flex h-full flex-col " : ""}rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]`}
          >
            <CardContent className={`space-y-4 py-5${isEditMode ? " flex h-full flex-col" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Score</p>
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
              {/* Composition of the score, not a repeat of the left rail's
                  per-stage checklist -- this shows how much each stage is
                  *worth* toward the 100%, as one segmented bar, rather than
                  duplicating the same "Completed/Pending" list twice on the
                  same screen. */}
              <div className={`border-t border-slate-100 pt-3${isEditMode ? " mt-auto" : ""}`}>
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  {ALL_STAGES.map((label, i) => {
                    const isSkipped = !!values.category && (i === 2 || i === 3) && !isSalesCategory;
                    const done = isEditMode
                      ? isStageComplete(i)
                      : stepSequence.indexOf(i) >= 0 && stepSequence.indexOf(i) < step;
                    if (isSkipped) return null;
                    return (
                      <div
                        key={label}
                        title={`Stage ${label} — ${STAGE_WEIGHTS[i]}% of score`}
                        className={`h-full transition-colors duration-500 ${done ? "bg-emerald-500" : "bg-slate-200"}`}
                        style={{ width: `${STAGE_WEIGHTS[i]}%` }}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                  {ALL_STAGES.map((label, i) => {
                    const isSkipped = !!values.category && (i === 2 || i === 3) && !isSalesCategory;
                    if (isSkipped) return null;
                    return (
                      <span key={label}>
                        Stage {label} · {STAGE_WEIGHTS[i]}%
                      </span>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className={`${isEditMode ? "order-5 flex h-full flex-col " : ""}rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_20px_42px_-18px_rgba(15,23,42,0.18)]`}
          >
            <CardContent className={`space-y-2 py-5${isEditMode ? " flex h-full flex-col justify-center" : ""}`}>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-slate-900">Why we ask this</p>
              </div>
              <p className="text-sm leading-6 text-slate-600">{STAGE_TIPS[stageIndex]}</p>
            </CardContent>
          </Card>
        </aside>
        </div>
        )}

        {submitted && !isEditMode && (
          <div className="mx-auto mb-6 max-w-3xl rounded-2xl border border-emerald-200 bg-emerald-50/60 px-6 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              ✓
            </div>
            <h2 className="text-xl font-bold text-slate-950">
              Thank you, {values.fullName.split(" ")[0] || "there"}, your application has been successfully submitted
              {mandateTitle ? ` for ${mandateTitle}` : ""}.
            </h2>
            <div
              className={`mx-auto mt-4 flex max-w-xs items-center justify-center gap-2 rounded-2xl px-4 py-3 ${readinessMeta.chipBg}`}
            >
              <span className={`h-2 w-2 rounded-full ${readinessMeta.dot}`} />
              <p className={`text-sm font-semibold ${readinessMeta.chipText}`}>
                Passport Readiness: {readinessTier} ({profileStrength}%)
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              A StaffAnchor recruiter will review your profile and reach out if there&apos;s a mandate fit. A couple
              more optional things below boost your shortlisting odds.
            </p>
          </div>
        )}

        {showStage4 && (
          <Card
            id="stage-4"
            className="mx-auto w-full max-w-3xl scroll-mt-24 rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)]"
          >
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">Stage 4 — Optional</p>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {isEditMode ? "Career depth & optional details" : "A few more things that boost your shortlisting odds"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {isEditMode
                      ? hasStage4Data
                        ? "Autosaves as you go."
                        : "Not filled in yet -- this is optional, but it's the single biggest lever on your Passport Readiness score."
                      : "No pressure -- this all autosaves as you go, and you can come back anytime."}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div
                    className="relative hidden h-14 w-14 shrink-0 items-center justify-center rounded-full transition-all duration-500 sm:flex"
                    style={{ background: `conic-gradient(${readinessMeta.ring} ${profileStrength * 3.6}deg, #e2e8f0 0deg)` }}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
                      {profileStrength}%
                    </div>
                  </div>
                  {isEditMode && (
                    <Button type="button" variant="outline" onClick={() => setStage4Open((v) => !v)} className="rounded-xl">
                      {stage4Open ? "Show less" : "Show more"}
                    </Button>
                  )}
                </div>
              </div>

              {(!isEditMode || stage4Open) && (
                <>
              {/* Cluster: Career History -- historic roles + revenue per role +
                  reason for leaving + promotion history. This is the existing
                  CareerTimelinePanel, minus the quarterly target/achievement
                  grid it used to carry on the current-role card (that moved to
                  Stage 3, see the Revenue Snapshot step above / the hand-off
                  notes on CareerTimelinePanel.tsx). */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Career History</p>
                {values.isFresher === "Yes" ? (
                  <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center">
                    <Briefcase className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
                    <p className="text-sm font-semibold text-emerald-800">No work history to add yet — and that's fine.</p>
                    <p className="mt-1 text-xs text-emerald-700">Once you gain some experience, come back here anytime.</p>
                  </div>
                ) : (
                  <CareerTimelinePanel
                    entries={values.careerTimeline}
                    onChange={(next) => update("careerTimeline", next)}
                    currentEmployer={values.currentEmployer || null}
                    resumeEntries={(existingProfile?.career_timeline_resume ?? []) as ResumeTimelineEntry[]}
                  />
                )}
                {values.isFresher !== "Yes" && (
                  <FormField label="Were you promoted during your time at any of these companies? If so, briefly describe.">
                    {/* Deliberately understated relative to "Add a role" above --
                        this is a nice-to-have footnote on an already-optional
                        Stage 4 section, not the primary action on this screen. */}
                    <div className="flex gap-1.5">
                      {(["Yes", "No"] as const).map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => update("promotionHistory", o)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            values.promotionHistory === o
                              ? "border-slate-400 bg-slate-100 text-slate-700"
                              : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                    {values.promotionHistory === "Yes" && (
                      <textarea
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        rows={2}
                        value={values.promotionDescription}
                        onChange={(e) => update("promotionDescription", e.target.value)}
                        placeholder="Briefly describe the promotion(s)..."
                      />
                    )}
                  </FormField>
                )}
              </div>

              {/* Cluster: Profile & Documents -- LinkedIn + skills (everyone) */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Profile &amp; Documents</p>
                <FormField label="LinkedIn Profile URL">
                  <Input value={values.linkedinUrl} onChange={(e) => update("linkedinUrl", e.target.value)} />
                </FormField>
                <FormField label="Key Skills / Tools">
                  <div className="space-y-2">
                    {suggestedSkills.length > 0 && (
                      <p className="text-xs text-slate-500">Suggested for {values.subDomain || "your specialization"} — tap to add:</p>
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
              </div>

              {/* Cluster: B2B extra depth */}
              {isB2B && (
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">B2B Extra Depth</p>
                  <FormField label="CRM Tool Stack">
                    <div className="flex flex-wrap gap-2">
                      {crmToolOptions.map((tool) => {
                        const active = values.crmTools.includes(tool);
                        return (
                          <button
                            type="button"
                            key={tool}
                            onClick={() => toggleArrayValue("crmTools", tool)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {active ? "✓ " : "+ "}
                            {tool}
                          </button>
                        );
                      })}
                    </div>
                    <Input
                      className="mt-2"
                      placeholder="Other CRM tool..."
                      value={values.customCrmTool}
                      onChange={(e) => update("customCrmTool", e.target.value)}
                    />
                  </FormField>
                  <FormField label="PLG vs. Sales-Led Motion">
                    <Select value={values.motionType} onChange={(e) => update("motionType", e.target.value)}>
                      <option value="">Select...</option>
                      {motionTypeOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Customer Segment(s) Sold To">
                    <div className="flex flex-wrap gap-2">
                      {customerSegmentOptions.map((seg) => {
                        const active = values.customerSegmentSold.includes(seg);
                        return (
                          <button
                            type="button"
                            key={seg}
                            onClick={() => toggleArrayValue("customerSegmentSold", seg)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {active ? "✓ " : "+ "}
                            {seg}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                </div>
              )}

              {/* Cluster: Industrial & Infrastructure (Practice 2) extra depth --
                  see the judgment-call note in the hand-off report: this is
                  deliberately the ONLY place territory/route/account-type/
                  complexity-style Industrial depth is asked at the profile
                  level; the CareerTimelinePanel above already asks the
                  matching per-role territory_region/commercial_route/
                  target_account_type/product_complexity fields, so this
                  cluster only covers what's genuinely new here. */}
              {isIndustrialPractice && (
                <div className="space-y-3 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Industrial &amp; Infrastructure Extra Depth</p>
                  <FormField label="Product Lines / Brands">
                    <Input
                      value={values.productLinesBrands}
                      onChange={(e) => update("productLinesBrands", e.target.value)}
                      placeholder="e.g. Siemens PLCs, Schneider drives..."
                    />
                  </FormField>
                  <FormField label="Technical Certifications">
                    <Input
                      value={values.technicalCertifications}
                      onChange={(e) => update("technicalCertifications", e.target.value)}
                      placeholder="e.g. Six Sigma Green Belt, PMP..."
                    />
                  </FormField>
                  <FormField label="Tender / RFP Experience">
                    <div className="grid grid-cols-2 gap-2">
                      {tenderRfpExperienceOptions.map((o) => (
                        <button
                          key={o}
                          type="button"
                          onClick={() => update("tenderRfpExperience", o)}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                            values.tenderRfpExperience === o
                              ? "border-slate-900 bg-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                    {values.tenderRfpExperience === "Yes" && (
                      <textarea
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        rows={2}
                        value={values.tenderRfpDescription}
                        onChange={(e) => update("tenderRfpDescription", e.target.value)}
                        placeholder="Briefly describe your tender / RFP experience..."
                      />
                    )}
                  </FormField>
                </div>
              )}
                </>
              )}

              {isEditMode && stage4Open && (
                <div className="flex justify-end border-t border-slate-100 pt-4">
                  <Button type="button" onClick={() => handleSubmit()} disabled={submitting} className="rounded-xl bg-blue-600 px-6">
                    {submitting ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>

    {showLeaveWarning && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
          {submitted && !isEditMode ? (
            <>
              <h2 className="text-base font-semibold text-slate-900">Your application&apos;s in!</h2>
              <p className="mt-2 text-sm text-slate-600">
                A couple more optional things (below) boost your shortlisting odds -- but you&apos;re already on
                record either way. Want to add a bit more before you go?
              </p>
            </>
          ) : (
            <>
              <h2 className="text-base font-semibold text-slate-900">Wait — your profile isn&apos;t complete yet.</h2>
              <p className="mt-2 text-sm text-slate-600">
                Recruiters match candidates based on a complete profile, so leaving now means you may not get matched
                to relevant roles. It&apos;s just 5 more minutes to finish. Are you sure you want to leave?
              </p>
            </>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setShowLeaveWarning(false)}
              className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              {submitted && !isEditMode ? "Stay and add more" : "Stay and finish"}
            </button>
            <button
              type="button"
              onClick={() => {
                const href = pendingHrefRef.current;
                setShowLeaveWarning(false);
                if (href) router.push(href);
              }}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Leave anyway
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
