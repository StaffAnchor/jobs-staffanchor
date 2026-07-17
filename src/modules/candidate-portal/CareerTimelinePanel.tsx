"use client";

import { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  industryOptions,
  customerSegmentOptions,
  dealSizeBandsFor,
  salesCycleOptions,
  sellingStyleOptions,
  salesMotionOptions,
  b2cSalesMotionOptions,
  clientProfileOptions,
  b2cCustomerTypeOptions,
  insideSalesSubDomains,
  ahtOptions,
  dailyCallTargetOptions,
  dailyTalkTimeOptions,
  leadSourceOptions,
  teamSizeOptions,
  renewalRateBandOptions,
  winRateBandOptions,
  geographicScopeOptions,
  reasonForLeavingOptions,
  avgQuarterlyTargetBandOptions,
  currencyOptions,
  level1OptionsForProfileType,
  industrialSubDomains,
  type CategoryValue,
  type CurrencyValue,
} from "@/modules/apply/options";

// Industrial & Infrastructure practice-specific option sets -- only rendered
// when this entry's sub_domain (now the Level 1 Practice, see below) is
// "Industrial & Infrastructure". Territory/channel/account-type/complexity
// have no B2B-generic equivalent, so these are new fields, not a relabel.
const territoryRegionOptions = ["North", "South", "West", "East", "Pan-India", "International"];
const commercialRouteOptions = ["Direct Field", "Channel / Distributor", "Hybrid"];
const targetAccountTypeOptions = ["OEMs", "EPC Contractors", "Government / PSU", "Industrial End-Users", "Distributors"];
const productComplexityOptions = ["Standard Catalog Products", "Engineered / Customized Technical Solutions"];
void industrialSubDomains; // reserved: available if a future pass wants Level-2 tagging within this practice
import {
  mergeTimelines,
  computeStabilityScore,
  computeDomainConsistencyScore,
  computeCareerGaps,
  type ProfileTimelineEntry,
  type ResumeTimelineEntry,
} from "@/lib/career-timeline";

// Controlled component: this used to own its own Supabase read/write
// (candidateId + immediate per-role .update() calls), rendered as a
// separate always-visible panel below the "Build Your Profile" wizard. It
// is now Step 2 of that same wizard (see ApplyForm.tsx) -- entries live in
// the wizard's own `values.careerTimeline` state and are only persisted for
// real when the whole wizard is submitted, exactly like every other field.
// This avoids the previous confusing UX where "Passport Readiness" moved on
// one part of the screen while Career Timeline silently saved itself below.

const CATEGORY_OPTIONS: { value: ProfileTimelineEntry["category"]; label: string }[] = [
  { value: "b2b_sales", label: "B2B Sales" },
  { value: "b2c_sales", label: "B2C Sales" },
  { value: "non_sales", label: "Non-Sales / Other" },
];

// Now returns Level 1 (Practice / Vertical / Function) per the unified
// taxonomy, not the old flat sub-domain list -- `sub_domain` on this entry
// holds that Level 1 value going forward (e.g. "Enterprise Tech Sales &
// Revenue", "Retail", "Marketing"). Level 2 (SaaS vs. Cybersecurity, etc.
// within a B2B practice) is deliberately not a separate field here -- the
// existing Industry / Current Industry selector below already captures that
// granularity (e.g. "SaaS / Cloud Software" is already an industryOptions
// entry), so it isn't duplicated as a second dropdown.
function subDomainsFor(category: string): string[] {
  return level1OptionsForProfileType(category as CategoryValue | null);
}

