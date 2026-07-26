import posthog from "posthog-js";

// Same env-var-with-fallback convention as lib/supabaseClient.ts -- the
// fallback is PostHog's client-side project key, which is designed to be
// public-safe (write-only), so shipping it as a literal default is fine
// even before NEXT_PUBLIC_POSTHOG_KEY is set in Vercel's project settings.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "phc_oD3iuApjwWCvMQDrBp9Vf3in7HwvZFM2ZTgWvkB5j7bq";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

// Guarded, idempotent init -- safe even if called more than once across
// client components during a single page lifetime.
export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false, // manual pageview capture on route change -- App Router has no full reload
    capture_pageleave: true,
  });
  initialized = true;
}

export { posthog };
