"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { supabase } from "@/lib/supabaseClient";
import { getMyShortlist, getResumeSignedUrl, type ShortlistCandidate } from "@/modules/client-portal/api";
import ClientFeedbackButtons from "@/modules/client-portal/ClientFeedbackButtons";
import ProfilePassportTrigger from "@/modules/client-portal/ProfilePassport";
import ResumePreview from "@/components/common/ResumePreview";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function passportRank(r: ShortlistCandidate): number {
  const recommended = r.overall_recommendation === "Strong Fit" ? 0 : 2;
  const pending = r.client_feedback ? 1 : 0;
  return recommended + pending;
}

const FEEDBACK_LABEL: Record<string, string> = {
  interested: "Interested",
  interview_requested: "Interview requested",
  not_interested: "Not interested",
};

export default function ClientMandateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [rows, setRows] = useState<ShortlistCandidate[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeUrls, setResumeUrls] = useState<Record<string, string | null>>({});
  const [search, setSearch] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/client-login");
        return;
      }

      try {
        const data = await getMyShortlist(params.id);
        if (cancelled) return;
        setRows(data);

        const entries = await Promise.all(
          data
            .filter((c) => c.resume_file_url)
            .map(async (c) => [c.candidate_id, await getResumeSignedUrl(c.resume_file_url!)] as const)
        );
        if (!cancelled) setResumeUrls(Object.fromEntries(entries));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load this shortlist.");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, router]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    return rows.filter((c) => {
      const matchesSearch =
        !q ||
        c.full_name.toLowerCase().includes(q) ||
        (c.current_job_title ?? "").toLowerCase().includes(q) ||
        (c.current_employer ?? "").toLowerCase().includes(q) ||
        (c.sub_domain ?? "").toLowerCase().includes(q);
      const matchesFeedback =
        feedbackFilter === "all" ||
        (feedbackFilter === "pending" ? !c.client_feedback : c.client_feedback === feedbackFilter);
      return matchesSearch && matchesFeedback;
    });
  }, [rows, search, feedbackFilter]);

  if (error) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center sm:px-6">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  const recommendedCount = filtered.filter((r) => r.overall_recommendation === "Strong Fit").length;
  // Un-responded candidates float to the top of each recommendation group so
  // a client isn't re-scanning ones they've already actioned.
  const ordered = [...filtered].sort((a, b) => passportRank(a) - passportRank(b));

  const interestedCount = rows.filter((r) => r.client_feedback === "interested").length;
  const interviewCount = rows.filter((r) => r.client_feedback === "interview_requested").length;
  const notInterestedCount = rows.filter((r) => r.client_feedback === "not_interested").length;
  const pendingCount = rows.filter((r) => !r.client_feedback).length;

  const ctcValues = rows.map((r) => r.expected_fixed_ctc).filter((v): v is number => v != null);
  const medianCtc = median(ctcValues);
  // notice_period is a categorical field ("Immediate", "15 days", "30 days", "90+ days"),
  // not a raw day count -- only the first two buckets count as "soon".
  const availableSoonCount = rows.filter(
    (r) => r.notice_period === "Immediate" || r.notice_period === "15 days"
  ).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/client-portal" className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> All your roles
      </Link>

      <div className="mt-3 mb-4">
        <h1 className="text-xl font-bold text-slate-900">{rows[0]?.role_title ?? "Shortlist"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {rows.length} candidate{rows.length === 1 ? "" : "s"} shortlisted for your review.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600">
            {recommendedCount} recommended
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700">
            {interestedCount} interested
          </span>
          <span className="rounded-full bg-cyan-100 px-3 py-1 font-medium text-cyan-700">
            {interviewCount} interview requested
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700">
            {notInterestedCount} not interested
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
            {pendingCount} awaiting your response
          </span>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, title, employer, sub-domain…"
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>
          <Select value={feedbackFilter} onChange={(e) => setFeedbackFilter(e.target.value)} className="sm:w-56">
            <option value="all">All candidates</option>
            <option value="pending">Awaiting my response</option>
            <option value="interested">Interested</option>
            <option value="interview_requested">Interview requested</option>
            <option value="not_interested">Not interested</option>
          </Select>
        </div>
      )}

      {rows.length > 0 && ordered.length > 0 && (medianCtc !== null || availableSoonCount > 0) && (
        <p className="mb-4 rounded-lg bg-slate-100 px-3.5 py-2 text-xs text-slate-500">
          {medianCtc !== null && (
            <>
              Median expected CTC in this shortlist: <span className="font-semibold text-slate-700">₹{medianCtc}L</span>
            </>
          )}
          {medianCtc !== null && availableSoonCount > 0 && " · "}
          {availableSoonCount > 0 && (
            <>
              <span className="font-semibold text-slate-700">{availableSoonCount}</span> of {rows.length} available within 15 days
            </>
          )}
        </p>
      )}

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            No candidates in this shortlist yet — your recruiter will add them here as they're screened.
          </CardContent>
        </Card>
      ) : ordered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            No candidates match your search or filter.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordered.map((c) => (
            <Card key={c.link_id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-semibold text-slate-900">{c.full_name}</h2>
                      {c.overall_recommendation === "Strong Fit" && (
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-800">
                          Recommended
                        </span>
                      )}
                      {c.client_feedback && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {FEEDBACK_LABEL[c.client_feedback] ?? c.client_feedback}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {c.current_job_title}
                      {c.current_employer ? ` at ${c.current_employer}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {c.current_location} · {c.total_experience_years ?? "—"} yrs experience
                    </p>
                  </div>
                  {c.resume_file_url && resumeUrls[c.candidate_id] && (
                    <div className="shrink-0">
                      <ResumePreview
                        signedUrl={resumeUrls[c.candidate_id]!}
                        fileName={c.resume_file_url.replace(/^resumes\//, "")}
                        label="Preview resume"
                      />
                    </div>
                  )}
                </div>

                {c.ai_summary && <p className="mt-3 text-sm text-slate-700 line-clamp-2">{c.ai_summary}</p>}
                <ProfilePassportTrigger
                  fullName={c.full_name}
                  currentJobTitle={c.current_job_title}
                  currentEmployer={c.current_employer}
                  currentLocation={c.current_location}
                  totalExperienceYears={c.total_experience_years}
                  subDomain={c.sub_domain}
                  expectedFixedCtc={c.expected_fixed_ctc}
                  verifiedRelocation={c.verified_relocation}
                  verifiedNotice={c.verified_notice}
                  industries={c.industries}
                  aiSummary={c.ai_summary}
                  aiPassport={c.ai_passport}
                />

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Sub-domain</p>
                    <p className="text-slate-700">{c.sub_domain ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Expected fixed CTC</p>
                    <p className="text-slate-700">{c.expected_fixed_ctc ? `₹${c.expected_fixed_ctc}L` : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Relocation — verified</p>
                    <p className="text-slate-700">{c.verified_relocation ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Notice period — verified</p>
                    <p className="text-slate-700">{c.verified_notice ?? "—"}</p>
                  </div>
                </div>

                {c.industries && c.industries.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-400">Industries</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {c.industries.map((i) => (
                        <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {i}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <ClientFeedbackButtons
                  linkId={c.link_id}
                  current={c.client_feedback}
                  requestedInterviewAt={c.requested_interview_at}
                  confirmedInterviewAt={c.confirmed_interview_at}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
