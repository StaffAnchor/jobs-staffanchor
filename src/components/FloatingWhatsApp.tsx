"use client";

import { MessageCircle } from "lucide-react";
import { posthog } from "@/lib/posthog";
import { whatsappChatLink } from "@/lib/whatsapp-chat";

// A WhatsApp button that stays on screen while someone reads, so the way to ask a
// question is always one tap away, on phones especially. `bottomClass` lets a page
// lift it above its own bottom bar (for example the mobile "Apply now" bar).
export default function FloatingWhatsApp({
  text,
  source,
  bottomClass = "bottom-5",
}: {
  text: string;
  source: string;
  bottomClass?: string;
}) {
  return (
    <a
      href={whatsappChatLink(text)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with a StaffAnchor recruiter on WhatsApp"
      onClick={() => {
        try {
          posthog.capture("whatsapp_entry_click", { source });
        } catch {
          // analytics must never block opening the chat
        }
      }}
      className={`fixed right-4 z-40 flex h-14 items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-sm font-bold text-white shadow-xl shadow-emerald-900/25 transition hover:bg-[#1fb857] sm:px-5 ${bottomClass}`}
    >
      <MessageCircle className="h-6 w-6" />
      <span className="hidden sm:inline">Chat with a recruiter</span>
    </a>
  );
}
