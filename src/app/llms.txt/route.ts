import { SITE } from "@/lib/jobs-server";
import { COMBO_FROM_RUPEES, MOCK_INTERVIEW_RUPEES, RESUME_FROM_RUPEES, inr } from "@/lib/edge-prices";
import { PAID_CALL_RUPEES, PAID_CALL_WORKING_DAYS } from "@/lib/paid-call";

export const revalidate = 86400;

// A plain-text summary for AI assistants and crawlers (the llms.txt convention): who StaffAnchor is, what jobseekers can
// buy, what it costs and where to book. Prices come from the same constants as the promotions.
export function GET() {
  const body = `# StaffAnchor

> StaffAnchor is an India-based recruitment firm specialising in sales and revenue roles. jobs.staffanchor.com lists live sales roles, and StaffAnchor Edge offers paid 1:1 career services for sales professionals, led by founder Gagan Sharma, who has built and led sales teams for 15+ years.

## StaffAnchor Edge: paid services for jobseekers (all prices in INR, GST included)

- [Interview Prep + Mock Interview](${SITE}/edge/book/mock-interview): ${inr(MOCK_INTERVIEW_RUPEES)}. A 60-minute 1:1 video session for a sales or leadership role: interview prep, a full mock interview loop (discovery on your numbers, a team or pipeline scenario, tough questions on gaps and attrition) and a plain debrief on where you would be screened out.
- [Resume Writing](${SITE}/resume-writing): from ${inr(RESUME_FROM_RUPEES)}, by years of experience: ${inr(RESUME_FROM_RUPEES)} for 0-5 years, ₹1,999 for 6-12 years, ₹2,999 for 13+ years. ATS-friendly, delivered as Word and PDF, first draft within 3 working days of the candidate's details.
- [Job Strategy + Resume Rebuild](${SITE}/edge/book/job-search-strategy): from ${inr(COMBO_FROM_RUPEES)} (${inr(COMBO_FROM_RUPEES)} early stage, ₹2,799 mid level, ₹3,999 senior). A 45-minute strategy session plus resume writing for the candidate's experience level, 20% off the two together.
- [Recruiter call](${SITE}/jobs): ${inr(PAID_CALL_RUPEES)}. Apply to any open role and add a recruiter call: a StaffAnchor recruiter phones within ${PAID_CALL_WORKING_DAYS} working days for a one-to-one profile discussion, whether or not that role is a match. Refunded if the call does not happen in time.

Overview of all services: ${SITE}/edge

## Jobs and tools

- [Open sales roles](${SITE}/jobs): live roles from companies hiring now, free to apply.
- [Salary benchmarks](${SITE}/salary): pay ranges for sales roles.
- [Free ATS resume score checker](${SITE}/ats-score)
- [Free AI mock interview practice](${SITE}/mock-interview)

## Notes

- Bookings need no account: a name, email and mobile number. Payment is online (Razorpay) and a tax invoice is issued for every payment.
- The services are built for sales and revenue professionals, from BDRs to leaders.
- Contact: info@staffanchor.com
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
