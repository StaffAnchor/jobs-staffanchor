import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The paid Priority Applicant product was replaced by the ₹99 recruiter call on the job pages.
  async redirects() {
    return [{ source: "/priority-applicant", destination: "/jobs", permanent: true }];
  },
};

export default nextConfig;
