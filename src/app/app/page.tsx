import type { Metadata } from "next";
import { BellRing, BriefcaseBusiness, ShieldCheck, Smartphone } from "lucide-react";
import InstallApp from "@/components/pwa/InstallApp";

export const metadata: Metadata = {
  title: "Get the StaffAnchor app",
  description: "Add StaffAnchor to your phone's home screen: live sales roles, your applications and interview prep in one tap.",
  alternates: { canonical: "/app" },
  robots: { index: false, follow: false },
};

const POINTS = [
  { icon: BriefcaseBusiness, t: "Live sales roles, one tap away", d: "Opens full screen from your home screen, no browser bar." },
  { icon: Smartphone, t: "No download from a store", d: "It is the same StaffAnchor site you already use, saved like an app. It takes two taps." },
  { icon: ShieldCheck, t: "Safe by design", d: "It can't read your contacts, messages or photos. Delete it any time like any other icon." },
  { icon: BellRing, t: "Alerts, coming soon", d: "We'll ask before sending any, and only for things you care about, like a role that matches you." },
];

export default function AppPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-700">StaffAnchor</p>
      <h1 className="mt-2 text-[28px] font-extrabold leading-tight tracking-tight text-slate-950 sm:text-[34px]">Keep StaffAnchor on your phone</h1>
      <p className="mt-3 text-[15.5px] leading-relaxed text-slate-600">Add it to your home screen and open live sales roles, your applications and interview prep in one tap. Same site, no download.</p>
      <div className="mt-6"><InstallApp /></div>
      <ul className="mt-9 space-y-4">
        {POINTS.map((p) => (
          <li key={p.t} className="flex items-start gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><p.icon className="h-5 w-5" /></span>
            <div>
              <p className="text-[15px] font-bold text-slate-900">{p.t}</p>
              <p className="mt-0.5 text-[14px] leading-snug text-slate-600">{p.d}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
