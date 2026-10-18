import type { JobListing } from "@/modules/jobs/api";
import { SITE } from "@/lib/jobs-server";

// What search engines and job feeds are told about a role. Only LIVE roles are ever listed: a "pipeline" role is a
// role we shortlist for, not an open vacancy, and Google removes sites that post vacancies that do not exist.

export const isLive = (j: { listing_kind?: string | null }) => j.listing_kind !== "pipeline";

/** The one canonical address for a role. */
export const canonicalPath = (j: { id: string; short_code?: string | null }) => (j.short_code ? `/j/${j.short_code}` : `/jobs/${j.id}`);
export const canonicalUrl = (j: { id: string; short_code?: string | null }) => `${SITE}${canonicalPath(j)}`;

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cities = (j: JobListing) => (j.cities?.length ? j.cities : j.city ? [j.city] : []);

/** The full description as simple HTML (paragraphs only), the way Google wants it. */
export function descriptionHtml(j: JobListing): string {
  const parts: [string | null, string | null | undefined][] = [
    [null, j.jd_overview],
    ["Responsibilities", j.jd_responsibilities],
    ["Who we are looking for", j.jd_candidate_profile],
    ["Compensation and benefits", j.jd_compensation_benefits],
  ];
  const blocks = parts
    .filter(([, text]) => !!text && text.trim())
    .map(([title, text]) => `${title ? `<p><strong>${esc(title)}</strong></p>` : ""}${(text as string).trim().split(/\n{1,}/).filter(Boolean).map((l) => `<p>${esc(l.trim())}</p>`).join("")}`);
  if (blocks.length) return blocks.join("");
  const jd = (j.job_description ?? "").trim();
  return jd ? jd.split(/\n+/).filter(Boolean).map((l) => `<p>${esc(l.trim())}</p>`).join("") : `<p>${esc(j.role_title ?? "Sales role")}. Apply to hear the full details from a StaffAnchor recruiter.</p>`;
}

export function descriptionText(j: JobListing, max = 300): string {
  const html = descriptionHtml(j).replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
  return html.length > max ? `${html.slice(0, max - 1).trimEnd()}…` : html;
}

const LAKH = 100_000;

/** schema.org JobPosting, as Google for Jobs reads it. Pay is included only when the role states it. */
export function jobPostingJsonLd(j: JobListing) {
  const locs = cities(j);
  const remote = /remote/i.test(j.work_mode ?? "");
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: j.role_title ?? "Sales role",
    description: descriptionHtml(j),
    datePosted: new Date(j.created_at).toISOString().slice(0, 10),
    employmentType: "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: j.client_display || "StaffAnchor", sameAs: j.client_display ? undefined : "https://staffanchor.com" },
    jobLocation: (locs.length ? locs : ["India"]).map((c) => ({ "@type": "Place", address: { "@type": "PostalAddress", addressLocality: c === "India" ? undefined : c, addressCountry: "IN" } })),
    directApply: false,
    url: canonicalUrl(j),
    identifier: { "@type": "PropertyValue", name: "StaffAnchor", value: j.short_code ?? j.id },
  };
  if (remote) {
    ld.jobLocationType = "TELECOMMUTE";
    ld.applicantLocationRequirements = { "@type": "Country", name: "IN" };
  }
  if (j.budget_min || j.budget_max) {
    const min = j.budget_min ?? j.budget_max!;
    const max = j.budget_max ?? j.budget_min!;
    ld.baseSalary = { "@type": "MonetaryAmount", currency: "INR", value: { "@type": "QuantitativeValue", minValue: Math.round(min * LAKH), maxValue: Math.round(max * LAKH), unitText: "YEAR" } };
  }
  if (j.experience_min && j.experience_min > 0) ld.experienceRequirements = { "@type": "OccurrenceOfExperience", monthsOfExperience: Math.round(j.experience_min * 12) };
  return ld;
}

/** JSON for a <script> tag: "<" is escaped so a description can never close the tag early. */
export const jsonLdString = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
