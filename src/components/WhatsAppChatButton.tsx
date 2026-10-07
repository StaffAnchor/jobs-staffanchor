"use client";

import { MessageCircle } from "lucide-react";
import { posthog } from "@/lib/posthog";
import { whatsappChatLink } from "@/lib/whatsapp-chat";

// "Message us on WhatsApp" with the first message prefilled. `source` says which
// page the click came from, so we can see which entry points actually bring
// candidates in.
export default function WhatsAppChatButton({
  text,
  source,
  label = "Message us on WhatsApp",
  variant = "solid",
  className = "",
}: {
  text: string;
  source: string;
  label?: string;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const look =
    variant === "solid"
      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
      : "border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50";
  return (
    <a
      href={whatsappChatLink(text)}
      target="_blank"
      rel="noreferrer"
      onClick={() => {
        try {
          posthog.capture("whatsapp_entry_click", { source });
        } catch {
          // analytics must never block opening the chat
        }
      }}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl px-5 text-sm font-bold transition ${look} ${className}`}
    >
      <MessageCircle className="h-4 w-4" /> {label}
    </a>
  );
}
