"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, FileText, LogOut, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/forms/form-field";
import { supabase } from "@/lib/supabaseClient";
import {
  categoryOptions,
  cityOptions,
  cityStateMap,
  ctcOptions,
  defaultNoticePeriods,
  employmentStatusOptions,
  experienceOptions,
  highestQualificationOptions,
  relocationOptions,
  subDomainsForCategory,
  workModeOptions,
  type CategoryValue,
} from "@/modules/apply/options";

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
  open_to_relocation: string | null;
  work_mode: string | null;
  highest_qualification: string | null;
  skills: string | null;
  self_assessment: { best?: string; lost?: string } | null;
  status: string;
};

export default function ProfileEditor({ profile: initialProfile }: { profile: CandidateProfile }) {
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
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subDomains = useMemo(() => subDomainsForCategory((profile.category as CategoryValue) || null), [profile.category]);

  function set<K extends keyof CandidateProfile>(key: K, value: CandidateProfile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function setAssessment(key: "best" | "lost", value: string) {
    setProfile((p) => ({ ...p, self_assessment: { ...(p.self_assessment ?? {}), [key]: value } }));
  }

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
          open_to_relocation: profile.open_to_relocation,
          work_mode: profile.work_mode,
          highest_qualification: profile.highest_qualification,
          skills: profile.skills,
          self_assessment: profile.self_assessment,
          status: profile.status === "awaiting_input" ? "registered" : profile.status,
        })
        .eq("id", profile.id);

      if (updateError) throw new Error(updateError.message);

      setProfile((p) => ({ ...p, resume_file_url: resumeFileUrl }));
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
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
            <div className="flex items-center gap-3">
              {profile.resume_file_url && !resumeFile && (
                <span className="flex items-center gap-1 text-[13px] text-emerald-700">
                  <FileText className="h-3.5 w-3.5" /> Resume on file
                </span>
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
          <FormField label="Current employer">
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
          <FormField label="Notice period">
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
          <h2 className="text-sm font-semibold text-slate-900 sm:col-span-2">Specialization &amp; preferences</h2>
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
          <FormField label="Sub-domain">
            <Select value={profile.sub_domain ?? ""} onChange={(e) => set("sub_domain", e.target.value)} disabled={!profile.category}>
              <option value="">Select</option>
              {subDomains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </FormField>
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
        </CardContent>
      </Card>

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
  );
}
