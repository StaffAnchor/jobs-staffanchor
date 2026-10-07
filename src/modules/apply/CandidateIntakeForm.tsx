"use client";

import WhatsAppChatButton from "@/components/WhatsAppChatButton";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, Phone, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { posthog } from "@/lib/posthog";
import { authHeaders } from "@/lib/auth-headers";
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
  achievementBandOptions,
  b2bSoldGroups,
  b2cSoldGroups,
  b2cMotionChoices,
  industrySoldGroups,
  revenueTargetBandOptionsFor,
  type PickerGroup,
  b2bSalesMotionTypeGroups,
  crmToolOptions,
  ctcStepOptions,
  customerSegmentOptions,
  salesToolOptions,
  searchSkills,
  teamSizeOptions,
  yourLevelOptions,
  currencyOptions,
  dealSizeBandsFor,
  sellingStyleOptions,
  type CurrencyValue,
  categoryOptions,
  cityOptions,
  cityStateMap,
  defaultNoticePeriods,
  employmentStatusOptions,
  experienceOptions,
  level1OptionsForProfileType,
  relocationOptions,
  workModeOptions,
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
  current_variable_ctc?: number | null;
  expected_variable_ctc?: number | null;
  whatsapp_opt_in?: boolean | null;
  industries?: string[] | null;
  skills?: string | null;
  current_employment_status?: string | null;
  open_to_relocation?: string | null;
  work_mode?: string | null;
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
  if (row.current_variable_ctc == null) missing.push("Current variable pay");
  if (!row.current_employment_status) missing.push("Employment status");
  if (!row.open_to_relocation) missing.push("Open to relocation");
  if (!row.work_mode) missing.push("Work mode");
  if (!row.notice_period) missing.push("Days to join");
  if (row.expected_fixed_ctc == null) missing.push("Expected CTC");
  if (typeof seg.offer_in_hand !== "boolean") missing.push("Offer in hand");
  const lvl = yourLevelOptions.find((l) => l.value === seg.role_level);
  if (lvl?.lead && !(typeof seg.team_size === "string" && seg.team_size)) missing.push("Team size");
  if (isSalesCategory(row.category) && row.total_experience_years !== 0) {
    if (!row.industries?.length) missing.push("Industries sold into");
    const motion = row.category === "b2c_sales" ? seg.motion : seg.b2b_sales_motion_type;
    if (!Array.isArray(motion) || motion.length === 0) missing.push("Sales motion");
    if (!(typeof (row.category === "b2c_sales" ? seg.ticket : seg.deal_size) === "string")) missing.push("Deal size");
    if (!(typeof seg.quota === "string" || typeof seg.team_quota === "string")) missing.push("Quota attainment");
    if (!(seg.revenue_snapshot && typeof (seg.revenue_snapshot as Record<string, unknown>).target === "string")) missing.push("Last year's target");
  }
  return missing;
}

function isSalesCategory(c: string | null | undefined): boolean {
  return c === "b2b_sales" || c === "b2c_sales";
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
  // candidates.id from a recruiter-sent completion link (/register?ref=<id>):
  // lets the holder update that profile without signing in.
  completionRef?: string;
};

