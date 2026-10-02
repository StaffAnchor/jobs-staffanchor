"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  loadMyNotifications,
  markMyNotificationsRead,
  timeAgo,
  type CandidateNotification,
} from "@/modules/candidate-portal/applications";

// Application updates for a signed-in candidate. Polls lightly so a stage
// change shows up without a refresh; opening the panel marks everything read
// (the unread highlight stays visible for that opening so nothing seems to
// vanish before it was seen).
export default function NotificationBell() {
  const [items, setItems] = useState<CandidateNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await loadMyNotifications(15));
    } catch {
      // A failed poll should never disturb the page.
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = items.filter((n) => !n.read_at).length;

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setHighlight(new Set(items.filter((n) => !n.read_at).map((n) => n.id)));
      await markMyNotificationsRead();
      setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })));
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[340px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Updates</p>
            <Link href="/candidate-portal" onClick={() => setOpen(false)} className="text-xs font-semibold text-blue-600 hover:underline">
              View applications
            </Link>
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              Nothing yet. When an application moves forward, you will see it here.
            </p>
          ) : (
            <ul className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${highlight.has(n.id) ? "bg-blue-50/60" : ""}`}>
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{n.body}</p>}
                  <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
