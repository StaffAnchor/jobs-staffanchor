"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle, LogOut, MapPin, Upload } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { supabase } from "@/lib/supabaseClient";
import { getResumeSignedUrl } from "@/lib/resume";
import ResumePreview from "@/components/common/ResumePreview";
import {
  achievementBandOptions,
  ahtOptions,
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
  internationalRegionOptions,
  leadSourceOptions,
  relocationOptions,
  roleLevelOptions,
  roleTypeOptions,
  salesCycleOptions,
  sellingStyleOptions,
  salesMotionOptions,
  subDomainsForCategory,
  teamSizeOptions,
  travelPreferenceOptions,
  workModeOptions,
  type CategoryValue,
  type CurrencyValue,
} from "@/modules/apply/options";
import {
  budgetLabel,
  categoryLabel,
  experienceLabel,
  timeAgo,
  type JobListing,
} from "@/modules/jobs/api";

export type CandidateProfile = {
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
  segment_data: Record<string, unknown> | null;
  open_to_relocation: string | null;
  work_mode: string | null;
  highest_qualification: string | null;
  skills: string | null;
  self_assessment: { best?: string; lost?: string } | null;
  status: string;
};

function seg(data: Record<string, unknown> | null, key: string): string {
  const v = data?.[key];
  return v === undefined || v === null ? "" : String(v);
}
function segArr(data: Record<string, unknown> | null, key: string): string[] {
  const v = data?.[key];
  return Array.isArray(v) ? v.map(String) : [];
}
function segNumArr(data: Record<string, unknown> | null, key: string): string[] {
  const v = data?.[key];
  return Array.isArray(v) ? v.map((n) => String(n)) : ["", "", "", ""];
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"
      }`}
    >
      {children}
    </button>
  );
}

export default function ProfileEditor({
  profile: initialProfile,
  openJobs = [],
}: {
  profile: CandidateProfile;
  openJobs?: JobListing[];
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [cityChoice, setCityChoice] = useState(
    initialProfile.current_location && cityOptions.includes(initialProfile.current_location)
      ? initialProfile.current_location
      : initialProfile.current_location
        ? "Other"
        : ""
  );
  const [customCity, setCustomCity] = useState(
    initialProfile.current_location && !cityOptions.includes(initialProfile.current_location)
      ? initialProfile.current_location
      : ""
  );
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeSignedUrl, setResumeSignedUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- Specialization detail fields (mirrors the public Apply form) ----
  const sd = initialProfile.segment_data ?? null;
  const [roleLevel, setRoleLevel] = useState(seg(sd, "role_level"));
  const [roleTypeUI, setRoleTypeUI] = useState<string>(
    seg(sd, "role_type") === "Team Lead" ? "Leading a Team" : seg(sd, "role_type") === "IC" ? "Individual Contributor (IC)" : ""
  );
  const [teamSize, setTeamSize] = useState(seg(sd, "team_size"));
  const [travelPreference, setTravelPreference] = useState(seg(sd, "travel_preference"));
  const [secondarySubDomains, setSecondarySubDomains] = useState<string[]>(initialProfile.secondary_sub_domains ?? []);
  const [industries, setIndustries] = useState<string[]>(initialProfile.industries ?? []);

  const [dealCurrency, setDealCurrency] = useState<CurrencyValue | "">((seg(sd, "deal_size_currency") || seg(sd, "ticket_currency")) as CurrencyValue | "");
  const [dealSizeBand, setDealSizeBand] = useState(seg(sd, "deal_size") || seg(sd, "ticket"));
  const [cycle, setCycle] = useState(seg(sd, "cycle"));
  const [style, setStyle] = useState(seg(sd, "style"));
  const [motion, setMotion] = useState<string[]>(segArr(sd, "motion"));
  const [segmentVal, setSegmentVal] = useState(seg(sd, "segment"));
  const [funnel, setFunnel] = useState(seg(sd, "funnel"));
  const [scope, setScope] = useState(seg(sd, "scope"));
  const [scopeDetail, setScopeDetail] = useState(seg(sd, "scope_detail"));
  const [scopeRegions, setScopeRegions] = useState<string[]>(segArr(sd, "scope_regions"));

  const [aht, setAht] = useState(seg(sd, "aht"));
  const [dailyCallTarget, setDailyCallTarget] = useState(seg(sd, "daily_call_target"));
  const [dailyTalkTime, setDailyTalkTime] = useState(seg(sd, "daily_talk_time"));
  const [leadSources, setLeadSources] = useState<string[]>(segArr(sd, "lead_sources"));

  const [hasIcTarget, setHasIcTarget] = useState(segArr(sd, "ic_targets").length ? "Yes" : "No");
  const [icTargetCurrency, setIcTargetCurrency] = useState<CurrencyValue | "">(seg(sd, "ic_target_currency") as CurrencyValue | "");
  const [teamTargetCurrency, setTeamTargetCurrency] = useState<CurrencyValue | "">(seg(sd, "team_target_currency") as CurrencyValue | "");
  const [icTargets, setIcTargets] = useState<string[]>(segNumArr(sd, "ic_targets"));
  const [quota, setQuota] = useState<string[]>(() => {
    const v = segArr(sd, "quota");
    return v.length ? v : ["", "", "", ""];
  });
  const [teamTargets, setTeamTargets] = useState<string[]>(segNumArr(sd, "team_targets"));
  const [teamQuota, setTeamQuota] = useState<string[]>(() => {
    const v = segArr(sd, "team_quota");
    return v.length ? v : ["", "", "", ""];
  });

  useEffect(() => {
    if (!initialProfile.resume_file_url) return;
    let cancelled = false;
    getResumeSignedUrl(initialProfile.resume_file_url).then((url) => {
      if (!cancelled) setResumeSignedUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [initialProfile.resume_file_url]);

  const subDomains = useMemo(() => subDomainsForCategory((profile.category as CategoryValue) || null), [profile.category]);
  const isB2B = profile.category === "b2b_sales";
  const isB2C = profile.category === "b2c_sales";
  const isSales = isB2B || isB2C;
  const isInsideSales = insideSalesSubDomains.includes(profile.sub_domain ?? "");
  const isTeamLead = roleTypeUI === "Leading a Team";

  function set<K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }
  function setAssessment(key: "best" | "lost", value: string) {
    setProfile((p) => ({ ...p, self_assessment: { ...(p.self_assessment ?? {}), [key]: value } }));
  }
  function toggle(arr: string[], setArr: (v: string[]) => void, value: string) {
    setArr(arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  // ---- Profile strength: same idea as the public Apply form's sidebar meter ----
  const strengthItems = useMemo(() => {
    const resolvedCity = cityChoice === "Other" ? customCity.trim() : cityChoice;
    const items: { label: string; done: boolean }[] = [
      { label: "Full name", done: !!profile.full_name?.trim() },
      { label: "Phone number", done: !!profile.phone?.trim() },
      { label: "Current city", done: !!resolvedCity },
      { label: "LinkedIn profile", done: !!profile.linkedin_url?.trim() },
      { label: "Resume uploaded", done: !!(profile.resume_file_url || resumeFile) },
      { label: "Current / last employer & title", done: !!profile.current_employer?.trim() && !!profile.current_job_title?.trim() },
      { label: "Employment status", done: !!profile.current_employment_status },
      { label: "Total experience", done: profile.total_experience_years != null },
      { label: "Current fixed CTC", done: profile.current_fixed_ctc != null },
      { label: "Expected fixed CTC", done: profile.expected_fixed_ctc != null },
      { label: "Days to join", done: !!profile.notice_period },
      { label: "Highest qualification", done: !!profile.highest_qualification },
      { label: "Category & sub-domain", done: !!profile.category && !!profile.sub_domain },
      { label: "Role level", done: !!roleLevel },
      { label: "IC / Team Lead", done: !!roleTypeUI },
      { label: "Skills", done: !!profile.skills?.trim() },
      { label: "Industries worked in", done: industries.length > 0 },
      { label: "Work mode preference", done: !!profile.work_mode },
      { label: "Open to relocation", done: !!profile.open_to_relocation },
      { label: "Your best win (write-up)", done: !!profile.self_assessment?.best?.trim() },
      { label: "A missed target (write-up)", done: !!profile.self_assessment?.lost?.trim() },
    ];
    if (isSales) {
      items.push({ label: isB2B ? "Typical deal size" : "Typical ticket size", done: !!dealSizeBand });
      items.push({
        label: "Latest quarter target & achievement",
        done: isTeamLead ? !!teamTargets[3] && !!teamQuota[3] : !!icTargets[3] && !!quota[3],
      });
    }
    if (isInsideSales) {
      items.push({ label: "Average handling time", done: !!aht });
      items.push({ label: "Daily call target", done: !!dailyCallTarget });
    }
    return items;
  }, [
    profile,
    cityChoice,
    customCity,
    resumeFile,
    roleLevel,
    roleTypeUI,
    industries,
    isSales,
    isB2B,
    dealSizeBand,
    isTeamLead,
    teamTargets,
    teamQuota,
    icTargets,
    quota,
    isInsideSales,
    aht,
    dailyCallTarget,
  ]);
  const strengthPct = Math.round((strengthItems.filter((i) => i.done).length / strengthItems.length) * 100);
  const missingItems = strengthItems.filter((i) => !i.done);

  const matchedJobs = useMemo(() => {
    if (!profile.category) return openJobs.slice(0, 5);
    const matches = openJobs.filter((j) => j.category === profile.category);
    return (matches.length ? matches : openJobs).slice(0, 5);
  }, [openJobs, profile.category]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      let resumeFileUrl = profile.resume_file_url;
      if (resumeFile) {
        const path = `${crypto.randomUUID()}-${resumeFile.name}`;
        const { error: uploadError } = await supabase.storage.from("resumes").upload(path, resumeFile, {
          contentType: resumeFile.type || undefined,
        });
        if (uploadError) throw new Error(`Resume upload failed: ${uploadError.message}`);
        resumeFileUrl = path;
      }

      const resolvedCity = cityChoice === "Other" ? customCity.trim() : cityChoice;

      const segmentData: Record<string, unknown> = {
        role_level: roleLevel || undefined,
        role_type: roleTypeUI === "Leading a Team" ? "Team Lead" : roleTypeUI === "Individual Contributor (IC)" ? "IC" : undefined,
        travel_preference: travelPreference || undefined,
      };
      if (isTeamLead && teamSize) segmentData.team_size = teamSize;

      const numOrUndef = (arr: string[]) => {
        const nums = arr.filter((v) => v.trim() !== "").map(Number);
        return nums.length ? nums : undefined;
      };
      const strOrUndef = (arr: string[]) => {
        const vals = arr.filter((v) => v.trim() !== "");
        return vals.length ? vals : undefined;
      };

      if (isTeamLead) {
        segmentData.team_targets = numOrUndef(teamTargets);
        segmentData.team_quota = strOrUndef(teamQuota);
        segmentData.team_target_currency = teamTargetCurrency || undefined;
        if (hasIcTarget === "Yes") {
          segmentData.ic_targets = numOrUndef(icTargets);
          segmentData.quota = strOrUndef(quota);
          segmentData.ic_target_currency = icTargetCurrency || undefined;
        }
      } else {
        segmentData.ic_targets = numOrUndef(icTargets);
        segmentData.quota = strOrUndef(quota);
        segmentData.ic_target_currency = icTargetCurrency || undefined;
      }

      if (isB2B) {
        Object.assign(segmentData, {
          deal_size: dealSizeBand || undefined,
          deal_size_currency: dealCurrency || undefined,
          cycle: cycle || undefined,
          style: style || undefined,
          motion: motion.length ? motion : undefined,
          segment: segmentVal || undefined,
        });
      } else if (isB2C) {
        Object.assign(segmentData, {
          ticket: dealSizeBand || undefined,
          ticket_currency: dealCurrency || undefined,
          funnel: funnel || undefined,
          scope: scope || undefined,
          scope_detail:
            scope === "Single City" || scope === "Multi-City" || scope === "Regional (Multiple States)"
              ? scopeDetail || undefined
              : undefined,
          scope_regions: scope === "International / Global" ? scopeRegions : undefined,
        });
      }

      if (isInsideSales) {
        Object.assign(segmentData, {
          aht: aht || undefined,
          daily_call_target: dailyCallTarget || undefined,
          daily_talk_time: dailyTalkTime || undefined,
          lead_sources: leadSources.length ? leadSources : undefined,
        });
      }

      const { error: updateError } = await supabase
        .from("candidates")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          current_location: resolvedCity || null,
          linkedin_url: profile.linkedin_url,
          resume_file_url: resumeFileUrl,
          current_employer: profile.current_employer,
          current_job_title: profile.current_job_title,
          current_employment_status: profile.current_employment_status,
          total_experience_years: profile.total_experience_years,
          current_fixed_ctc: profile.current_fixed_ctc,
          current_variable_ctc: profile.current_variable_ctc,
          esops_held: profile.esops_held,
          notice_period: profile.notice_period,
          expected_fixed_ctc: profile.expected_fixed_ctc,
          expected_variable_ctc: profile.expected_variable_ctc,
          category: profile.category,
          sub_domain: profile.sub_domain,
          secondary_sub_domains: secondarySubDomains,
          industries,
          segment_data: segmentData,
          open_to_relocation: profile.open_to_relocation,
          work_mode: profile.work_mode,
          highest_qualification: profile.highest_qualification,
          skills: profile.skills,
          self_assessment: profile.self_assessment,
          status: profile.status === "awaiting_input" ? "registered" : profile.status,
        })
        .eq("id", profile.id);

      if (updateError) throw new Error(updateError.message);

      setProfile((p) => ({ ...p, resume_file_url: resumeFileUrl, segment_data: segmentData, secondary_sub_domains: secondarySubDomains, industries }));
      setResumeFile(null);
      setSaved(true);
      toast.success("Profile saved.");
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong. Please try again.";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.assign("/candidate-login");
  }

  const dealBands = dealSizeBandsFor((profile.category as CategoryValue) || null, dealCurrency);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Candidate Portal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Your profile</h1>
          <p className="mt-1 text-sm text-slate-500">Signed in as {profile.email}</p>
        </div>
        <Button variant="outline" onClick={handleSignOut}>
          <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* ---- Sidebar: profile strength + current openings ---- */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="space-y-3 py-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Profile strength</p>
                <span className="text-sm font-bold text-blue-600">{strengthPct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${strengthPct}%` }} />
              </div>
              <p className="text-xs text-slate-500">
                {strengthPct >= 90
                  ? "Excellent — recruiters see you first."
                  : strengthPct >= 60
                    ? "Good. A few more details will help recruiters shortlist you faster."
                    : "Fill in more details so recruiters can match you to the right roles."}
              </p>
              {missingItems.length > 0 && (
                <ul className="space-y-1.5 border-t border-slate-100 pt-3">
                  {missingItems.slice(0, 8).map((item) => (
                    <li key={item.label} className="flex items-center gap-2 text-xs text-slate-500">
                      <Circle className="h-3 w-3 shrink-0 text-slate-300" />
                      {item.label}
                    </li>
                  ))}
                  {missingItems.length > 8 && (
                    <li className="text-xs text-slate-400">+{missingItems.length - 8} more to complete</li>
                  )}
                </ul>
              )}
              {missingItems.length === 0 && (
                <p className="flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Your profile is fully complete
                </p>
              )}
            </CardContent>
          </Card>

          {matchedJobs.length > 0 && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="space-y-3 py-5">
                <p className="text-sm font-semibold text-slate-900">Current openings</p>
                <ul className="space-y-3">
                  {matchedJobs.map((job) => (
                    <li key={job.id} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                      <Link href={`/jobs/${job.id}`} className="block hover:text-blue-700">
                        <p className="text-[13px] font-semibold text-slate-900">{job.role_title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {job.client_display} · {categoryLabel(job.category)}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                          {job.city && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" /> {job.city}
                            </span>
                          )}
                          <span>{experienceLabel(job.experience_min, job.experience_max)}</span>
                          <span>{budgetLabel(job.budget_min, job.budget_max)}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">{timeAgo(job.created_at)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/jobs" className="block text-center text-xs font-medium text-blue-600 hover:underline">
                  View all open jobs →
                </Link>
              </CardContent>
            </Card>
          )}
        </aside>

        {/* ---- Main: profile form ---- */}
        <div>
          <Card className="mb-5">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <FormField label="Full name" className="sm:col-span-2">
                <Input value={profile.full_name ?? ""} onChange={(e) => set("full_name", e.target.value)} />
              </FormField>
              <FormField label="Phone">
                <Input
                  value={profile.phone ?? ""}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  inputMode="numeric"
                />
              </FormField>
              <FormField label="LinkedIn URL">
                <Input value={profile.linkedin_url ?? ""} onChange={(e) => set("linkedin_url", e.target.value)} />
              </FormField>
              <FormField label="Current city">
                <Select value={cityChoice} onChange={(e) => setCityChoice(e.target.value)}>
                  <option value="">Select city</option>
                  {cityOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </FormField>
              {cityChoice === "Other" ? (
                <FormField label="Enter your city">
                  <Input value={customCity} onChange={(e) => setCustomCity(e.target.value)} />
                </FormField>
              ) : (
                cityChoice && <div className="self-end text-sm text-slate-400">State: {cityStateMap[cityChoice] ?? "—"}</div>
              )}

              <FormField label="Resume">
                <div className="flex flex-wrap items-center gap-3">
                  {profile.resume_file_url && !resumeFile && resumeSignedUrl && (
                    <ResumePreview
                      signedUrl={resumeSignedUrl}
                      fileName={profile.resume_file_url.replace(/^resumes\//, "")}
                      label="Preview my resume"
                    />
                  )}
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 px-3 py-1.5 text-[13px] text-slate-600 hover:bg-slate-50">
                    <Upload className="h-3.5 w-3.5" />
                    {resumeFile ? resumeFile.name : "Replace resume"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </FormField>
            </CardContent>
          </Card>

          <Card className="mb-5">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Current role &amp; compensation</h2>
              <FormField label="Current / last employer">
                <Input value={profile.current_employer ?? ""} onChange={(e) => set("current_employer", e.target.value)} />
              </FormField>
              <FormField label="Current job title">
                <Input value={profile.current_job_title ?? ""} onChange={(e) => set("current_job_title", e.target.value)} />
              </FormField>
              <FormField label="Employment status">
                <Select value={profile.current_employment_status ?? ""} onChange={(e) => set("current_employment_status", e.target.value)}>
                  <option value="">Select</option>
                  {employmentStatusOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Total experience">
                <Select
                  value={profile.total_experience_years ?? ""}
                  onChange={(e) => set("total_experience_years", e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select</option>
                  {experienceOptions.map((o) => (
                    <option key={o.label} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Current fixed CTC">
                <Select
                  value={profile.current_fixed_ctc ?? ""}
                  onChange={(e) => set("current_fixed_ctc", e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select</option>
                  {ctcOptions.map((o) => (
                    <option key={o.label} value={o.value ?? ""}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Current variable CTC">
                <Select
                  value={profile.current_variable_ctc ?? ""}
                  onChange={(e) => set("current_variable_ctc", e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select</option>
                  {ctcOptions.map((o) => (
                    <option key={o.label} value={o.value ?? ""}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Expected fixed CTC">
                <Select
                  value={profile.expected_fixed_ctc ?? ""}
                  onChange={(e) => set("expected_fixed_ctc", e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select</option>
                  {ctcOptions.map((o) => (
                    <option key={o.label} value={o.value ?? ""}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Expected variable CTC">
                <Select
                  value={profile.expected_variable_ctc ?? ""}
                  onChange={(e) => set("expected_variable_ctc", e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select</option>
                  {ctcOptions.map((o) => (
                    <option key={o.label} value={o.value ?? ""}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="In how many days can you join?">
                <Select value={profile.notice_period ?? ""} onChange={(e) => set("notice_period", e.target.value)}>
                  <option value="">Select</option>
                  {defaultNoticePeriods.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </Select>
              </FormField>
              <label className="flex items-center gap-2 text-[13px] text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={profile.esops_held ?? false} onChange={(e) => set("esops_held", e.target.checked)} />
                I currently hold ESOPs
              </label>
            </CardContent>
          </Card>

          <Card className="mb-5">
            <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
              <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Specialization &amp; role details</h2>
              <FormField label="Category">
                <Select
                  value={profile.category ?? ""}
                  onChange={(e) => {
                    set("category", e.target.value);
                    set("sub_domain", null);
                  }}
                >
                  <option value="">Select</option>
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Primary sub-domain">
                <Select value={profile.sub_domain ?? ""} onChange={(e) => set("sub_domain", e.target.value)} disabled={!profile.category}>
                  <option value="">Select</option>
                  {subDomains.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Secondary specializations" className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {subDomains
                    .filter((d) => d !== profile.sub_domain)
                    .map((d) => (
                      <Pill key={d} active={secondarySubDomains.includes(d)} onClick={() => toggle(secondarySubDomains, setSecondarySubDomains, d)}>
                        {d}
                      </Pill>
                    ))}
                </div>
              </FormField>
              <FormField label="Role level">
                <Select value={roleLevel} onChange={(e) => setRoleLevel(e.target.value)}>
                  <option value="">Select</option>
                  {roleLevelOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Current role type">
                <Select value={roleTypeUI} onChange={(e) => setRoleTypeUI(e.target.value)}>
                  <option value="">Select</option>
                  {roleTypeOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </FormField>
              {isTeamLead && (
                <FormField label="Team size">
                  <Select value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                    <option value="">Select</option>
                    {teamSizeOptions.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                </FormField>
              )}
              <FormField label="Work mode">
                <Select value={profile.work_mode ?? ""} onChange={(e) => set("work_mode", e.target.value)}>
                  <option value="">Select</option>
                  {workModeOptions.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Open to relocation">
                <Select value={profile.open_to_relocation ?? ""} onChange={(e) => set("open_to_relocation", e.target.value)}>
                  <option value="">Select</option>
                  {relocationOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Travel preference">
                <Select value={travelPreference} onChange={(e) => setTravelPreference(e.target.value)}>
                  <option value="">Select</option>
                  {travelPreferenceOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Highest qualification">
                <Select value={profile.highest_qualification ?? ""} onChange={(e) => set("highest_qualification", e.target.value)}>
                  <option value="">Select</option>
                  {highestQualificationOptions.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Skills" className="sm:col-span-2">
                <Input
                  value={profile.skills ?? ""}
                  onChange={(e) => set("skills", e.target.value)}
                  placeholder="Comma-separated, e.g. Salesforce, Negotiation, Account Management"
                />
              </FormField>
              <FormField label="Industries worked in" className="sm:col-span-2">
                <div className="flex flex-wrap gap-2">
                  {industryOptions.map((i) => (
                    <Pill key={i} active={industries.includes(i)} onClick={() => toggle(industries, setIndustries, i)}>
                      {i}
                    </Pill>
                  ))}
                </div>
              </FormField>
            </CardContent>
          </Card>

          {isSales && (
            <Card className="mb-5">
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">
                  {isB2B ? "B2B sales details" : "B2C sales details"}
                </h2>
                <FormField label="Currency">
                  <Select value={dealCurrency} onChange={(e) => { setDealCurrency(e.target.value as CurrencyValue); setDealSizeBand(""); }}>
                    <option value="">Select</option>
                    {currencyOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label={isB2B ? "Typical deal size" : "Typical ticket size"}>
                  <Select value={dealSizeBand} onChange={(e) => setDealSizeBand(e.target.value)} disabled={!dealCurrency}>
                    <option value="">Select</option>
                    {dealBands.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </FormField>
                {isB2B && (
                  <>
                    <FormField label="Typical sales cycle">
                      <Select value={cycle} onChange={(e) => setCycle(e.target.value)}>
                        <option value="">Select</option>
                        {salesCycleOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Selling style">
                      <Select value={style} onChange={(e) => setStyle(e.target.value)}>
                        <option value="">Select</option>
                        {sellingStyleOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Customer segment">
                      <Select value={segmentVal} onChange={(e) => setSegmentVal(e.target.value)}>
                        <option value="">Select</option>
                        {customerSegmentOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Sales motion" className="sm:col-span-2">
                      <div className="flex flex-wrap gap-2">
                        {salesMotionOptions.map((m) => (
                          <Pill key={m} active={motion.includes(m)} onClick={() => toggle(motion, setMotion, m)}>
                            {m}
                          </Pill>
                        ))}
                      </div>
                    </FormField>
                  </>
                )}
                {isB2C && (
                  <>
                    <FormField label="Funnel stage">
                      <Select value={funnel} onChange={(e) => setFunnel(e.target.value)}>
                        <option value="">Select</option>
                        {funnelStageOptions.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <FormField label="Geographic scope">
                      <Select
                        value={scope}
                        onChange={(e) => {
                          setScope(e.target.value);
                          setScopeDetail("");
                          setScopeRegions([]);
                        }}
                      >
                        <option value="">Select</option>
                        {geographicScopeOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    {scope === "Single City" && (
                      <FormField label="Which city?">
                        <Input value={scopeDetail} onChange={(e) => setScopeDetail(e.target.value)} placeholder="e.g. Mumbai" />
                      </FormField>
                    )}
                    {scope === "Multi-City" && (
                      <FormField label="Which cities?">
                        <Input value={scopeDetail} onChange={(e) => setScopeDetail(e.target.value)} placeholder="e.g. Mumbai, Pune, Nashik" />
                      </FormField>
                    )}
                    {scope === "Regional (Multiple States)" && (
                      <FormField label="Which states?">
                        <Input value={scopeDetail} onChange={(e) => setScopeDetail(e.target.value)} placeholder="e.g. Maharashtra, Gujarat, Goa" />
                      </FormField>
                    )}
                    {scope === "International / Global" && (
                      <FormField label="Which regions?" className="sm:col-span-2">
                        <div className="flex flex-wrap gap-2">
                          {internationalRegionOptions.map((r) => (
                            <Pill key={r} active={scopeRegions.includes(r)} onClick={() => toggle(scopeRegions, setScopeRegions, r)}>
                              {r}
                            </Pill>
                          ))}
                        </div>
                      </FormField>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {isInsideSales && (
            <Card className="mb-5">
              <CardContent className="grid gap-4 p-5 sm:grid-cols-2">
                <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Inside sales details</h2>
                <FormField label="Average handling time (AHT)">
                  <Select value={aht} onChange={(e) => setAht(e.target.value)}>
                    <option value="">Select</option>
                    {ahtOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Daily call target (per user)">
                  <Select value={dailyCallTarget} onChange={(e) => setDailyCallTarget(e.target.value)}>
                    <option value="">Select</option>
                    {dailyCallTargetOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Daily talk-time (hours, per user)">
                  <Select value={dailyTalkTime} onChange={(e) => setDailyTalkTime(e.target.value)}>
                    <option value="">Select</option>
                    {dailyTalkTimeOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Lead source / process" className="sm:col-span-2">
                  <div className="flex flex-wrap gap-2">
                    {leadSourceOptions.map((l) => (
                      <Pill key={l} active={leadSources.includes(l)} onClick={() => toggle(leadSources, setLeadSources, l)}>
                        {l}
                      </Pill>
                    ))}
                  </div>
                </FormField>
              </CardContent>
            </Card>
          )}

          {isSales && (
            <Card className="mb-5">
              <CardContent className="grid gap-4 p-5">
                <h2 className="text-sm font-semibold text-slate-900">Quarterly targets &amp; achievement (last 4 quarters)</h2>
                {isTeamLead && (
                  <>
                    <FormField label="Team target currency" className="max-w-xs">
                      <Select value={teamTargetCurrency} onChange={(e) => setTeamTargetCurrency(e.target.value as CurrencyValue)}>
                        <option value="">Select</option>
                        {currencyOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[0, 1, 2, 3].map((i) => (
                        <FormField key={i} label={`Team target Q${i + 1}`}>
                          <Input
                            type="number"
                            value={teamTargets[i]}
                            onChange={(e) => setTeamTargets((t) => t.map((v, idx) => (idx === i ? e.target.value : v)))}
                          />
                        </FormField>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[0, 1, 2, 3].map((i) => (
                        <FormField key={i} label={`Team achievement Q${i + 1}`}>
                          <Select value={teamQuota[i]} onChange={(e) => setTeamQuota((t) => t.map((v, idx) => (idx === i ? e.target.value : v)))}>
                            <option value="">Select</option>
                            {achievementBandOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                      ))}
                    </div>
                    <FormField label="Do you also carry your own individual target?" className="max-w-xs">
                      <Select value={hasIcTarget} onChange={(e) => setHasIcTarget(e.target.value)}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </Select>
                    </FormField>
                  </>
                )}
                {(!isTeamLead || hasIcTarget === "Yes") && (
                  <>
                    <FormField label="Individual target currency" className="max-w-xs">
                      <Select value={icTargetCurrency} onChange={(e) => setIcTargetCurrency(e.target.value as CurrencyValue)}>
                        <option value="">Select</option>
                        {currencyOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[0, 1, 2, 3].map((i) => (
                        <FormField key={i} label={`Individual target Q${i + 1}`}>
                          <Input
                            type="number"
                            value={icTargets[i]}
                            onChange={(e) => setIcTargets((t) => t.map((v, idx) => (idx === i ? e.target.value : v)))}
                          />
                        </FormField>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[0, 1, 2, 3].map((i) => (
                        <FormField key={i} label={`Individual achievement Q${i + 1}`}>
                          <Select value={quota[i]} onChange={(e) => setQuota((t) => t.map((v, idx) => (idx === i ? e.target.value : v)))}>
                            <option value="">Select</option>
                            {achievementBandOptions.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </Select>
                        </FormField>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="mb-5">
            <CardContent className="grid gap-4 p-5">
              <h2 className="text-sm font-semibold text-slate-900">Self write-up</h2>
              <FormField label="Your best win">
                <Textarea
                  value={profile.self_assessment?.best ?? ""}
                  onChange={(e) => setAssessment("best", e.target.value)}
                  rows={3}
                />
              </FormField>
              <FormField label="A target you missed and why">
                <Textarea
                  value={profile.self_assessment?.lost ?? ""}
                  onChange={(e) => setAssessment("lost", e.target.value)}
                  rows={3}
                />
              </FormField>
            </CardContent>
          </Card>

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saved ? (
              <>
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Saved
              </>
            ) : saving ? (
              "Saving..."
            ) : (
              "Save profile"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