export default function CandidateIntakeForm({
  mandateId,
  mandateTitle,
  email,
  existing,
  signedIn = false,
  onDone,
  returnTo,
  completionRef,
}: Props) {
  const router = useRouter();
  const seg = (existing?.segment_data ?? {}) as Record<string, unknown>;
  const loc = splitLocation(existing?.current_location);

  const [fullName, setFullName] = useState(existing?.full_name ?? "");
  const [phone, setPhone] = useState((existing?.phone ?? "").replace(/\D/g, "").slice(-10));
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeParsing, setResumeParsing] = useState(false);
  const [category, setCategory] = useState<CategoryValue | "">((existing?.category as CategoryValue) ?? "");
  // Practice is only a single pick for non-sales functions; sales profiles use
  // the "what have you sold" lists below.
  const [practice, setPractice] = useState(existing?.category === "non_sales" ? (existing?.sub_domain ?? "") : "");
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
  const [workMode, setWorkMode] = useState(existing?.work_mode ?? "");
  const [consent, setConsent] = useState(true);
  const [whatsappOptIn, setWhatsappOptIn] = useState(existing?.whatsapp_opt_in === true);
  const [currentVariableCtc, setCurrentVariableCtc] = useState(
    existing?.current_variable_ctc != null ? String(existing.current_variable_ctc) : ""
  );
  const [expectedVariableCtc, setExpectedVariableCtc] = useState(
    existing?.expected_variable_ctc != null ? String(existing.expected_variable_ctc) : ""
  );
  const [ctcNegotiable, setCtcNegotiable] = useState(seg.expected_ctc_negotiable === true);
  const [sellingStyle, setSellingStyle] = useState(typeof seg.style === "string" ? seg.style : "");
  const [motions, setMotions] = useState<string[]>(
    Array.isArray(seg.b2b_sales_motion_type)
      ? (seg.b2b_sales_motion_type as string[])
      : Array.isArray(seg.motion)
        ? (seg.motion as string[])
        : []
  );
  const [dealCurrency, setDealCurrency] = useState<CurrencyValue>(
    ((seg.deal_size_currency ?? seg.ticket_currency) as CurrencyValue) === "USD" ? "USD" : "INR"
  );
  const [dealBand, setDealBand] = useState(
    typeof seg.deal_size === "string" ? seg.deal_size : typeof seg.ticket === "string" ? seg.ticket : ""
  );
  const [attainment, setAttainment] = useState(
    typeof seg.quota === "string" ? seg.quota : typeof seg.team_quota === "string" ? seg.team_quota : ""
  );
  const [teamSize, setTeamSize] = useState(typeof seg.team_size === "string" ? seg.team_size : "");
  const [soldNow, setSoldNow] = useState<string[]>(Array.isArray(seg.sells_now) ? (seg.sells_now as string[]) : []);
  const [soldBefore, setSoldBefore] = useState<string[]>(Array.isArray(seg.sells_before) ? (seg.sells_before as string[]) : []);
  const [targetCurrency, setTargetCurrency] = useState<CurrencyValue>(
    (seg.revenue_snapshot as Record<string, unknown> | undefined)?.target_currency === "USD" ? "USD" : "INR"
  );
  const [targetBand, setTargetBand] = useState(
    typeof (seg.revenue_snapshot as Record<string, unknown> | undefined)?.target === "string"
      ? ((seg.revenue_snapshot as Record<string, unknown>).target as string)
      : ""
  );
  const [segments, setSegments] = useState<string[]>(
    Array.isArray(seg.customer_segment_sold) ? (seg.customer_segment_sold as string[]) : []
  );
  const [industriesSold, setIndustriesSold] = useState<string[]>(existing?.industries ?? []);
  const [tools, setTools] = useState<string[]>(Array.isArray(seg.crm_tools) ? (seg.crm_tools as string[]) : []);
  const [skillList, setSkillList] = useState<string[]>(
    (existing?.skills ?? "").split(",").map((x) => x.trim()).filter(Boolean)
  );
  const [lastWorkingDay, setLastWorkingDay] = useState(typeof seg.last_working_day === "string" ? seg.last_working_day : "");
  const [offerInHand, setOfferInHand] = useState(seg.offer_in_hand === true ? "Yes" : seg.offer_in_hand === false ? "No" : "");
  const [offerCtc, setOfferCtc] = useState(typeof seg.offer_ctc === "number" ? String(seg.offer_ctc) : "");
  const [pos, setPos] = useState(0);
  const [earlierOpen, setEarlierOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [readSummary, setReadSummary] = useState<string[]>([]);

  const [noticePeriods, setNoticePeriods] = useState<string[]>(defaultNoticePeriods);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [skippedVerify, setSkippedVerify] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [accountOnly, setAccountOnly] = useState(false);

  const extractionRef = useRef<ResumeExtraction | null>(null);
  const [screeningQuestions, setScreeningQuestions] = useState<ApplicationQuestion[]>([]);
  const [showScreeningModal, setShowScreeningModal] = useState(false);
  const screeningAnswersRef = useRef<ApplicationAnswerPayload[] | null>(null);

  const practiceOptions = useMemo(() => level1OptionsForProfileType(category || null), [category]);
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
        if (fields.skills?.length) setSkillList((prev) => (prev.length ? prev : fields.skills.slice(0, 12)));
        const found: string[] = [];
        if (fields.current_job_title) found.push(fields.current_job_title);
        if (fields.current_employer) found.push(fields.current_employer);
        if (fields.total_experience_years != null) found.push(`${Math.round(fields.total_experience_years)} yrs experience`);
        if (fields.skills?.length) found.push(`${fields.skills.length} skills`);
        setReadSummary(found);
      }
    } catch {
      // Never block on a parse failure -- the resume still uploads and submits.
    } finally {
      setResumeParsing(false);
    }
  }

  const levelDef = yourLevelOptions.find((l) => l.value === roleLevel);
  const isLeadLevel = !!levelDef?.lead;
  const hasSalesStep = isSalesCategory(category) && totalExperienceYears !== "0";
  // Step ids: 0 you, 1 role now, 2 sales story (sales only), 3 next move.
  const stepIds = hasSalesStep ? [0, 1, 2, 3] : [0, 1, 3];
  const stepId = stepIds[Math.min(pos, stepIds.length - 1)];
  const isLast = pos >= stepIds.length - 1;

  const quotaWord = isLeadLevel ? "team" : "individual";

  function validateStep(id: number): string | null {
    if (id === 0) {
      if (!resumeFile && !hasExistingResume) return "Please upload your resume.";
      if (!fullName.trim()) return "Please enter your full name.";
      if (phone.replace(/\D/g, "").length !== 10) return "Please enter a valid 10-digit phone number.";
      if (!cityChoice) return "Please select your current city.";
      if (cityChoice === "Other" && !customCity.trim()) return "Please enter your city.";
    }
    if (id === 1) {
      if (!category) return "Please pick what you do.";
      if (category === "non_sales" && !practice) return "Please pick your function.";
      if (isSalesCategory(category) && soldNow.length === 0) return "Pick what you sell today.";
      if (!roleLevel) return "Please pick your role level.";
      if (isLeadLevel && !teamSize) return "Please select your team size.";
      if (!totalExperienceYears) return "Please select your total experience.";
    }
    if (id === 2) {
      if (category === "b2b_sales" && !sellingStyle) return "Are you a hunter, a farmer or a mix? Pick one.";
      if (motions.length === 0) return "Pick at least one way you sell.";
      if (industriesSold.length === 0) return "Add at least one industry you've sold into.";
      if (category === "b2b_sales" && segments.length === 0) return "Pick the customer segments you sell to.";
      if (!dealBand) return category === "b2c_sales" ? "Pick your typical ticket size." : "Pick your typical deal size.";
      if (!targetBand) return `Pick your ${quotaWord} target for last year.`;
      if (!attainment) return `Pick how much of your ${quotaWord} target you hit.`;
    }
    if (id === 3) {
      if (!employmentStatus) return "Please pick your employment status.";
      if (!noticePeriod) return "Please select how soon you can join.";
      if (!currentFixedCtc) return "Please select your current fixed CTC.";
      if (!currentVariableCtc) return "Please select your current variable pay (0 LPA if none).";
      if (!expectedFixedCtc && !ctcNegotiable) return "Tell us your expected fixed CTC, or mark it Negotiable.";
      if (!relocation) return "Please tell us if you're open to relocation.";
      if (!workMode) return "Please pick your preferred work mode.";
      if (!offerInHand) return "Do you have an offer in hand? Pick Yes or No.";
      if (offerInHand === "Yes" && !offerCtc) return "Please select the CTC of your offer.";
      if (!consent) return "Please accept the consent checkbox to continue.";
    }
    return null;
  }

  function validate(): string | null {
    for (const id of stepIds) {
      const err = validateStep(id);
      if (err) return err;
    }
    return null;
  }

  // Bring the top of the form (not the page) into view, so on a job page the
  // candidate stays at the form instead of jumping to the job header.
  function scrollToForm() {
    const go = (behavior: ScrollBehavior) => formRef.current?.scrollIntoView({ behavior, block: "start" });
    requestAnimationFrame(() => go("smooth"));
    // If anything else on the page (or a re-render that briefly shrinks it)
    // throws the scroll position back to the top, put it back at the form.
    for (const ms of [250, 700]) {
      window.setTimeout(() => {
        const top = formRef.current?.getBoundingClientRect().top ?? 0;
        if (top > window.innerHeight * 0.6 || top < -window.innerHeight * 0.3) go("auto");
      }, ms);
    }
  }

  function goNext() {
    const err = validateStep(stepId);
    if (err) {
      setErrorMsg(err);
      return;
    }
    setErrorMsg(null);
    setPos((p) => Math.min(p + 1, stepIds.length - 1));
    scrollToForm();
  }

  function goBack() {
    setErrorMsg(null);
    setPos((p) => Math.max(0, p - 1));
    scrollToForm();
  }

  // Live "how strong is my profile" read for the progress ring: every field
  // this form asks for, weighted equally.
  const strength = (() => {
    const checks: boolean[] = [
      !!(resumeFile || hasExistingResume),
      !!fullName.trim(),
      phone.length === 10,
      !!cityChoice,
      !!category,
      isSalesCategory(category) ? soldNow.length > 0 : !!practice,
      !!roleLevel,
      !!totalExperienceYears,
      !!employmentStatus,
      !!noticePeriod,
      !!currentFixedCtc,
      !!currentVariableCtc,
      !!(expectedFixedCtc || ctcNegotiable),
      !!relocation,
      !!workMode,
      !!offerInHand,
    ];
    if (hasSalesStep) checks.push(motions.length > 0, industriesSold.length > 0, !!dealBand, !!targetBand, !!attainment);
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  })();

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
        sub_domain: isSalesCategory(category) ? (soldNow[0] ?? null) : practice,
        secondary_sub_domains: isSalesCategory(category) ? [...soldNow.slice(1), ...soldBefore] : [],
        total_experience_years: Math.min(Number(totalExperienceYears), 40),
        current_fixed_ctc: Math.min(Number(currentFixedCtc), 120),
        current_variable_ctc: Math.min(Number(currentVariableCtc), 120),
        // "Negotiable" keeps the flag in segment_data, but the column still needs a
        // number for a profile to count as complete: use their current fixed CTC as
        // the starting point rather than leaving it blank.
        expected_fixed_ctc: ctcNegotiable
          ? Math.min(Number(currentFixedCtc), 120)
          : expectedFixedCtc
            ? Math.min(Number(expectedFixedCtc), 120)
            : null,
        expected_variable_ctc: expectedVariableCtc ? Math.min(Number(expectedVariableCtc), 120) : null,
        whatsapp_opt_in: whatsappOptIn,
        current_employment_status: employmentStatus,
        notice_period: noticePeriod,
        open_to_relocation: relocation,
        work_mode: workMode,
        segment_data: {
          role_level: roleLevel,
          role_type: roleTypeToStored(roleType),
          expected_ctc_negotiable: ctcNegotiable,
          ...(isLeadLevel && teamSize ? { team_size: teamSize } : {}),
          ...(employmentStatus === "Serving Notice" && lastWorkingDay ? { last_working_day: lastWorkingDay } : {}),
          offer_in_hand: offerInHand === "Yes",
          ...(offerInHand === "Yes" && offerCtc ? { offer_ctc: Math.min(Number(offerCtc), 120) } : {}),
          ...(hasSalesStep && tools.length ? { crm_tools: tools } : {}),
          ...(isSalesCategory(category) ? { sells_now: soldNow, sells_before: soldBefore } : {}),
          ...(hasSalesStep && category === "b2b_sales" ? { customer_segment_sold: segments } : {}),
          ...(hasSalesStep
            ? {
                // Same shape the long profile form writes, so the CRM reads one thing.
                revenue_snapshot: {
                  period: "Annual",
                  target: targetBand,
                  target_currency: targetCurrency,
                  achievement: attainment,
                  quota_scope: isLeadLevel ? "team" : "individual",
                },
              }
            : {}),
          // Same keys the long profile form writes, so the CRM reads one shape.
          ...(hasSalesStep
            ? {
                ...(category === "b2b_sales"
                  ? {
                      b2b_sales_motion_type: motions,
                      style: sellingStyle,
                      deal_size: dealBand,
                      deal_size_currency: dealCurrency,
                    }
                  : { motion: motions, ticket: dealBand, ticket_currency: dealCurrency }),
                ...(roleType === "Leading a Team" ? { team_quota: attainment } : { quota: attainment }),
              }
            : {}),
        },
        // Silent resume-parse fill -- never shown to or confirmed by the candidate.
        current_employer: extraction?.current_employer || null,
        current_job_title: extraction?.current_job_title || null,
        current_industry: extraction?.current_industry || null,
        highest_qualification: extraction?.highest_qualification || null,
        linkedin_url: extraction?.linkedin_url || null,
        skills: skillList.length ? skillList.join(", ") : extraction?.skills?.length ? extraction.skills.join(", ") : null,
        ...(hasSalesStep && industriesSold.length ? { industries: industriesSold } : {}),
        consent: true,
        profile_stage: mandateId ? "applicant" : "lead",
      };

      const submitRes = await fetch("/api/candidate-submit", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
          payload,
          ...(mandateId ? { mandateId } : {}),
          ...(screeningAnswersRef.current?.length ? { screeningAnswers: screeningAnswersRef.current } : {}),
          // Anonymous candidates get a sign-in code on the success screen, so
          // the separate "welcome, here's how to sign back in" email would
          // just be a second, redundant message seconds later.
          skipWelcomeEmail: !signedIn,
          ...(completionRef ? { completionRef } : {}),
        }),
      });
      const submitJson = await submitRes.json().catch(() => ({}));
      if (!submitRes.ok) {
        // The email already has a profile and the caller isn't signed in as its
        // owner: send them to sign in instead of showing a dead-end error.
        if (submitJson?.code === "PROFILE_EXISTS") {
          setProfileExists(true);
          setAccountOnly(!!submitJson?.accountOnly);
        }
        throw new Error(submitJson?.error ?? "Something went wrong. Please try again.");
      }

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
    if (!isLast) {
      goNext();
      return;
    }
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
        <div className="mt-5 text-center">
          <p className="mb-2 text-xs text-slate-500">Prefer a faster reply?</p>
          <WhatsAppChatButton
            source={mandateId ? "intake_applied" : "intake_registered"}
            variant="outline"
            text={`Hi StaffAnchor, I'm ${fullName.trim() || "a candidate"}. I just ${mandateId ? `applied${mandateTitle ? ` for ${mandateTitle}` : ""}` : "registered"} on jobs.staffanchor.com. Could you tell me what happens next?`}
          />
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

  const first = fullName.trim().split(/\s+/)[0] || "";
  const expLabel = experienceOptions.find((o) => String(o.value) === totalExperienceYears)?.label ?? "";
  const levelLabel = yourLevelOptions.find((l) => l.value === roleLevel)?.label ?? "";
  // The profile read back to the candidate in plain English -- shown on the last
  // step (and on the success screen) so they can see what recruiters will see.
  const story = (() => {
    if (!category || !roleLevel) return "";
    const who = `${levelLabel}${isLeadLevel && teamSize ? ` leading ${teamSize} people` : ""}${expLabel ? `, ${expLabel.toLowerCase()} in` : ""}`;
    const what = isSalesCategory(category) ? soldNow.slice(0, 2).join(" and ") : practice;
    const to = segments.length ? `, selling to ${segments.slice(0, 3).join(", ")}` : "";
    const result = hasSalesStep && attainment && targetBand ? ` Last year you hit ${attainment} of a ${targetBand} ${quotaWord} target.` : "";
    return `${who} ${what}${to}.${result}`.replace(/\s+/g, " ").trim();
  })();

  const STEP_COPY: Record<number, { label: string; title: string; blurb: string }> = {
    0: { label: "You", title: "Let's start with your CV", blurb: "Upload it and we'll fill in what we can. You just confirm." },
    1: { label: "Role", title: first ? `Nice to meet you, ${first}` : "Tell us about your role", blurb: "A few taps. This is how recruiters picture you." },
    2: { label: "Sales", title: "The part recruiters read first", blurb: "Be specific. Specific profiles get shortlisted." },
    3: { label: "Move", title: "What you want next", blurb: "So we only bring you roles worth your time." },
  };
  const copy = STEP_COPY[stepId];
  const dealBands = dealSizeBandsFor(category || null, dealCurrency);
  const targetBands = revenueTargetBandOptionsFor("Annual", targetCurrency);
  const soldGroups: PickerGroup[] = category === "b2c_sales" ? b2cSoldGroups : b2bSoldGroups;
  const motionGroups =
    category === "b2c_sales"
      ? [{ group: "How do you sell?", options: b2cMotionChoices }]
      : b2bSalesMotionTypeGroups.map((g) => ({ group: g.group, options: [...g.options] }));
  const salesWord = category === "b2c_sales" ? "ticket size" : "deal size";
  const ringPct = Math.min(100, strength);
  const showEarlier = soldBefore.length > 0 || earlierOpen;

  return (
    <>
      <style>{`
@keyframes siIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.si-step{animation:siIn .45s cubic-bezier(.22,1,.36,1) both}
.si-form input:not([type=checkbox]):not([type=file]),.si-form select{height:2.9rem;border-radius:.85rem;border:1px solid #e2e8f0;background-color:#fff;padding-left:.95rem;font-size:.95rem;transition:border-color .2s,box-shadow .2s}
.si-form input:not([type=checkbox]):not([type=file]):hover,.si-form select:hover{border-color:#cbd5e1}
.si-form input:not([type=checkbox]):not([type=file]):focus,.si-form select:focus{outline:none;border-color:#0f172a;box-shadow:0 0 0 4px rgba(15,23,42,.06)}
.si-form input.si-phone:not([type=checkbox]):not([type=file]){padding-left:3rem}
.si-form label>span:first-child{font-size:1rem;font-weight:600;letter-spacing:-.01em;color:#0f172a}
.si-form input[type=checkbox]{accent-color:#0f172a}
.si-form button{-webkit-tap-highlight-color:transparent}
.si-form details>summary::-webkit-details-marker{display:none}
`}</style>
      <form ref={formRef} onSubmit={handleSubmit} className="si-form mx-auto grid max-w-xl scroll-mt-24 gap-7">
        {signedIn && existing && (
          <p className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">
            <Sparkles className="h-3.5 w-3.5" />
            We&apos;ve pre-filled what we already have. Just complete the blanks.
          </p>
        )}

        <div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5" aria-hidden>
              {stepIds.map((id, i) => (
                <span key={id} className="h-1 w-10 overflow-hidden rounded-full bg-slate-200">
                  <span className={`block h-full rounded-full bg-slate-900 transition-[width] duration-500 ease-out ${i <= pos ? "w-full" : "w-0"}`} />
                </span>
              ))}
            </div>
            <span className="text-xs font-medium tabular-nums text-slate-400">Profile strength {ringPct}%</span>
          </div>
          <p className="mt-5 text-xs font-medium uppercase tracking-widest text-slate-400">
            {pos + 1} of {stepIds.length} · {copy.label}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{copy.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{copy.blurb}</p>
        </div>

        <div key={stepId} className="si-step grid gap-6">
        {stepId === 0 && (
          <div className="grid gap-5">
            <FormField label="Resume" required={!hasExistingResume}>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-sm text-slate-600 transition hover:border-slate-400 hover:bg-slate-50">
                <FileText className="h-5 w-5 shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1 truncate">
                  {resumeFile ? resumeFile.name : hasExistingResume ? "Resume on file. Choose a file to replace it" : "Tap to upload PDF or Word (.pdf, .doc, .docx)"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => void handleResumeChange(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              {resumeParsing && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" /> Reading your resume…
                </p>
              )}
              {!resumeParsing && readSummary.length > 0 && (
                <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Here&apos;s what we picked up
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {readSummary.map((t) => (
                      <span key={t} className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
                    className="si-phone"
                  />
                </div>
              </FormField>
              <FormField label="Email">
                <Input value={email} disabled className="bg-slate-50 text-slate-500" />
              </FormField>
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
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={whatsappOptIn} onChange={(e) => setWhatsappOptIn(e.target.checked)} className="mt-0.5" />
              Send me matching roles and interview reminders on WhatsApp (optional).
            </label>
          </div>
        )}

        {stepId === 1 && (
          <div className="grid gap-6">
            <Group label="I work in" required>
              <Chips
                value={category}
                options={categoryOptions.map((o) => ({ value: o.value, label: o.label }))}
                onChange={(v) => {
                  setCategory(v as CategoryValue);
                  setPractice("");
                  setSoldNow([]);
                  setSoldBefore([]);
                  setMotions([]);
                  setDealBand("");
                }}
              />
            </Group>

            {category === "non_sales" && (
              <Group label="Your function" required>
                <Chips value={practice} options={practiceOptions.map((o) => ({ value: o, label: o }))} onChange={setPractice} />
              </Group>
            )}

            {isSalesCategory(category) && (
              <>
                <Group label="What do you sell today?" required>
                  <GroupedPicker
                    groups={soldGroups}
                    selected={soldNow}
                    onChange={setSoldNow}
                    hidden={soldBefore}
                    max={3}
                    placeholder={category === "b2c_sales" ? "Search, e.g. insurance, EdTech, loans" : "Search, e.g. SaaS, cybersecurity, automation"}
                  />
                  <p className="text-xs text-slate-400">Pick up to 3. The first one is your main.</p>
                </Group>
                <div className="grid gap-2">
                  {!showEarlier ? (
                    <button
                      type="button"
                      onClick={() => setEarlierOpen(true)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3.5 text-left transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-900 text-lg leading-none text-white">+</span>
                      <span>
                        <span className="block text-[15px] font-semibold text-slate-900">Add what you sold earlier</span>
                        <span className="block text-xs text-slate-500">Past products and industries show your range to recruiters.</span>
                      </span>
                    </button>
                  ) : (
                    <Group label="What did you sell earlier? (optional)">
                      <GroupedPicker
                        groups={soldGroups}
                        selected={soldBefore}
                        onChange={setSoldBefore}
                        hidden={soldNow}
                        placeholder="Search earlier products or industries"
                      />
                    </Group>
                  )}
                </div>
              </>
            )}

            <Group label="Your role level" required>
              <Chips
                value={roleLevel}
                options={yourLevelOptions
                  .filter((l) => !l.salesOnly || isSalesCategory(category))
                  .map((l) => ({ value: l.value, label: l.value === "IC" && category === "non_sales" ? "Individual Contributor" : l.label }))}
                onChange={(v) => {
                  setRoleLevel(v);
                  const lead = yourLevelOptions.find((l) => l.value === v)?.lead;
                  setRoleType(lead ? "Leading a Team" : "Individual Contributor (IC)");
                  if (!lead) setTeamSize("");
                }}
              />
            </Group>
            {isLeadLevel && (
              <Group label="How big is your team?" required>
                <Chips value={teamSize} options={teamSizeOptions.slice(0, 9).map((o) => ({ value: o, label: o }))} onChange={setTeamSize} />
              </Group>
            )}

            <FormField label="Total experience" required>
              <Select value={totalExperienceYears} onChange={(e) => setTotalExperienceYears(e.target.value)} className="sm:max-w-[calc(50%-0.5rem)]">
                <option value="">Select</option>
                {experienceOptions.map((o) => (
                  <option key={o.label} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </FormField>
          </div>
        )}

        {stepId === 2 && (
          <div className="grid gap-6">
            {category === "b2b_sales" && (
              <Group label="Your selling style" required>
                <Chips value={sellingStyle} options={sellingStyleOptions.map((o) => ({ value: o, label: o }))} onChange={setSellingStyle} />
              </Group>
            )}
            <Group label="How do you sell? (pick all that apply)" required>
              <div className="grid gap-3">
                {motionGroups.map((g) => (
                  <div key={g.group}>
                    {motionGroups.length > 1 && <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-slate-400">{g.group}</p>}
                    <Chips
                      multi
                      values={motions}
                      options={g.options.map((o) => ({ value: o, label: o }))}
                      onToggle={(v) => setMotions((m) => (m.includes(v) ? m.filter((x) => x !== v) : [...m, v]))}
                    />
                  </div>
                ))}
              </div>
            </Group>
            <Group label="Industries you've sold into" required>
              <GroupedPicker groups={industrySoldGroups} selected={industriesSold} onChange={setIndustriesSold} placeholder="Search, e.g. BFSI, pharma, FMCG" />
            </Group>
            {category === "b2b_sales" && (
              <Group label="Who do you sell to?" required>
                <Chips
                  multi
                  values={segments}
                  options={customerSegmentOptions.map((o) => ({ value: o, label: o }))}
                  onToggle={(v) => setSegments((m) => (m.includes(v) ? m.filter((x) => x !== v) : [...m, v]))}
                />
              </Group>
            )}

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4">
              <p className="flex items-start gap-2 text-[15px] font-medium leading-snug text-slate-700">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                {isLeadLevel
                  ? "You lead a team, so we're asking about your team's target."
                  : "You work as an individual contributor, so we're asking about your own target."}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={`Typical ${salesWord}`} required>
                  <div className="flex gap-2">
                    <Select
                      value={dealCurrency}
                      onChange={(e) => {
                        setDealCurrency(e.target.value as CurrencyValue);
                        setDealBand("");
                      }}
                      className="w-24 shrink-0"
                    >
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <Select value={dealBand} onChange={(e) => setDealBand(e.target.value)}>
                      <option value="">Select</option>
                      {dealBands.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>
                </FormField>
                <FormField label={`Your ${quotaWord} target last year`} required>
                  <div className="flex gap-2">
                    <Select
                      value={targetCurrency}
                      onChange={(e) => {
                        setTargetCurrency(e.target.value as CurrencyValue);
                        setTargetBand("");
                      }}
                      className="w-24 shrink-0"
                    >
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <Select value={targetBand} onChange={(e) => setTargetBand(e.target.value)}>
                      <option value="">Select</option>
                      {targetBands.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>
                </FormField>
              </div>
              <Group label={`How much of it did you hit?`} required>
                <Chips value={attainment} options={achievementBandOptions.map((o) => ({ value: o, label: o }))} onChange={setAttainment} />
              </Group>
            </div>

            <Group label="Tools you've used (optional)">
              <MultiSearch
                selected={tools}
                onChange={setTools}
                search={(q, ex) =>
                  [...crmToolOptions.filter((o) => o !== "Other"), ...salesToolOptions]
                    .filter((o) => o.toLowerCase().includes(q.toLowerCase()) && !ex.includes(o))
                    .slice(0, 8)
                }
                defaults={["Salesforce", "HubSpot", "Zoho CRM", "LinkedIn Sales Navigator", "LeadSquared", "Apollo", "Gong", "Excel / Google Sheets"]}
                placeholder="Search CRMs and sales tools"
              />
            </Group>
            <Group label="Your top skills (optional)">
              <MultiSearch
                selected={skillList}
                onChange={setSkillList}
                search={(q, ex) => searchSkills(q, ex, 8)}
                defaults={["Negotiation", "Solution Selling", "Cold Calling", "Key Account Management", "Closing", "Pipeline Management"]}
                placeholder="Search skills"
                allowCustom
              />
            </Group>
          </div>
        )}

        {stepId === 3 && (
          <div className="grid gap-6">
            <Group label="Where are you right now?" required>
              <Chips value={employmentStatus} options={employmentStatusOptions.map((o) => ({ value: o, label: o }))} onChange={setEmploymentStatus} />
            </Group>
            {employmentStatus === "Serving Notice" && (
              <FormField label="Last working day (optional)">
                <Input type="date" value={lastWorkingDay} onChange={(e) => setLastWorkingDay(e.target.value)} className="sm:max-w-[calc(50%-0.5rem)]" />
              </FormField>
            )}
            <Group label="Can join in" required>
              <Chips value={noticePeriod} options={noticePeriods.map((o) => ({ value: o, label: o }))} onChange={setNoticePeriod} />
            </Group>

            <div className="grid gap-4 rounded-2xl bg-slate-50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Current fixed CTC" required>
                  <Select value={currentFixedCtc} onChange={(e) => setCurrentFixedCtc(e.target.value)}>
                    <option value="">Select</option>
                    {ctcStepOptions(currentFixedCtc).map((o) => (
                      <option key={o.label} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                  {currentFixedCtc !== "" && Number(currentFixedCtc) > 0 && Number(currentFixedCtc) < 121 && (
                    <span className="text-xs text-slate-400">= ₹{Math.round(Number(currentFixedCtc) * 100000).toLocaleString("en-IN")} a year</span>
                  )}
                </FormField>
                <FormField label="Current variable pay" required>
                  <Select value={currentVariableCtc} onChange={(e) => setCurrentVariableCtc(e.target.value)}>
                    <option value="">Select (0 if none)</option>
                    {ctcStepOptions(currentVariableCtc).map((o) => (
                      <option key={o.label} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Expected fixed CTC" required>
                  <Select
                    value={ctcNegotiable ? "" : expectedFixedCtc}
                    onChange={(e) => {
                      setExpectedFixedCtc(e.target.value);
                      if (e.target.value) setCtcNegotiable(false);
                    }}
                    disabled={ctcNegotiable}
                  >
                    <option value="">Select</option>
                    {ctcStepOptions(expectedFixedCtc).map((o) => (
                      <option key={o.label} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                  <label className="mt-1.5 flex items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={ctcNegotiable}
                      onChange={(e) => {
                        setCtcNegotiable(e.target.checked);
                        if (e.target.checked) setExpectedFixedCtc("");
                      }}
                    />
                    Negotiable. I&apos;ll discuss it for the right role. (We&apos;ll start from your current CTC.)
                  </label>
                </FormField>
                <FormField label="Expected variable pay (optional)">
                  <Select value={expectedVariableCtc} onChange={(e) => setExpectedVariableCtc(e.target.value)}>
                    <option value="">Skip</option>
                    {ctcStepOptions(expectedVariableCtc).map((o) => (
                      <option key={o.label} value={o.value ?? ""}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </FormField>
              </div>
            </div>

            <Group label="Open to relocate?" required>
              <Chips value={relocation} options={relocationOptions.map((o) => ({ value: o, label: o }))} onChange={setRelocation} />
            </Group>
            <Group label="Preferred work mode?" required>
              <Chips value={workMode} options={workModeOptions.map((o) => ({ value: o, label: o }))} onChange={setWorkMode} />
            </Group>
            <Group label="Any offer in hand?" required>
              <Chips value={offerInHand} options={["Yes", "No"].map((o) => ({ value: o, label: o }))} onChange={setOfferInHand} />
            </Group>
            {offerInHand === "Yes" && (
              <FormField label="Offer CTC (fixed)" required>
                <Select value={offerCtc} onChange={(e) => setOfferCtc(e.target.value)} className="sm:max-w-[calc(50%-0.5rem)]">
                  <option value="">Select</option>
                  {ctcStepOptions(offerCtc).map((o) => (
                    <option key={o.label} value={o.value ?? ""}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>
            )}

            {story && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400">How your profile reads</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-800">{story}</p>
              </div>
            )}

            <label className="flex items-start gap-2 text-xs text-slate-500">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
              I consent to StaffAnchor storing and sharing my profile with relevant employers.
            </label>
          </div>
        )}
        </div>

        {errorMsg && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorMsg}
            {profileExists && (
              <>
                {" "}
                <a
                  href={`/candidate-login?email=${encodeURIComponent(email)}${mandateId && !accountOnly ? `&returnTo=${encodeURIComponent(`/jobs/${mandateId}`)}` : ""}`}
                  className="font-semibold underline"
                >
                  Sign in
                </a>
              </>
            )}
          </p>
        )}

        <div className="flex items-center gap-3">
          {pos > 0 && (
            <Button type="button" variant="outline" onClick={goBack} className="h-12 shrink-0 rounded-xl">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back
            </Button>
          )}
          {isLast ? (
            <Button type="submit" disabled={submitting || resumeParsing} className="h-12 flex-1 rounded-2xl text-base transition-transform active:scale-[.99]">
              {submitting ? "Submitting…" : mandateId ? "Submit Application" : "Create My Profile"}
            </Button>
          ) : (
            <Button type="submit" disabled={resumeParsing} className="h-12 flex-1 rounded-2xl text-base transition-transform active:scale-[.99]">
              Continue <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        {isLast && (
          <p className="text-center text-[11px] text-slate-400">
            Afterwards you can add LinkedIn, languages and your full career timeline from My Account.
          </p>
        )}
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

// Tap-to-select pills for short option lists. Single-select (value/onChange)
// or multi-select (values/onToggle).
type ChipProps =
  | { multi?: false; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }
  | { multi: true; values: string[]; options: { value: string; label: string }[]; onToggle: (v: string) => void };

function Chips(props: ChipProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {props.options.map((o) => {
        const on = props.multi ? props.values.includes(o.value) : props.value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => (props.multi ? props.onToggle(o.value) : props.onChange(o.value))}
            className={`rounded-full border px-4 py-2 text-left text-[15px] transition-all duration-200 active:scale-95 ${
              on
                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// Like FormField but a div, so clicking the title never "presses" the first chip
// (a <label> forwards clicks to its first button).
function Group({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 text-sm">
      <span className="text-base font-semibold tracking-tight text-slate-900">
        {label}
        {required ? <span className="text-slate-300"> *</span> : null}
      </span>
      {children}
    </div>
  );
}

// Type-to-search multi-select shown as removable chips. `defaults` are the
// suggestions shown before anything is typed.
function MultiSearch({
  selected,
  onChange,
  search,
  defaults,
  placeholder,
  allowCustom,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
  search: (q: string, exclude: string[]) => string[];
  defaults: string[];
  placeholder: string;
  allowCustom?: boolean;
}) {
  const [q, setQ] = useState("");
  const suggestions = (q.trim() ? search(q.trim(), selected) : defaults.filter((d) => !selected.includes(d))).slice(0, 8);
  const add = (v: string) => {
    const t = v.trim();
    if (t && !selected.includes(t)) onChange([...selected, t]);
    setQ("");
  };
  return (
    <div className="grid gap-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs text-white">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(selected.filter((x) => x !== t))} className="text-slate-300 hover:text-white">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (suggestions[0] && q.trim()) add(suggestions[0]);
            else if (allowCustom) add(q);
          }
        }}
        placeholder={placeholder}
      />
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => add(o)}
              className="rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:border-blue-400 hover:bg-blue-50"
            >
              + {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Grouped, searchable multi-select: pills for what's picked, a search box, and
// the full list as collapsible groups. `hidden` options (picked elsewhere) are
// left out; `max` caps the number of picks.
function GroupedPicker({
  groups,
  selected,
  onChange,
  placeholder,
  hidden = [],
  max,
}: {
  groups: PickerGroup[];
  selected: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  hidden?: string[];
  max?: number;
}) {
  const [q, setQ] = useState("");
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const ql = q.trim().toLowerCase();
  const toggle = (v: string) => {
    if (selected.includes(v)) onChange(selected.filter((x) => x !== v));
    else if (!max || selected.length < max) onChange([...selected, v]);
  };
  const full = !!max && selected.length >= max;
  const chip = (o: string) => {
    const on = selected.includes(o);
    return (
      <button
        key={o}
        type="button"
        aria-pressed={on}
        disabled={!on && full}
        onClick={() => toggle(o)}
        className={`rounded-full border px-3.5 py-1.5 text-left text-sm transition-all duration-200 active:scale-95 disabled:opacity-40 ${
          on ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
        }`}
      >
        {o}
      </button>
    );
  };
  const matches = ql
    ? groups.flatMap((g) => g.options).filter((o) => o.toLowerCase().includes(ql) && !hidden.includes(o)).slice(0, 14)
    : [];
  return (
    <div className="grid gap-2.5">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t, i) => (
            <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-1.5 text-sm text-white">
              {t}
              {i === 0 && max ? <span className="rounded bg-white/20 px-1 text-[10px] uppercase tracking-wide">main</span> : null}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => onChange(selected.filter((x) => x !== t))} className="text-slate-300 hover:text-white">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
      {ql ? (
        <div className="flex flex-wrap gap-1.5">
          {matches.length ? matches.map(chip) : <p className="text-xs text-slate-400">No match. Try a broader word.</p>}
        </div>
      ) : (
        <div className="grid gap-2">
          {groups.map((g) => {
            const opts = g.options.filter((o) => !hidden.includes(o));
            if (!opts.length) return null;
            const n = opts.filter((o) => selected.includes(o)).length;
            const isOpen = openGroups.includes(g.group);
            return (
              <div key={g.group} className="rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-300">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenGroups((o) => (o.includes(g.group) ? o.filter((x) => x !== g.group) : [...o, g.group]))}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-[15px] font-medium text-slate-800"
                >
                  {g.group}
                  <span className="flex items-center gap-2 text-xs font-normal text-slate-400">
                    {n > 0 ? <span className="rounded-full bg-slate-900 px-2 py-0.5 text-white">{n}</span> : opts.length}
                    <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </button>
                <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <div className="overflow-hidden">
                    <div className="flex flex-wrap gap-2 px-4 pb-4">{opts.map(chip)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
