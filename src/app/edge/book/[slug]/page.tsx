import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProService } from "@/lib/jobs-server";
import BookingClient from "./booking-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = await getProService((await params).slug);
  return { title: s ? `${s.title} | StaffAnchor` : "Book a session | StaffAnchor", description: s?.tagline ?? undefined, robots: { index: false } };
}

// Public booking page. No account or login is needed: a name, email and mobile number are enough.
export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const service = await getProService((await params).slug);
  if (!service) notFound();
  return (
    <Suspense fallback={null}>
      <BookingClient service={service} />
    </Suspense>
  );
}
