"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Download, PlusSquare, Share } from "lucide-react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

// "Install" button for the home-screen app. Android and desktop Chrome give a one-tap install; iPhones have no such button,
// so Safari users get the two steps instead. Shows a quiet note once the app is already installed.
export default function InstallApp() {
  const [evt, setEvt] = useState<InstallEvent | null>(null);
  const [mode, setMode] = useState<"checking" | "installed" | "ios" | "other">("checking");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const t = setTimeout(() => setMode(standalone ? "installed" : ios ? "ios" : "other"), 0);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as InstallEvent);
    };
    const onInstalled = () => setMode("installed");
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearTimeout(t);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (mode === "checking") return null;
  if (mode === "installed") {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
        <CheckCircle2 className="h-4 w-4" /> You&apos;re using the StaffAnchor app.
      </p>
    );
  }
  if (evt) {
    return (
      <button
        type="button"
        onClick={async () => {
          await evt.prompt();
          await evt.userChoice.catch(() => null);
          setEvt(null);
        }}
        className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-[15px] font-semibold text-white"
      >
        <Download className="h-4 w-4" /> Install StaffAnchor
      </button>
    );
  }
  if (mode === "ios") {
    return (
      <ol className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-[14.5px] text-slate-700">
        <li className="flex items-start gap-3"><Share className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /> <span>Open this page in <b>Safari</b> and tap the <b>Share</b> button.</span></li>
        <li className="flex items-start gap-3"><PlusSquare className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /> <span>Choose <b>Add to Home Screen</b>, then tap <b>Add</b>.</span></li>
      </ol>
    );
  }
  return (
    <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
      On Android, open this page in <b>Chrome</b> and tap the menu (⋮), then <b>Install app</b> or <b>Add to Home screen</b>.
    </p>
  );
}
