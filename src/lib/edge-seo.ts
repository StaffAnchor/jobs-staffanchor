import { SITE } from "@/lib/jobs-server";
import { COMBO_FROM_RUPEES, MOCK_INTERVIEW_RUPEES, RESUME_FROM_RUPEES } from "@/lib/edge-prices";
import { PAID_CALL_RUPEES, PAID_CALL_WORKING_DAYS } from "@/lib/paid-call";

// Structured data for the Edge and resume pages, so search engines and AI assistants can read what is offered, for whom
// and at what price. Only facts that are on the pages themselves: no ratings or reviews, because there are none to show.

const ORG = { "@type": "Organization", "@id": `${SITE}/#org`, name: "StaffAnchor", url: "https://www.staffanchor.com", logo: `${SITE}/Staffanchor_Logo.svg` };
const GAGAN = { "@type": "Person", "@id": `${SITE}/#gagan`, name: "Gagan Sharma", jobTitle: "Founder, StaffAnchor", image: `${SITE}/gagan-sharma.jpg`, worksFor: { "@id": `${SITE}/#org` }, description: "Has built and led sales teams for 15+ years and managed ₹100-150 Cr+ in revenue." };

const price = (n: number) => ({ "@type": "Offer", priceCurrency: "INR", price: String(n), availability: "https://schema.org/InStock" });
const range = (low: number, high: number) => ({ "@type": "AggregateOffer", priceCurrency: "INR", lowPrice: String(low), highPrice: String(high) });
const service = (name: string, type: string, description: string, url: string, offers: unknown) => ({
  "@type": "Service",
  name,
  serviceType: type,
  description,
  url,
  provider: { "@id": `${SITE}/#org` },
  areaServed: { "@type": "Country", name: "India" },
  audience: { "@type": "Audience", audienceType: "Sales and revenue professionals" },
  offers,
});

export const faqJsonLd = (items: { q: string; a: string }[]) => ({
  "@type": "FAQPage",
  mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
});

export function edgeJsonLd(faq: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORG,
      GAGAN,
      service("Interview Prep + Mock Interview for sales roles", "Interview coaching", "A 60-minute 1:1 video session: interview prep, then a full mock interview loop for the sales or leadership role you are targeting, and a plain debrief on where you would be screened out and how to fix it.", `${SITE}/edge/book/mock-interview`, price(MOCK_INTERVIEW_RUPEES)),
      service("Job Strategy + Resume Rebuild", "Career coaching and resume writing", "A 45-minute 1:1 job search strategy session plus a resume written for your experience level, delivered as Word and PDF. Priced by experience level, 20% off the two together.", `${SITE}/edge/book/job-search-strategy`, range(COMBO_FROM_RUPEES, 3999)),
      service("Resume Writing for sales professionals", "Resume writing", "A professionally written, ATS-friendly resume delivered as Word and PDF, priced by years of experience: early stage, mid level and senior / CXO.", `${SITE}/resume-writing`, range(RESUME_FROM_RUPEES, 2999)),
      service("Recruiter call", "Recruiter profile discussion", `Apply to a role and a StaffAnchor recruiter phones you within ${PAID_CALL_WORKING_DAYS} working days for a one-to-one profile discussion, whether or not that role is a match. Refunded if we miss it.`, `${SITE}/jobs`, price(PAID_CALL_RUPEES)),
      faqJsonLd(faq),
    ],
  };
}

export function resumeJsonLd(faq: { q: string; a: string }[]) {
  const tier = (name: string, p: number) => ({ ...price(p), name });
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORG,
      service("Resume Writing for sales professionals", "Resume writing", "A professionally written, ATS-friendly resume delivered as Word and PDF. First draft within 3 working days of your details.", `${SITE}/resume-writing`, [tier("Early Stage (0-5 years)", 1199), tier("Mid Level (6-12 years)", 1999), tier("Senior / CXO (13+ years)", 2999)]),
      faqJsonLd(faq),
    ],
  };
}
