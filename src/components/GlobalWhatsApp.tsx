"use client";

import { usePathname } from "next/navigation";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

// Puts the WhatsApp button on the candidate-facing pages that do not already have their
// own: the home page, registration, tools and the candidate account. Job pages and the
// jobs list have their own (lifted above the "Apply now" bar), and the client portal,
// dashboards and sign-in screens deliberately get none.
const PAGES: { match: (p: string) => boolean; text: string; source: string }[] = [
  { match: (p) => p === "/", text: "Hi StaffAnchor, I'm looking for sales roles. Could you help me find the right one?", source: "home_floating" },
  { match: (p) => p.startsWith("/register"), text: "Hi StaffAnchor, I need help with my profile registration.", source: "register_floating" },
  { match: (p) => p.startsWith("/candidate-portal") || p.startsWith("/candidate-login"), text: "Hi StaffAnchor, I have a question about my profile.", source: "candidate_account_floating" },
  { match: (p) => p.startsWith("/ats-score") || p.startsWith("/mock-interview") || p.startsWith("/passport"), text: "Hi StaffAnchor, I'm a sales professional looking for new roles. Could you help?", source: "tools_floating" },
];

export default function GlobalWhatsApp() {
  const pathname = usePathname() ?? "/";
  const page = PAGES.find((p) => p.match(pathname));
  if (!page) return null;
  return <FloatingWhatsApp text={page.text} source={page.source} />;
}
