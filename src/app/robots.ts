import type { MetadataRoute } from "next";
import { SITE } from "@/lib/jobs-server";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/candidate-portal", "/client-portal", "/refer/", "/passport/"] }],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
