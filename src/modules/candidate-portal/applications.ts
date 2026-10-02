import { supabase } from "@/lib/supabaseClient";

// One vocabulary for how a candidate sees an application, shared by the
// Applications tab, the notification bell and Home so they never disagree.
// Internal CRM stages (sourced / screened / shortlisted ...) are folded into
// the handful of steps a candidate actually cares about.

export type ApplicationRow = {
  link_id: string;
  mandate_id: string;
  role_title: string;
  stage: string;
  client_display: string;
  city: string | null;
  applied_at: string;
  stage_updated_at: string;
  confirmed_interview_at: string | null;
  is_priority: boolean;
};

export type ApplicationEvent = {
  link_id: string;
  mandate_id: string;
  from_stage: string | null;
  to_stage: string;
  created_at: string;
};

export type CandidateNotification = {
  id: string;
  link_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  created_at: string;
  read_at: string | null;
};

export const APPLICATION_STEPS = ["Applied", "Reviewed", "Shared with client", "Interview", "Offer"] as const;

// Index into APPLICATION_STEPS that the stage has reached (the "current" step).
export function stepIndexForStage(stage: string): number {
  switch (stage) {
    case "sourced":
      return 0;
    case "screened":
    case "shortlisted":
      return 1;
    case "submitted":
    case "client_shortlisted":
      return 2;
    case "client_interview":
      return 3;
    case "offer":
    case "placed":
      return 4;
    default:
      return 0;
  }
}

// Short status shown on a card.
export function statusLabel(stage: string): string {
  const labels: Record<string, string> = {
    sourced: "Received",
    screened: "Reviewed by your recruiter",
    shortlisted: "Shortlisted by your recruiter",
    submitted: "Shared with the client",
    client_shortlisted: "Client shortlisted you",
    client_interview: "Interview stage",
    offer: "Offer stage",
    placed: "Placed",
    pulled_back: "On hold",
    rejected: "Not moving forward",
  };
  return labels[stage] ?? stage;
}

// Wording for a line in the activity timeline.
export function eventLabel(toStage: string): string {
  const labels: Record<string, string> = {
    sourced: "Added to this role",
    screened: "Reviewed by your recruiter",
    shortlisted: "Shortlisted by your recruiter",
    submitted: "Your profile was shared with the client",
    client_shortlisted: "The client shortlisted your profile",
    client_interview: "You moved to the interview stage",
    offer: "Offer stage reached",
    placed: "You were placed",
    pulled_back: "This role was put on hold",
    rejected: "This role is not moving forward",
  };
  return labels[toStage] ?? toStage;
}

export type StatusTone = "neutral" | "active" | "good" | "warn" | "bad";

export function statusTone(stage: string): StatusTone {
  if (stage === "placed") return "good";
  if (stage === "rejected") return "bad";
  if (stage === "pulled_back") return "warn";
  if (stage === "client_interview" || stage === "offer" || stage === "client_shortlisted" || stage === "submitted") return "active";
  return "neutral";
}

export function formatWhen(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export async function loadMyApplications(): Promise<ApplicationRow[]> {
  const { data, error } = await supabase.rpc("get_my_applications");
  if (error) throw new Error(error.message);
  return (data ?? []) as ApplicationRow[];
}

export async function loadMyApplicationEvents(): Promise<ApplicationEvent[]> {
  const { data, error } = await supabase.rpc("get_my_application_events");
  if (error) throw new Error(error.message);
  return (data ?? []) as ApplicationEvent[];
}

export async function loadMyNotifications(limit = 30): Promise<CandidateNotification[]> {
  const { data, error } = await supabase.rpc("get_my_notifications", { p_limit: limit });
  if (error) throw new Error(error.message);
  return (data ?? []) as CandidateNotification[];
}

export async function markMyNotificationsRead(): Promise<void> {
  await supabase.rpc("mark_my_notifications_read");
}
