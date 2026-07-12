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
import { supabase } from "@/lib/supabaseClient";
import {
  b2bSubDomains,
  b2cSubDomains,
  nonSalesSubDomains,
  industryOptions,
  customerSegmentOptions,
  dealSizeBandsFor,
  salesCycleOptions,
  sellingStyleOptions,
  teamSizeOptions,
  type CategoryValue,
  type CurrencyValue,
} from "@/modules/apply/options";
import {
  mergeTimelines,
  computeStabilityScore,
  computeDomainConsistencyScore,
  computeCareerGaps,
  type ProfileTimelineEntry,
  type ResumeTimelineEntry,
} from "@/lib/career-timeline";

const CATEGORY_OPTIONS: { value: ProfileTimelineEntry["category"]; label: string }[] = [
  { value: "b2b_sales", label: "B2B Sales" },
  { value: "b2c_sales", label: "B2C Sales" },
  { value: "non_sales", label: "Non-Sales / Other" },
];

function subDomainsFor(category: string): string[] {
  if (category === "b2b_sales") return b2bSubDomains;
  if (category === "b2c_sales") return b2cSubDomains;
  if (category === "non_sales") return nonSalesSubDomains;
  return [];
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
  };
}

function monthLabel(m: string | null): string {
  if (!m) return "Present";
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function CareerTimelinePanel({
  candidateId,
  currentEmployer,
  initialProfileEntries,
  initialResumeEntries,
  initialStabilityScore,
  initialDomainConsistencyScore,
}: {
  candidateId: string;
  currentEmployer: string | null;
  initialProfileEntries: ProfileTimelineEntry[];
  initialResumeEntries: ResumeTimelineEntry[];
  initialStabilityScore: number | null;
  initialDomainConsistencyScore: number | null;
}) {
  const [profileEntries, setProfileEntries] = useState<ProfileTimelineEntry[]>(initialProfileEntries ?? []);
  const [resumeEntries] = useState<ResumeTimelineEntry[]>(initialResumeEntries ?? []);
  const [form, setForm] = useState<ProfileTimelineEntry | null>(null);
  const [dealCurrency, setDealCurrency] = useState<CurrencyValue>("INR");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const merged = useMemo(() => mergeTimelines(profileEntries, resumeEntries), [profileEntries, resumeEntries]);
  const stability = useMemo(() => computeStabilityScore(merged), [merged]);
  const domainConsistency = useMemo(() => computeDomainConsistencyScore(profileEntries), [profileEntries]);
  const gaps = useMemo(
    () => computeCareerGaps({ profileEntries, resumeEntries, currentEmployer }),
    [profileEntries, resumeEntries, currentEmployer]
  );

  const stabilityScore = stability?.score ?? initialStabilityScore;
  const stabilityLabel = stability?.label;
  const domainScore = domainConsistency?.score ?? initialDomainConsistencyScore;

  function set<K extends keyof ProfileTimelineEntry>(key: K, value: ProfileTimelineEntry[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  async function persistEntries(next: ProfileTimelineEntry[]) {
    setSaving(true);
    setError("");
    const merged2 = mergeTimelines(next, resumeEntries);
    const stab = computeStabilityScore(merged2);
    const dom = computeDomainConsistencyScore(next);
    const { error: err } = await supabase
      .from("candidates")
      .update({
        career_timeline_profile: next,
        stability_score: stab?.score ?? null,
        domain_consistency_score: dom?.score ?? null,
      })
      .eq("id", candidateId);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setProfileEntries(next);
  }

  async function handleSaveForm() {
    if (!form) return;
    if (!form.company.trim() || !form.start_month) {
      setError("Company and start month are required.");
      return;
    }
    const exists = profileEntries.some((e) => e.id === form.id);
    const next = exists ? profileEntries.map((e) => (e.id === form.id ? form : e)) : [...profileEntries, form];
    await persistEntries(next);
    setForm(null);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this role from your timeline?")) return;
    await persistEntries(profileEntries.filter((e) => e.id !== id));
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

        {(stabilityScore != null || domainScore != null) && (
          <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
            {stabilityScore != null && (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {stabilityScore}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Stability{stabilityLabel ? ` -- ${stabilityLabel}` : ""}</p>
                </div>
              </div>
            )}
            {domainScore != null && (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {domainScore}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </p>
                  <p className="text-[11px] text-slate-500">Domain consistency</p>
                </div>
              </div>
            )}
          </div>
        )}

        {gaps.length > 0 && (
          <div className="space-y-1.5">
            {gaps.map((gap, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <p className="flex-1 text-xs text-amber-800">{gap.message}</p>
                {gap.type === "resume_not_in_profile" && (
                  <button
                    onClick={() =>
                      startAdd({
                        company: gap.resumeEntry.company,
                        title: gap.resumeEntry.title,
                        start_month: gap.resumeEntry.start_month || "",
                        end_month: gap.resumeEntry.end_month,
                      })
                    }
                    className="shrink-0 text-xs font-medium text-amber-700 underline hover:text-amber-900"
                  >
                    Confirm &amp; add
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {resumeEntries.length > 0 && (
          <div>
            <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              From your resume <span className="font-normal normal-case text-slate-400">(unconfirmed)</span>
            </h4>
            <div className="space-y-1.5">
              {resumeEntries.map((e) => (
                <div key={e.id} className="rounded-lg border border-dashed border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">
                      {e.title || "Role"} <span className="font-normal text-slate-400">at {e.company}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {monthLabel(e.start_month)} – {monthLabel(e.end_month)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Confirmed roles</h4>
          {profileEntries.length === 0 && (
            <p className="mb-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-400">
              No roles added yet.
            </p>
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
          <button
            onClick={() => startAdd()}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add a role
          </button>
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
                    <label className="mb-1 flex items-center justify-between text-xs text-slate-500">
                      Deal size
                      <button
                        type="button"
                        onClick={() => setDealCurrency((c) => (c === "INR" ? "USD" : "INR"))}
                        className="text-blue-600"
                      >
                        ({dealCurrency})
                      </button>
                    </label>
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

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSaveForm} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save role"}
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
