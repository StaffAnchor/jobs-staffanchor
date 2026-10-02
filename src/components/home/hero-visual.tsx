import { Bell, Check } from "lucide-react";

// Illustrative product preview for the hero: what a candidate actually sees
// (a role with match reasons, an application tracker, a status update).
// Clearly labelled as an example -- the real, live roles sit just below.
export default function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] sm:h-[540px]" aria-hidden="true">
      <div className="pointer-events-none absolute -right-10 top-10 h-72 w-72 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />

      {/* Match card */}
      <div className="relative z-10 rounded-3xl bg-white p-6 shadow-[0_40px_90px_-30px_rgba(0,0,0,0.6)] sm:absolute sm:left-0 sm:top-12 sm:w-[370px] sm:-rotate-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-800">SP</span>
            <div>
              <p className="text-[15px] font-extrabold leading-tight text-slate-900">Business Development Associate</p>
              <p className="mt-0.5 text-xs text-slate-500">A leading SaaS platform company</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-4 rounded-2xl bg-emerald-50/70 p-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full"
            style={{ background: "conic-gradient(#10b981 0 94%, #d1fae5 0)" }}
          >
            <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-white text-base font-extrabold text-slate-900">94%</div>
          </div>
          <ul className="space-y-1.5 text-[13px] font-medium text-emerald-900">
            {["Matches your SaaS background", "In your city", "Your experience fits"].map((r) => (
              <li key={r} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-emerald-600" /> {r}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5 flex h-11 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">Apply in one click</div>
        <p className="mt-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">Example preview</p>
      </div>

      {/* Tracker card */}
      <div className="animate-float relative z-20 mt-5 rounded-2xl bg-white/95 p-4 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)] backdrop-blur sm:absolute sm:right-0 sm:top-0 sm:mt-0 sm:w-[270px] sm:rotate-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Application status</p>
        <p className="mt-1.5 text-sm font-extrabold text-slate-900">Interview tomorrow, 11:00 AM</p>
        <div className="mt-3 flex gap-1">
          {[true, true, true, true, false].map((on, i) => (
            <span key={i} className={`h-1.5 flex-1 rounded-full ${on ? "bg-blue-600" : "bg-slate-200"}`} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] font-semibold text-slate-400">
          <span>Applied</span>
          <span>Interview</span>
          <span>Offer</span>
        </div>
      </div>

      {/* Notification */}
      <div className="animate-float-slow relative z-20 mt-5 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.6)] sm:absolute sm:bottom-2 sm:right-4 sm:mt-0 sm:w-[300px]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Bell className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[13px] font-bold leading-snug text-slate-900">The client shortlisted your profile</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Just now</p>
        </div>
      </div>
    </div>
  );
}
