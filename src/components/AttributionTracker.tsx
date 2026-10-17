"use client";

import { useEffect } from "react";
import { captureLanding } from "@/lib/attribution";

// Remembers where a visitor came from (once per session) and tells the server, so the CRM can show which posts bring
// candidates. Draws nothing, and never blocks or breaks the page.
export default function AttributionTracker() {
  useEffect(() => {
    try {
      const landing = captureLanding();
      if (!landing) return;
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId: landing.visitorId, touch: landing.touch }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Tracking is best effort.
    }
  }, []);
  return null;
}
