"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import {
  submitMyMandateRequest,
  getMandateOptionSets,
  EMPTY_OPTION_SETS,
  type MandateOptionSets,
} from "@/modules/client-portal/api";
import MultiSelectChips from "@/modules/client-portal/MultiSelectChips";
import WeekOffPicker, { emptyWeekOffValue, type WeekOffValue } from "@/modules/client-portal/WeekOffPicker";
import {
  b2bSubDomains,
  b2cSubDomains,
  cityOptions,
  teamSizeOptions,
  workModeOptions,
  salesCycleOptions,
  currencyOptions,
  dealSizeBandsFor,
  b2cCustomerTypeOptions,
  clientProfileOptions,
  type CurrencyValue,
  type CategoryValue,
} from "@/modules/apply/options";

// Self-service version of the client-facing mandate-request form: a client
// who already has Client Portal access can submit a new hiring brief
// directly from here, instead of needing a recruiter to generate a one-off
// shareable link first (that link flow, at /mandate-request/[token] on the
// marketing site, remains the path for clients who don't have portal access
// yet). Company name and contact details are resolved from the caller's own
// session server-side -- not entered here -- so this can't be used to
// submit on behalf of a different client. Submission always lands in
// Employer Inquiries for recruiter review, never directly as a live
// mandate.

const WORKING_DAYS_OPTIONS = ["5 days", "5.5 days", "6 days", "Rotational"];
const SHIFT_OPTIONS = ["Day shift", "Night shift (US)", "UK shift", "Rotational shift", "Flexible"];

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-500";
const labelCls = "mb-1.5 block text-[13px] font-medium text-slate-700";

function subDomainsFor(category: string): string[] {
  if (category === "b2b_sales") return b2bSubDomains;
  if (category === "b2c_sales") return b2cSubDomains;
  return [];
}

