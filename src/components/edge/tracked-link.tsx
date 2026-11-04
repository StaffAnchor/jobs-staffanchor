"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { trackStep } from "@/lib/edge-step";

// A link that also records the click (which spot on which page), so the CRM can show what brings people into Edge.
export default function TrackedLink({ track, from, ...props }: ComponentProps<typeof Link> & { track: string; from: "home" | "edge" | "promo" }) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackStep(from, track, "click");
        props.onClick?.(e);
      }}
    />
  );
}