function emptyEntry(): ProfileTimelineEntry {
  return {
    id: crypto.randomUUID(),
    company: "",
    title: "",
    category: "",
    sub_domain: "",
    industry: "",
    customer_segment: "",
    deal_size_band: "",
    sales_cycle: "",
    selling_style: "",
    team_size: "",
    start_month: "",
    end_month: null,
    revenue_generated: "",
    quota_attainment_band: "",
    largest_deal_band: "",
    largest_deal_currency: "",
    new_logos_count: "",
    renewal_rate_band: "",
    win_rate_band: "",
    reporting_to: "",
    client_tier: "",
    geo_scope: "",
    sales_motion: "",
    decision_maker_persona: "",
    customer_type: "",
    territory_region: "",
    commercial_route: "",
    target_account_type: "",
    product_complexity: "",
    aht: "",
    daily_call_target: "",
    daily_talk_time: "",
    lead_source: "",
    reason_for_leaving: "",
    avg_quarterly_target_band: "",
    avg_quarterly_revenue_value: "",
    avg_quarterly_revenue_currency: "",
    target_currency: "",
    target_q1: "",
    target_q2: "",
    target_q3: "",
    target_q4: "",
    achieved_q1: "",
    achieved_q2: "",
    achieved_q3: "",
    achieved_q4: "",
    has_ic_target_too: "",
    ic_target_currency: "",
    ic_target_q1: "",
    ic_target_q2: "",
    ic_target_q3: "",
    ic_target_q4: "",
    ic_achieved_q1: "",
    ic_achieved_q2: "",
    ic_achieved_q3: "",
    ic_achieved_q4: "",
    best_win: "",
    tough_loss: "",
  };
}

