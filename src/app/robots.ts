import type { MetadataRoute } from "next";
import { SITE } from "@/lib/jobs-server";

const PRIVATE = ["/api/", "/candidate-portal", "/client-portal", "/refer/", "/passport/"];
// Search and AI assistants that read the public pages to answer questions and recommend services. They get the same
// access as everyone else; listing them only makes that explicit.
const ASSISTANTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-User", "Claude-SearchBot", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: ASSISTANTS, allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
