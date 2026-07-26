"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPostHog, posthog } from "@/lib/posthog";

// Mounted once inside AppProviders (which already wraps every route).
// Initializes PostHog on first client render, then fires a manual
// pageview capture on every App Router navigation -- these are client-side
// transitions that never trigger the full-page load PostHog's own
// autocapture pageview listener expects.
export default function PostHogPageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPostHog();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const url = searchParams?.size ? `${pathname}?${searchParams.toString()}` : pathname;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}