export default function RequestMandatePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [optionSets, setOptionSets] = useState<MandateOptionSets>(EMPTY_OPTION_SETS);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/client-login");
        return;
      }
      if (!cancelled) setChecking(false);
      try {
        const sets = await getMandateOptionSets();
        if (!cancelled) setOptionSets(sets);
      } catch {
        // Non-fatal -- form still works with empty selling-style/industries/languages lists.
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const [form, setForm] = useState({
    roleTitle: "",
    category: "",
    subDomains: [] as string[],
    cities: [] as string[],
    cityPick: "",
    cityOther: "",
    budgetMin: "",
    budgetMax: "",
    experienceMin: "",
    experienceMax: "",
    hiringReason: "",
    teamHandling: "",
    teamSizeBand: "",
    workMode: "",
    workingDays: "",
    shiftTiming: "",
    reportingManagerTitle: "",
    companySizeBand: "",
    companyHighlightLinks: "",
    salesCycle: "",
    dealSizeCurrency: "" as CurrencyValue | "",
    dealSizeBand: "",
    customerProfile: "",
    expectation3Month: "",
    expectation6Month: "",
    expectation1Year: "",
    sellingStyle: "",
    preferredIndustries: [] as string[],
    industriesSoldTo: [] as string[],
    languagesRequired: [] as string[],
    weekOff: emptyWeekOffValue as WeekOffValue,
    b2cCustomerTypes: [] as string[],
    clientProfile: [] as string[],
    message: "",
  });

  const isSalesRole = form.category === "b2b_sales" || form.category === "b2c_sales";
  const isB2B = form.category === "b2b_sales";
  const isB2C = form.category === "b2c_sales";
  const subDomainOptions = subDomainsFor(form.category);
  const dealSizeOptions = dealSizeBandsFor(
    (form.category || null) as CategoryValue | null,
    form.dealSizeCurrency
  );

  function toggleSubDomain(value: string) {
    setForm((f) => ({
      ...f,
      subDomains: f.subDomains.includes(value) ? f.subDomains.filter((s) => s !== value) : [...f.subDomains, value],
    }));
  }

  function addCity(value: string) {
    const v = value.trim();
    if (!v) return;
    setForm((f) => (f.cities.includes(v) ? f : { ...f, cities: [...f.cities, v] }));
  }

  function removeCity(value: string) {
    setForm((f) => ({ ...f, cities: f.cities.filter((c) => c !== value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await submitMyMandateRequest({
        role_title: form.roleTitle,
        category: form.category,
        sub_domains: form.subDomains,
        cities: form.cities,
        budget_min: form.budgetMin,
        budget_max: form.budgetMax,
        experience_min: form.experienceMin,
        experience_max: form.experienceMax,
        hiring_reason: form.hiringReason,
        team_handling: form.teamHandling,
        team_size_band: form.teamHandling === "team_lead" ? form.teamSizeBand : "",
        work_mode: form.workMode,
        working_days: form.workingDays,
        shift_timing: form.shiftTiming,
        reporting_manager_title: form.reportingManagerTitle,
        company_size_band: form.companySizeBand,
        company_highlight_links: form.companyHighlightLinks
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        sales_cycle: isSalesRole ? form.salesCycle : "",
        deal_size_currency: isSalesRole ? form.dealSizeCurrency : "",
        deal_size_band: isSalesRole ? form.dealSizeBand : "",
        customer_profile: isSalesRole ? form.customerProfile : "",
        expectation_3_month: form.expectation3Month,
        expectation_6_month: form.expectation6Month,
        expectation_1_year: form.expectation1Year,
        selling_style: isSalesRole ? form.sellingStyle : "",
        preferred_industries: form.preferredIndustries,
        industries_sold_to: isSalesRole ? form.industriesSoldTo : [],
        languages_required: form.languagesRequired,
        week_off: form.weekOff.week_off_type === "fixed" ? form.weekOff.week_off : [],
        week_off_type: form.weekOff.week_off_type,
        rotational_offs_per_week: form.weekOff.week_off_type === "rotational" ? form.weekOff.rotational_offs_per_week : "",
        mandatory_working_days: form.weekOff.week_off_type === "rotational" ? form.weekOff.mandatory_working_days : [],
        b2c_customer_types: isB2C ? form.b2cCustomerTypes : [],
        client_profile: isB2B ? form.clientProfile : [],
        message: form.message,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
        <h1 className="mb-2 text-2xl font-semibold text-slate-900">Thank you</h1>
        <p className="text-slate-600">
          We&apos;ve received the hiring details. A recruiter from StaffAnchor will review this shortly and reach out
          to confirm before we begin sourcing.
        </p>
        <Link href="/client-portal" className="mt-6 inline-block text-sm font-medium text-blue-700 hover:underline">
          Back to your roles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/client-portal" className="mb-4 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to your roles
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Request a new role</h1>
      <p className="mb-8 text-sm text-slate-500">
        A few details about the hiring need -- the more context you give us, the faster and more precisely we can
        match candidates. Nothing here is published publicly; a recruiter reviews it before anything goes live.
      </p>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Role title</label>
              <input
                required
                value={form.roleTitle}
                onChange={(e) => setForm((f) => ({ ...f, roleTitle: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>What kind of role is this?</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subDomains: [] }))}
                className={inputCls}
              >
                <option value="">Select...</option>
                <option value="b2b_sales">B2B Sales</option>
                <option value="b2c_sales">B2C Sales</option>
                <option value="non_sales">Other / Non-Sales</option>
              </select>
            </div>

            {form.category && subDomainOptions.length > 0 && (
              <div>
                <label className={labelCls}>More specifically, which of these? (select all that would work)</label>
                <div className="grid grid-cols-2 gap-1.5 rounded-md border border-slate-200 p-3">
                  {subDomainOptions.map((o) => (
                    <label key={o} className="flex items-center gap-2 text-[13px] text-slate-700">
                      <input type="checkbox" checked={form.subDomains.includes(o)} onChange={() => toggleSubDomain(o)} />
                      {o}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className={labelCls}>Location(s)</label>
              {form.cities.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {form.cities.map((c) => (
                    <span
                      key={c}
                      className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-700"
                    >
                      {c}
                      <button type="button" onClick={() => removeCity(c)} className="text-slate-400 hover:text-slate-700">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <select
                  value={form.cityPick}
                  onChange={(e) => setForm((f) => ({ ...f, cityPick: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select city...</option>
                  {cityOptions
                    .filter((c) => c !== "Other")
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    addCity(form.cityPick);
                    setForm((f) => ({ ...f, cityPick: "" }));
                  }}
                  className="shrink-0 rounded-md bg-slate-100 px-4 text-[12px] font-medium text-slate-700 hover:bg-slate-200"
                >
                  Add
                </button>
              </div>
              <div className="mt-1.5 flex gap-2">
                <input
                  placeholder="Other location (manual entry)"
                  value={form.cityOther}
                  onChange={(e) => setForm((f) => ({ ...f, cityOther: e.target.value }))}
                  className={inputCls}
                />
                <button
                  type="button"
                  onClick={() => {
                    addCity(form.cityOther);
                    setForm((f) => ({ ...f, cityOther: "" }));
                  }}
                  className="shrink-0 rounded-md bg-slate-100 px-4 text-[12px] font-medium text-slate-700 hover:bg-slate-200"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fixed CTC min (LPA)</label>
                <input
                  type="number"
                  value={form.budgetMin}
                  onChange={(e) => setForm((f) => ({ ...f, budgetMin: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Fixed CTC max (LPA)</label>
                <input
                  type="number"
                  value={form.budgetMax}
                  onChange={(e) => setForm((f) => ({ ...f, budgetMax: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Experience min (years)</label>
                <input
                  type="number"
                  value={form.experienceMin}
                  onChange={(e) => setForm((f) => ({ ...f, experienceMin: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Experience max (years)</label>
                <input
                  type="number"
                  value={form.experienceMax}
                  onChange={(e) => setForm((f) => ({ ...f, experienceMax: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Preferred candidate industries (background)</label>
              <MultiSelectChips
                options={optionSets.industries}
                selected={form.preferredIndustries}
                onChange={(next) => setForm((f) => ({ ...f, preferredIndustries: next }))}
                placeholder="Search industries..."
              />
            </div>

            <div>
              <label className={labelCls}>Languages required</label>
              <MultiSelectChips
                options={optionSets.languages}
                selected={form.languagesRequired}
                onChange={(next) => setForm((f) => ({ ...f, languagesRequired: next }))}
                placeholder="Search languages..."
              />
            </div>

            <hr className="border-slate-200" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Is this a new role or a replacement?</label>
                <select
                  value={form.hiringReason}
                  onChange={(e) => setForm((f) => ({ ...f, hiringReason: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select...</option>
                  <option value="new_role">New role</option>
                  <option value="replacement">Replacement</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Will they lead a team or work individually?</label>
                <select
                  value={form.teamHandling}
                  onChange={(e) => setForm((f) => ({ ...f, teamHandling: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select...</option>
                  <option value="individual_contributor">Individual contributor</option>
                  <option value="team_lead">Leads a team</option>
                </select>
              </div>
            </div>
            {form.teamHandling === "team_lead" && (
              <div>
                <label className={labelCls}>Team size</label>
                <select
                  value={form.teamSizeBand}
                  onChange={(e) => setForm((f) => ({ ...f, teamSizeBand: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select...</option>
                  {teamSizeOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {isSalesRole && (
              <>
                <div>
                  <label className={labelCls}>Selling style -- Hunter, Farmer, or Hybrid?</label>
                  <select
                    value={form.sellingStyle}
                    onChange={(e) => setForm((f) => ({ ...f, sellingStyle: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Select...</option>
                    {optionSets.selling_style.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Industries sold to / clientele</label>
                  <MultiSelectChips
                    options={optionSets.industries}
                    selected={form.industriesSoldTo}
                    onChange={(next) => setForm((f) => ({ ...f, industriesSoldTo: next }))}
                    placeholder="Search industries..."
                  />
                </div>
                <div>
                  <label className={labelCls}>Typical sales cycle for this role</label>
                  <select
                    value={form.salesCycle}
                    onChange={(e) => setForm((f) => ({ ...f, salesCycle: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Select...</option>
                    {salesCycleOptions.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Currency</label>
                    <select
                      value={form.dealSizeCurrency}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, dealSizeCurrency: e.target.value as CurrencyValue | "", dealSizeBand: "" }))
                      }
                      className={inputCls}
                    >
                      <option value="">Select...</option>
                      {currencyOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Typical deal size</label>
                    <select
                      value={form.dealSizeBand}
                      onChange={(e) => setForm((f) => ({ ...f, dealSizeBand: e.target.value }))}
                      disabled={!form.dealSizeCurrency}
                      className={inputCls}
                    >
                      <option value="">Select...</option>
                      {dealSizeOptions.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Who is the target customer for this role?</label>
                  <textarea
                    rows={2}
                    value={form.customerProfile}
                    onChange={(e) => setForm((f) => ({ ...f, customerProfile: e.target.value }))}
                    className={inputCls}
                  />
                </div>

                {isB2C && (
                  <div>
                    <label className={labelCls}>Who are the end consumers? (B2C)</label>
                    <MultiSelectChips
                      options={b2cCustomerTypeOptions.map((o) => ({ value: o, label: o }))}
                      selected={form.b2cCustomerTypes}
                      onChange={(next) => setForm((f) => ({ ...f, b2cCustomerTypes: next }))}
                      placeholder="Search consumer types..."
                    />
                  </div>
                )}

                {isB2B && (
                  <div>
                    <label className={labelCls}>Client profile -- who do they actually sell to? (B2B)</label>
                    <MultiSelectChips
                      options={clientProfileOptions.map((o) => ({ value: o, label: o }))}
                      selected={form.clientProfile}
                      onChange={(next) => setForm((f) => ({ ...f, clientProfile: next }))}
                      placeholder="Search titles..."
                    />
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Work mode</label>
                <select
                  value={form.workMode}
                  onChange={(e) => setForm((f) => ({ ...f, workMode: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select...</option>
                  {workModeOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Working days</label>
                <select
                  value={form.workingDays}
                  onChange={(e) => setForm((f) => ({ ...f, workingDays: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select...</option>
                  {WORKING_DAYS_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Shift</label>
                <select
                  value={form.shiftTiming}
                  onChange={(e) => setForm((f) => ({ ...f, shiftTiming: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select...</option>
                  {SHIFT_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <WeekOffPicker value={form.weekOff} onChange={(next) => setForm((f) => ({ ...f, weekOff: next }))} />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Reports to (title)</label>
                <input
                  value={form.reportingManagerTitle}
                  onChange={(e) => setForm((f) => ({ ...f, reportingManagerTitle: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Company size</label>
                <select
                  value={form.companySizeBand}
                  onChange={(e) => setForm((f) => ({ ...f, companySizeBand: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Select...</option>
                  {teamSizeOptions.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Any links to share (website, funding news, LinkedIn) -- comma-separated</label>
              <input
                value={form.companyHighlightLinks}
                onChange={(e) => setForm((f) => ({ ...f, companyHighlightLinks: e.target.value }))}
                className={inputCls}
              />
            </div>

            <hr className="border-slate-200" />

            <p className="text-[13px] font-medium text-slate-700">What does success look like?</p>
            <div>
              <label className={labelCls}>At 3 months</label>
              <input
                value={form.expectation3Month}
                onChange={(e) => setForm((f) => ({ ...f, expectation3Month: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>At 6 months</label>
              <input
                value={form.expectation6Month}
                onChange={(e) => setForm((f) => ({ ...f, expectation6Month: e.target.value }))}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>At 1 year</label>
              <input
                value={form.expectation1Year}
                onChange={(e) => setForm((f) => ({ ...f, expectation1Year: e.target.value }))}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Anything else we should know?</label>
              <textarea
                rows={3}
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                className={inputCls}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Submitting..." : "Submit hiring details"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
