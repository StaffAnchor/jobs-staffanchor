"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import type { AtsScoreResult } from "@/app/api/ats-score/route";

// Free, no-signup ATS Score Checker -- the second "free career tool" after
// Mock Interview, same pattern: no account needed, one CTA at the bottom
// nudges toward Build My Profile. Resume upload reuses the same
// extractResumeText path the onboarding wizard's live-parse step uses, but
// nothing here is persisted -- purely a stateless scoring pass.
export default function AtsScorePage() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AtsScoreResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError(null);
  }

  async function handleSubmit() {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      if (jobDescription.trim()) formData.append("jobDescription", jobDescription.trim());
      const res = await fetch("/api/ats-score", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(data);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const scoreColor =
    result && result.score >= 75
      ? "text-emerald-600 border-emerald-600"
      : result && result.score >= 50
        ? "text-amber-600 border-amber-600"
        : "text-red-600 border-red-600";

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-800">
            <Sparkles className="h-3.5 w-3.5" />
            Free practice tool
          </div>
          <h1 className="mt-4 font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            ATS Score Checker
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Upload your resume to see how it scores for ATS-parsability and keyword match -- against a specific job
            description if you have one, or general sales-resume best practices if not. No sign-up needed.
          </p>
        </div>
      </section>

      <section className="container-page grid gap-6 py-10 lg:grid-cols-[1fr_1fr] lg:items-start">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Your resume
              </label>
              <label
                htmlFor="ats-resume-upload"
                className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
                  file ? "border-emerald-300 bg-emerald-50" : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50"
                }`}
              >
                {file ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-700">{file.name}</span>
                    <span className="text-xs text-slate-400">Click to replace it</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Click to upload your resume</span>
                    <span className="text-xs text-slate-400">PDF or DOCX, up to 10MB</span>
                  </>
                )}
                <input
                  id="ats-resume-upload"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Target job description <span className="font-normal normal-case text-slate-400">(optional)</span>
              </label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description you're applying to for a role-specific match score -- or leave blank for a general resume health check."
                className="min-h-[140px]"
                maxLength={6000}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button onClick={handleSubmit} disabled={submitting || !file} className="w-full">
              {submitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Scoring your resume...
                </>
              ) : (
                "Check My ATS Score"
              )}
            </Button>
          </div>
        </Card>

        <div>
          {!result && !submitting && (
            <Card className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 border-dashed p-6 text-center text-sm text-slate-400">
              <FileCheck2 className="h-6 w-6 text-slate-300" />
              Your score and feedback will appear here once you upload a resume.
            </Card>
          )}

          {submitting && (
            <Card className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-6">
              <Spinner className="h-6 w-6" />
              <p className="text-sm text-slate-500">Reading your resume like an ATS parser would...</p>
            </Card>
          )}

          {result && !submitting && (
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 text-xl font-bold ${scoreColor}`}>
                  {result.score}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your ATS Score</p>
                  <p className="text-sm font-semibold text-slate-800">{result.scoreLabel || "out of 100"}</p>
                </div>
              </div>

              {result.strengths.length > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">What worked</p>
                  <ul className="space-y-1">
                    {result.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.matchedKeywords.length > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Matched keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords.map((k) => (
                      <span key={k} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.missingKeywords.length > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Missing keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.map((k) => (
                      <span key={k} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.formattingIssues.length > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-red-700">
                    <AlertTriangle className="h-3.5 w-3.5" /> Formatting issues
                  </p>
                  <ul className="space-y-1">
                    {result.formattingIssues.map((s) => (
                      <li key={s} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations.length > 0 && (
                <div className="rounded-xl bg-indigo-50 p-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-indigo-700">Recommendations</p>
                  <ul className="space-y-1">
                    {result.recommendations.map((s) => (
                      <li key={s} className="text-sm leading-6 text-indigo-900">
                        • {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">Ready to put this into practice?</p>
            <Link href="/register">
              <Button variant="outline" className="rounded-full">
                Build My Profile <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
