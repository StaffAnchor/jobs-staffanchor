"use client";

import { useEffect } from "react";
import { trackStep } from "@/lib/edge-step";

// Records that someone opened the Edge page, so the step before the booking pages can be counted.
export default function EdgeViewTracker({ src }: { src: string }) {
  useEffect(() => {
    trackStep("edge", "edge-page", "view", { src });
  }, [src]);
  return null;
}
