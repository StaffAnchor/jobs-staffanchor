"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { posthog } from "@/lib/posthog";
import { whatsappChatLink } from "@/lib/whatsapp-chat";

// "Activate WhatsApp alerts": one tap opens WhatsApp with the activation message already typed in. WhatsApp only delivers
// our messages reliably to people who have messaged us first, so this is the moment the candidate says hello. The CRM
// recognises the message, records the opt-in with its date, and confirms within the free 24-hour window.
// Keep the wording of ACTIVATE_TEXT in step with the pattern the CRM webhook looks for ("activate ... alerts/reminders/whatsapp").
export const activateText = (name: string | null | undefined) =>
  `Hi StaffAnchor, I'm ${name?.trim() || "a candidate"}. Please activate my job alerts and interview reminders on WhatsApp.`;

const KEY = "sa_wa_activate_clicked";

export default function WhatsAppActivate({ name, source, className = "", remember = false }: { name?: string | null; source: string; className?: string; remember?: boolean }) {
  // On the candidate portal the card goes away once the person has tapped it. Browser storage can be blocked, so it just stays.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    if (!remember) return;
    let clicked = false;
    try {
      clicked = !!window.localStorage.getItem(KEY);
    } catch {
      /* storage blocked */
    }
    const t = setTimeout(() => setHidden(clicked), 0);
    return () => clearTimeout(t);
  }, [remember]);
  if (hidden) return null;
  return (
    <section className={`rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 ${className}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">WhatsApp alerts</p>
      <p className="mt-1 text-[16px] font-extrabold leading-snug text-slate-900">Get matching roles and interview reminders on WhatsApp</p>
      <p className="mt-1.5 text-[13.5px] leading-6 text-slate-600">
        Send us a quick &ldquo;hello&rdquo; to switch it on. WhatsApp only delivers our messages reliably once you have messaged us first. We will send roles that fit and interview reminders, and you can reply STOP at any time.
      </p>
      <a
        href={whatsappChatLink(activateText(name))}
        target="_blank"
        rel="noreferrer"
        onClick={() => {
          try {
            posthog.capture("whatsapp_entry_click", { source });
          } catch {
            // analytics must never block opening the chat
          }
          if (remember) {
            try {
              window.localStorage.setItem(KEY, "1");
            } catch {
              /* storage blocked */
            }
          }
        }}
        className="mt-3.5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
      >
        <MessageCircle className="h-4 w-4" /> Activate on WhatsApp
      </a>
    </section>
  );
}