function monthLabel(m: string | null): string {
  if (!m) return "Present";
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function CareerTimelinePanel({
  entries,
  onChange,
  currentEmployer,
  resumeEntries,
}: {
  entries: ProfileTimelineEntry[];
  onChange: (next: ProfileTimelineEntry[]) => void;
  currentEmployer: string | null;
  resumeEntries: ResumeTimelineEntry[];
}) {
  const profileEntries = entries ?? [];
  const [form, setForm] = useState<ProfileTimelineEntry | null>(null);
  const [dealCurrency, setDealCurrency] = useState<CurrencyValue>("INR");
  const [error, setError] = useState("");

  const merged = useMemo(() => mergeTimelines(profileEntries, resumeEntries), [profileEntries, resumeEntries]);
  const stability = useMemo(() => computeStabilityScore(merged), [merged]);
  const domainConsistency = useMemo(() => computeDomainConsistencyScore(profileEntries), [profileEntries]);
  const gaps = useMemo(
    () => computeCareerGaps({ profileEntries, resumeEntries, currentEmployer }),
    [profileEntries, resumeEntries, currentEmployer]
  );

  const stabilityScore = stability?.score ?? null;
  const stabilityLabel = stability?.label;
  const domainScore = domainConsistency?.score ?? null;

  function set<K extends keyof ProfileTimelineEntry>(key: K, value: ProfileTimelineEntry[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  // Purely local state updates now -- no network call, no candidateId. The
  // wizard's own submit (or its background progressive-save) is what
  // actually persists this array, exactly like every other field on the form.
  // Validates + persists the current `form` into the timeline array.
  // Returns true on success (caller decides what to do next -- close the
  // form, or immediately open a fresh blank one), false if validation failed
  // (setError has already been called; form stays open so the candidate can fix it).
  function saveCurrentEntry(): boolean {
    if (!form) return false;
    if (!form.company.trim() || !form.start_month) {
      setError("Company and start month are required.");
      return false;
    }
    const isCurrent = form.end_month === null;
    const isSales = form.category === "b2b_sales" || form.category === "b2c_sales";
    // Quarterly target/achievement + "do you also carry an individual quota"
    // used to be validated here, but that whole grid moved off the per-role
    // Career Timeline entry and into the profile-level Stage 3 "Revenue
    // Snapshot" step in ApplyForm.tsx (Unified Candidate Intake restructure)
    // -- it's no longer collected on this entry at all, so there's nothing
    // left to validate for it here.
    if (isCurrent && isSales) {
      if ((form.best_win ?? "").trim().length < 100) {
        setError("Your best win needs at least 100 characters — specific numbers help recruiters most.");
        return false;
      }
      if ((form.tough_loss ?? "").trim().length < 100) {
        setError("Your missed-target reflection needs at least 100 characters.");
        return false;
      }
    }
    if (!isCurrent && isSales) {
      if (!(form.avg_quarterly_revenue_value ?? "").trim()) {
        setError("Please enter an average quarterly revenue figure for this role.");
        return false;
      }
      if (!/^\d+$/.test((form.avg_quarterly_revenue_value ?? "").trim())) {
        setError("Average quarterly revenue should be numbers only.");
        return false;
      }
      if (!form.avg_quarterly_revenue_currency) {
        setError("Please select a currency for the average quarterly revenue.");
        return false;
      }
    }
    setError("");
    const exists = profileEntries.some((e) => e.id === form.id);
    const next = exists ? profileEntries.map((e) => (e.id === form.id ? form : e)) : [...profileEntries, form];
    onChange(next);
    return true;
  }

  function handleSaveForm() {
    if (saveCurrentEntry()) setForm(null);
  }

  // Round 9 follow-up: previously the "+ Add a role" trigger only appeared
  // after the current role was saved and the form closed, which candidates
  // read as "I have to finish this one before I can even start the next" --
  // confusing when they're mid-way through their latest role and already
  // thinking about the one before it. This lets them save the role they're
  // on and jump straight into a blank one without closing the panel.
  function handleSaveAndAddAnother() {
    if (saveCurrentEntry()) startAdd();
  }

  function handleDelete(id: string) {
    if (!window.confirm("Remove this role from your timeline?")) return;
    onChange(profileEntries.filter((e) => e.id !== id));
  }

  function startAdd(prefill?: Partial<ProfileTimelineEntry>) {
    setError("");
    setForm({ ...emptyEntry(), ...prefill });
  }

  function startEdit(entry: ProfileTimelineEntry) {
    setError("");
    setForm({ ...entry });
  }

  const isSalesCategory = form?.category === "b2b_sales" || form?.category === "b2c_sales";
  const isB2B = form?.category === "b2b_sales";
  const isB2C = form?.category === "b2c_sales";
  const isIndustrial = isB2B && form?.sub_domain === "Industrial & Infrastructure";
  const isCurrentRole = form?.end_month === null;
  const isInsideSalesRole = !!form?.sub_domain && insideSalesSubDomains.includes(form.sub_domain);
  const isTeamLead = !!form?.team_size;

  return (
    <Card className="rounded-2xl border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_14px_32px_-18px_rgba(15,23,42,0.14)]">
      <CardContent className="space-y-4 py-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <BriefcaseBusiness className="h-4 w-4 text-slate-400" /> Career Timeline
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Add each role you&apos;ve held so recruiters can see your full job history at a glance. If you&apos;ve
          uploaded a resume, we also pull roles from it automatically below.
        </p>

        {/* Stability / Domain consistency scores are recruiter-facing signals
            (surfaced in the CRM instead) -- deliberately not shown here so a
            candidate doesn't see themselves labelled "Frequent Job-Hopper"
            on their own form. stabilityScore/domainScore are still computed
            above since other logic in this component may reference them. */}
        {void stabilityScore}
        {void stabilityLabel}
        {void domainScore}

        {/* Genuine mismatches/discrepancies (title or dates disagree between
            resume and confirmed profile, or the flat current_employer field
            doesn't match) still get an amber flag -- those actually need the
            candidate's attention. "Not yet added to profile" is just a
            suggestion, not a warning, so it's handled separately below in one
            calm, non-duplicated list instead of showing twice. */}
        {gaps.filter((g) => g.type !== "resume_not_in_profile").length > 0 && (
          <div className="space-y-1.5">
            {gaps
              .filter((g) => g.type !== "resume_not_in_profile")
              .map((gap, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <p className="flex-1 text-xs text-amber-800">{gap.message}</p>
                </div>
              ))}
          </div>
        )}

        {resumeEntries.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              From your resume <span className="font-normal normal-case text-slate-400">(not yet added)</span>
            </h4>
            <div className="space-y-1.5">
              {resumeEntries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {e.title || "Role"} <span className="font-normal text-slate-400">at {e.company}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {monthLabel(e.start_month)} – {monthLabel(e.end_month)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      startAdd({
                        company: e.company,
                        title: e.title,
                        start_month: e.start_month || "",
                        end_month: e.end_month,
                      })
                    }
                    className="shrink-0 rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:border-blue-300 hover:bg-blue-50"
                  >
                    Add to profile
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Confirmed roles <span className="text-red-500">*</span> <span className="font-normal normal-case text-slate-400">required</span>
          </h4>
          {profileEntries.length === 0 && (
            <div className="mb-2 rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-3 shadow-sm">
              <p className="text-sm font-bold text-blue-900">
                A complete career timeline is the #1 thing that gets you shortlisted.
              </p>
              <p className="mt-1 text-xs font-medium text-blue-800">
                Recruiters skip past thin profiles. Add every role you've held — most recent first — and give your
                current role's real numbers. This is the single highest-leverage thing you can do on this form.
              </p>
              <p className="mt-2 text-sm font-semibold text-blue-900">
                Let&apos;s start with your recent job — add it below.
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            {[...profileEntries]
              .sort((a, b) => (a.start_month < b.start_month ? 1 : -1))
              .map((e) => (
                <div key={e.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {e.title || "Role"} <span className="font-normal text-slate-400">at {e.company}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {monthLabel(e.start_month)} – {monthLabel(e.end_month)}
                        {e.sub_domain ? ` · ${e.sub_domain}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => startEdit(e)} className="p-1 text-slate-400 hover:text-blue-600">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(e.id)} className="p-1 text-slate-400 hover:text-red-600">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        {!form ? (
          <Button type="button" variant="outline" onClick={() => startAdd()} className="w-full sm:w-auto">
            <Plus className="mr-1.5 h-4 w-4" /> Add a role
          </Button>
        ) : (
          <div className="space-y-2.5 rounded-lg border border-slate-200 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Company</label>
                <Input value={form.company} onChange={(e) => set("company", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Title</label>
                <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Start month</label>
                <Input type="month" value={form.start_month} onChange={(e) => set("start_month", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">End month</label>
                <Input
                  type="month"
                  value={form.end_month ?? ""}
                  disabled={form.end_month === null}
                  onChange={(e) => set("end_month", e.target.value || null)}
                />
                <label className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={form.end_month === null}
                    onChange={(e) => set("end_month", e.target.checked ? null : "")}
                  />
                  Current role
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Function / Domain</label>
                <Select
                  value={form.category}
                  onChange={(e) => set("category", e.target.value as ProfileTimelineEntry["category"])}
                >
                  <option value="">Select...</option>
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Sub-domain</label>
                <Select value={form.sub_domain} onChange={(e) => set("sub_domain", e.target.value)} disabled={!form.category}>
                  <option value="">Select...</option>
                  {subDomainsFor(form.category).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Industry</label>
              <Select value={form.industry} onChange={(e) => set("industry", e.target.value)}>
                <option value="">Select...</option>
                {industryOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </div>

            {isSalesCategory && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Customer segment</label>
                    <Select value={form.customer_segment} onChange={(e) => set("customer_segment", e.target.value)}>
                      <option value="">Select...</option>
                      {customerSegmentOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Sales cycle</label>
                    <Select value={form.sales_cycle} onChange={(e) => set("sales_cycle", e.target.value)}>
                      <option value="">Select...</option>
                      {salesCycleOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Selling style</label>
                    <Select value={form.selling_style} onChange={(e) => set("selling_style", e.target.value)}>
                      <option value="">Select...</option>
                      {sellingStyleOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Deal size</label>
                    <div className="grid grid-cols-[80px_1fr] gap-1.5">
                      <Select
                        value={dealCurrency}
                        onChange={(e) => setDealCurrency(e.target.value as CurrencyValue)}
                      >
                        {currencyOptions.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                      <Select value={form.deal_size_band} onChange={(e) => set("deal_size_band", e.target.value)}>
                        <option value="">Select...</option>
                        {dealSizeBandsFor(form.category as CategoryValue, dealCurrency).map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                </div>

                {isIndustrial && (
                  <div className="space-y-2 rounded-lg border border-dashed border-slate-200 p-2.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Industrial &amp; Infrastructure specifics
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Territory / Region</label>
                        <Select value={form.territory_region ?? ""} onChange={(e) => set("territory_region", e.target.value)}>
                          <option value="">Select...</option>
                          {territoryRegionOptions.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Commercial route</label>
                        <Select value={form.commercial_route ?? ""} onChange={(e) => set("commercial_route", e.target.value)}>
                          <option value="">Select...</option>
                          {commercialRouteOptions.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Target account type</label>
                        <Select value={form.target_account_type ?? ""} onChange={(e) => set("target_account_type", e.target.value)}>
                          <option value="">Select...</option>
                          {targetAccountTypeOptions.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Product complexity</label>
                        <Select value={form.product_complexity ?? ""} onChange={(e) => set("product_complexity", e.target.value)}>
                          <option value="">Select...</option>
                          {productComplexityOptions.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Sales motion</label>
                    <Select value={form.sales_motion ?? ""} onChange={(e) => set("sales_motion", e.target.value)}>
                      <option value="">Select...</option>
                      {(isB2C ? b2cSalesMotionOptions : salesMotionOptions).map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {isB2B && (
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Who you sold to (decision-maker)</label>
                      <Select
                        value={form.decision_maker_persona ?? ""}
                        onChange={(e) => set("decision_maker_persona", e.target.value)}
                      >
                        <option value="">Select...</option>
                        {clientProfileOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                  {isB2C && (
                    <div>
                      <label className="mb-1 block text-xs text-slate-500">Customer type</label>
                      <Select value={form.customer_type ?? ""} onChange={(e) => set("customer_type", e.target.value)}>
                        <option value="">Select...</option>
                        {b2cCustomerTypeOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                </div>

                {isInsideSalesRole && (
                  <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Inside sales detail
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Average handling time (AHT)</label>
                        <Select value={form.aht ?? ""} onChange={(e) => set("aht", e.target.value)}>
                          <option value="">Select...</option>
                          {ahtOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Daily call target</label>
                        <Select
                          value={form.daily_call_target ?? ""}
                          onChange={(e) => set("daily_call_target", e.target.value)}
                        >
                          <option value="">Select...</option>
                          {dailyCallTargetOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Daily talk time</label>
                        <Select
                          value={form.daily_talk_time ?? ""}
                          onChange={(e) => set("daily_talk_time", e.target.value)}
                        >
                          <option value="">Select...</option>
                          {dailyTalkTimeOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-slate-500">Primary lead source</label>
                        <Select value={form.lead_source ?? ""} onChange={(e) => set("lead_source", e.target.value)}>
                          <option value="">Select...</option>
                          {leadSourceOptions.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="mb-1 block text-xs text-slate-500">Team size led (if any)</label>
              <Select value={form.team_size} onChange={(e) => set("team_size", e.target.value)}>
                <option value="">Individual contributor / not applicable</option>
                {teamSizeOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </div>

            <div className="border-t border-slate-200 pt-3 mt-1">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Revenue impact{" "}
                <span className="normal-case font-normal text-slate-400">
                  {isCurrentRole
                    ? "-- your target vs. achievement for this role is captured further down, below"
                    : "-- a quick average is fine, exact numbers aren't expected for older roles"}
                </span>
              </p>

              {!isCurrentRole && isSalesCategory && (
                <div className="mb-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Average quarterly revenue generated *
                  </label>
                  <div className="grid grid-cols-[80px_1fr] gap-1.5">
                    <Select
                      value={form.avg_quarterly_revenue_currency || "INR"}
                      onChange={(e) => set("avg_quarterly_revenue_currency", e.target.value)}
                    >
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <Input
                      type="number"
                      placeholder="Full quarter average, not monthly -- numbers only"
                      value={form.avg_quarterly_revenue_value ?? ""}
                      onChange={(e) => set("avg_quarterly_revenue_value", e.target.value)}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    We don't expect exact target/achievement recall for an old role -- just the average revenue you
                    brought in per quarter.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Revenue generated (total for this role)</label>
                  <Input
                    placeholder="e.g. ₹82 Cr"
                    value={form.revenue_generated ?? ""}
                    onChange={(e) => set("revenue_generated", e.target.value)}
                  />
                </div>
                {!isCurrentRole && (
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Average quarterly target (band)</label>
                    <Select
                      value={form.avg_quarterly_target_band ?? ""}
                      onChange={(e) => set("avg_quarterly_target_band", e.target.value)}
                    >
                      <option value="">Select...</option>
                      {avgQuarterlyTargetBandOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Largest deal closed</label>
                  <div className="grid grid-cols-[80px_1fr] gap-1.5">
                    <Select
                      value={form.largest_deal_currency || "INR"}
                      onChange={(e) => set("largest_deal_currency", e.target.value)}
                    >
                      {currencyOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                    <Select value={form.largest_deal_band ?? ""} onChange={(e) => set("largest_deal_band", e.target.value)}>
                      <option value="">Select...</option>
                      {dealSizeBandsFor(form.category as CategoryValue, (form.largest_deal_currency as CurrencyValue) || "INR").map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">New logos won</label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="e.g. 22"
                    value={form.new_logos_count ?? ""}
                    onChange={(e) => set("new_logos_count", e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Renewal rate</label>
                  <Select value={form.renewal_rate_band ?? ""} onChange={(e) => set("renewal_rate_band", e.target.value)}>
                    <option value="">Select...</option>
                    {renewalRateBandOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Win rate</label>
                  <Select value={form.win_rate_band ?? ""} onChange={(e) => set("win_rate_band", e.target.value)}>
                    <option value="">Select...</option>
                    {winRateBandOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="mt-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Reporting to</label>
                  <Input
                    placeholder="e.g. VP Sales"
                    value={form.reporting_to ?? ""}
                    onChange={(e) => set("reporting_to", e.target.value)}
                  />
                </div>
                {/* "Client tier" removed (Round 9 follow-up) -- it was a duplicate
                    of "Customer segment" above (same customerSegmentOptions list),
                    which was confusing candidates. client_tier is still a valid
                    field on the type/DB for any existing data, just no longer
                    collected here. */}
              </div>

              <div className={isCurrentRole ? "mt-2" : "mt-2 grid grid-cols-2 gap-2"}>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Geographic scope</label>
                  <Select value={form.geo_scope ?? ""} onChange={(e) => set("geo_scope", e.target.value)}>
                    <option value="">Select...</option>
                    {geographicScopeOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </Select>
                </div>
                {!isCurrentRole && (
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Reason for leaving</label>
                    <Select
                      value={form.reason_for_leaving ?? ""}
                      onChange={(e) => set("reason_for_leaving", e.target.value)}
                    >
                      <option value="">Select...</option>
                      {reasonForLeavingOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {isCurrentRole && isSalesCategory && (
              <div className="border-t border-slate-200 pt-3 mt-1">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Reflections{" "}
                  <span className="normal-case font-normal text-slate-400">
                    -- target vs. achievement numbers now live in the Revenue Snapshot step; this is just the story behind them
                  </span>
                </p>
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-slate-500">Tell us about a target you crushed, and how you did it *</label>
                  <textarea
                    value={form.best_win ?? ""}
                    onChange={(e) => set("best_win", e.target.value)}
                    rows={3}
                    placeholder="Min. 100 characters -- what happened, and how you pulled it off."
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">{(form.best_win ?? "").length} / 500 (min 100)</p>
                </div>
                <div className="mt-2">
                  <label className="mb-1 block text-xs text-slate-500">Tell us about a target you missed, and what you learned *</label>
                  <textarea
                    value={form.tough_loss ?? ""}
                    onChange={(e) => set("tough_loss", e.target.value)}
                    rows={3}
                    placeholder="Min. 100 characters -- what happened, and what you changed afterward."
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">{(form.tough_loss ?? "").length} / 500 (min 100)</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <Button onClick={handleSaveForm} className="flex-1">
                Save role
              </Button>
              <Button variant="outline" onClick={handleSaveAndAddAnother} className="flex-1">
                Save &amp; add another role
              </Button>
              <Button variant="outline" onClick={() => setForm(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
