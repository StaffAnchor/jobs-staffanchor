"use client";

import { useEffect } from "react";

// Registers the small service worker that makes the site installable. Draws nothing; any failure is ignored.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
