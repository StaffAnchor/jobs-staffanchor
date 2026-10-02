"use client";

import { useEffect, useState } from "react";
import { BellRing } from "lucide-react";
import { loadMyNotifications, timeAgo, type CandidateNotification } from "./applications";

// The latest application updates, surfaced right on Home so a candidate sees
// movement the moment they land -- not only if they think to open the bell.
// Renders nothing until there's at least one update.
export default function LatestUpdates({ onSeeAll }: { onSeeAll: () => void }) {
  const [items, setItems] = useState<CandidateNotification[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadMyNotifications(3)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        // Non-critical.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <BellRing className="h-4 w-4 text-blue-600" /> Latest updates
        </p>
        <button type="button" onClick={onSeeAll} className="text-xs font-semibold text-blue-600 hover:underline">
          View all applications
        </button>
      </div>
      <ul className="divide-y divide-blue-100/70">
        {items.map((n) => (
          <li key={n.id} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">{n.title}</p>
              {n.body && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{n.body}</p>}
            </div>
            <span className="shrink-0 text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
