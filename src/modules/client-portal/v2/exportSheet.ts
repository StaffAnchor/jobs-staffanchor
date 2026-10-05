import type { BoardCandidate, Role } from "./types";
import { columnOf, computeFit } from "./fit";
import { passReasonLabel } from "./PassReasonDialog";

const STATUS: Record<string, string> = { review: "To review", interested: "Interested", interview: "Interview", closed: "Closed" };

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

// A plain CSV: opens in Excel, and in Google Sheets via File > Import (or by dropping it into Drive).
export function shortlistCsv(role: Role, candidates: BoardCandidate[], roleUrl: string): string {
  const header = [
    "Candidate", "Current title", "Company", "Location", "Experience (yrs)", "Expected fixed CTC (LPA)", "Notice period",
    "Fit score", "Requirements met", "Not met / partly met", "Your status", "Reason for passing", "Interview time", "Open in portal",
  ];
  const rows = candidates.map((c) => {
    const fit = computeFit(role, c);
    const reqs = fit.rows.filter((r) => r.key.startsWith("req-"));
    const gaps = reqs.filter((r) => r.state !== "met").map((r) => `${r.asked} (${r.state === "unmet" ? "not met" : "partly"}${r.got && r.got !== "Not met" && r.got !== "Partly met" ? `: ${r.got}` : ""})`);
    const col = columnOf(c);
    const status = c.stage === "placed" ? "Hired" : col === "closed" ? "Passed" : STATUS[col];
    const pass = [passReasonLabel(c.client_pass_reason), c.client_pass_note].filter(Boolean).join(": ");
    return [
      c.full_name, c.current_job_title, c.current_employer, c.current_location, c.total_experience_years, c.expected_fixed_ctc, c.notice_period,
      fit.pct ?? "", reqs.length ? `${reqs.filter((r) => r.state === "met").length} of ${reqs.length}` : "", gaps.join("; "), status, pass,
      when(c.confirmed_interview_at ?? c.requested_interview_at), roleUrl,
    ];
  });
  // BOM so Excel reads the rupee sign and accents correctly.
  return "\uFEFF" + [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
}
