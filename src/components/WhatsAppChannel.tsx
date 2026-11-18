"use client";

import { posthog } from "@/lib/posthog";

// StaffAnchor's WhatsApp channel: new sales roles posted as they open. One-way and anonymous (members cannot see each other,
// and we cannot see who joined), so it is the lighter alternative to "Activate on WhatsApp", which links a person to their profile.
export const WHATSAPP_CHANNEL_URL = "https://whatsapp.com/channel/0029VbASKh5KmCPRj6oejX2u";

const track = (source: string) => {
  try {
    posthog.capture("whatsapp_channel_click", { source });
  } catch {
    // analytics must never block opening the channel
  }
};

const Icon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
  </svg>
);

/** variant "inline": a quiet text link. "pill": a small outlined button for light pages. "pill-dark": the same on a dark hero. */
export default function WhatsAppChannel({ source, variant = "inline", className = "" }: { source: string; variant?: "inline" | "pill" | "pill-dark"; className?: string }) {
  const look =
    variant === "pill-dark"
      ? "rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
      : variant === "pill"
        ? "rounded-full border border-emerald-600/40 bg-white px-3.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
        : "text-xs text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline";
  return (
    <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer" onClick={() => track(source)} className={`inline-flex items-center gap-1.5 ${look} ${className}`}>
      <Icon /> {variant === "inline" ? "Or just follow our WhatsApp channel for new roles" : "New sales roles daily: join our WhatsApp channel"}
    </a>
  );
}
