import { getOpenJobsServer, SITE } from "@/lib/jobs-server";
import { canonicalUrl, descriptionHtml, isLive, stateFor } from "@/lib/job-seo";
import { categoryLabel } from "@/modules/jobs/api";

export const revalidate = 3600;

const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
const LAKH = 100_000;

// One XML feed of LIVE roles in the format Indeed, Jooble, Talent.com, Careerjet and similar sites read. Give each of
// them this address once; they re-read it on their own schedule.
export async function GET() {
  const jobs = (await getOpenJobsServer()).filter(isLive);
  const items = jobs
    .map((j) => {
      const city = (j.cities?.length ? j.cities[0] : j.city) ?? "";
      const salary = j.budget_min || j.budget_max ? `${Math.round((j.budget_min ?? j.budget_max!) * LAKH)}-${Math.round((j.budget_max ?? j.budget_min!) * LAKH)} INR per year` : "";
      return `  <job>
    <title>${cdata(j.role_title ?? "Sales role")}</title>
    <date>${cdata(new Date(j.created_at).toUTCString())}</date>
    <referencenumber>${cdata(j.short_code ?? j.id)}</referencenumber>
    <url>${cdata(canonicalUrl(j))}</url>
    <company>${cdata(j.client_display || "StaffAnchor")}</company>
    <city>${cdata(city)}</city>
    <state>${cdata(stateFor(city) ?? "")}</state>
    <country>${cdata("IN")}</country>
    <description>${cdata(descriptionHtml(j))}</description>
    <salary>${cdata(salary)}</salary>
    <jobtype>${cdata("fulltime")}</jobtype>
    <category>${cdata(categoryLabel(j.category))}</category>
    <experience>${cdata(j.experience_min != null ? `${j.experience_min}${j.experience_max ? `-${j.experience_max}` : "+"} years` : "")}</experience>
  </job>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<source>
  <publisher>StaffAnchor</publisher>
  <publisherurl>${SITE}</publisherurl>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
</source>`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, s-maxage=3600, stale-while-revalidate=600" } });
}
