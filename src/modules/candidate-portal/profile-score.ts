// Portal-home Profile Score -- a lightweight, independent read on profile
// completeness computed straight off the saved `candidates` row.
//
// This is deliberately NOT the same calculation as ApplyForm.tsx's
// `profileStrength`/`readinessTier` (the "Passport Readiness" score shown
// inside the wizard itself). That one is tightly coupled to the wizard's
// live in-memory FormState (values, isStageComplete, isB2B, etc.) and isn't
// something a lightweight portal-home screen can reach without either
// duplicating hundreds of lines of wizard-internal logic or mounting the
// whole wizard just to read a number. Since the two scores are computed
// from materially the same set of "did you fill this in" fields, they track
// each other closely in practice even though the exact numbers can drift by
// a few points -- which is an acceptable trade-off for a home-screen
// at-a-glance card, where the point is "roughly how complete am I," not a
// pixel-exact match to the wizard's own internal metric.

export type ScoreCandidateRow = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  current_location?: string | null;
  linkedin_url?: string | null;
  current_employment_status?: string | null;
  total_experience_years?: number | null;
  current_fixed_ctc?: number | null;
  expected_fixed_ctc?: number | null;
  highest_qualification?: string | null;
  category?: string | null;
  sub_domain?: string | null;
  segment_data?: Record<string, unknown> | null;
  skills?: string | null;
  current_industry?: string | null;
  industries?: string[] | null;
  work_mode?: string | null;
  open_to_relocation?: string | null;
  resume_file_url?: string | null;
  career_timeline_profile?: unknown;
};

export type ProfileScoreTier = "Basic" | "Good" | "Excellent" | "Premium";

export type ProfileScoreResult = {
  score: number; // 0-100
  tier: ProfileScoreTier;
  missing: string[]; // human-readable labels of unfilled base fields, for a "what's left" nudge
};

function filled(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim() !== "";
}

const BASE_FIELDS: { key: keyof ScoreCandidateRow; label: string }[] = [
  { key: "full_name", label: "Full name" },
  { key: "phone", label: "Phone number" },
  { key: "current_location", label: "Current location" },
  { key: "linkedin_url", label: "LinkedIn profile" },
  { key: "current_employment_status", label: "Employment status" },
  { key: "total_experience_years", label: "Total experience" },
  { key: "current_fixed_ctc", label: "Current CTC" },
  { key: "expected_fixed_ctc", label: "Expected CTC" },
  { key: "highest_qualification", label: "Highest qualification" },
  { key: "category", label: "Function / Domain" },
  { key: "sub_domain", label: "Primary specialization" },
  { key: "skills", label: "Skills" },
  { key: "current_industry", label: "Current industry" },
  { key: "work_mode", label: "Work mode" },
  { key: "open_to_relocation", label: "Relocation preference" },
  { key: "resume_file_url", label: "Resume" },
];

export function computeProfileScore(candidate: ScoreCandidateRow): ProfileScoreResult {
  const missing: string[] = [];
  let filledCount = 0;
  for (const f of BASE_FIELDS) {
    if (filled(candidate[f.key])) filledCount += 1;
    else missing.push(f.label);
  }
  const baseFraction = filledCount / BASE_FIELDS.length;

  // Career timeline -- has at least one role entered, weighted like ~3 plain
  // fields (same relative weight ApplyForm's own scoring gives it), since
  // it's the single richest section of the Sales Passport.
  const timelineEntries = Array.isArray(candidate.career_timeline_profile) ? candidate.career_timeline_profile : [];
  const hasTimeline = timelineEntries.length > 0;
  if (!hasTimeline) missing.push("Career timeline");

  const segmentFilled = Object.values(candidate.segment_data ?? {}).some((v) => filled(v));
  if (!segmentFilled) missing.push("Sales profile details");

  const BASE_WEIGHT = 0.6;
  const TIMELINE_WEIGHT = 0.25;
  const SEGMENT_WEIGHT = 0.15;
  const score = Math.round(
    baseFraction * BASE_WEIGHT * 100 + (hasTimeline ? 100 : 0) * TIMELINE_WEIGHT + (segmentFilled ? 100 : 0) * SEGMENT_WEIGHT
  );

  const tier: ProfileScoreTier = score >= 90 ? "Premium" : score >= 65 ? "Excellent" : score >= 35 ? "Good" : "Basic";

  return { score: Math.min(100, Math.max(0, score)), tier, missing };
}

export const PROFILE_SCORE_TIER_META: Record<
  ProfileScoreTier,
  { ring: string; chipBg: string; chipText: string; blurb: string }
> = {
  Basic: {
    ring: "#94a3b8",
    chipBg: "bg-slate-100",
    chipText: "text-slate-600",
    blurb: "A few more sections and recruiters will start seeing a real picture of you.",
  },
  Good: {
    ring: "#2563eb",
    chipBg: "bg-blue-50",
    chipText: "text-blue-700",
    blurb: "Solid start — fill in your role details and targets to stand out further.",
  },
  Excellent: {
    ring: "#7c3aed",
    chipBg: "bg-violet-50",
    chipText: "text-violet-700",
    blurb: "Strong profile — recruiters can already make a confident first read on you.",
  },
  Premium: {
    ring: "#059669",
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
    blurb: "Complete profile — you're in the top tier of what recruiters see.",
  },
};
