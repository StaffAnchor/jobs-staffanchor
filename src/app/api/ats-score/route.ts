import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractResumeText } from "@/lib/resume-text";

export const runtime = "nodejs";

// Free, no-signup "ATS Score Checker" -- pairs with the AI Mock Interview
// tool as a lead-gen free tool for jobseekers. Accepts a resume file
// (mirrors parse-resume-preview's extraction path) and an optional target
// job description; returns a 0-100 match/health score plus specific,
// actionable gaps. Nothing is persisted -- this is a stateless scoring
// pass, not part of the candidate profile pipeline.
const MAX_BYTES = 10 * 1024 * 1024;

export type AtsScoreResult = {
  score: number;
  scoreLabel: string;
  matchedKeywords: string[];
  missingKeywords: string[];
  formattingIssues: string[];
  strengths: string[];
  recommendations: string[];
};

function parseJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function asStringArray(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("resume");
    const jobDescription = typeof form.get("jobDescription") === "string" ? (form.get("jobDescription") as string) : "";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a resume file (PDF or DOCX)." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Please upload a resume under 10MB." }, { status: 400 });
    }
    if (!/\.(pdf|docx)$/i.test(file.name)) {
      return NextResponse.json({ error: "Please upload a .pdf or .docx file." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = await extractResumeText(buffer, file.name);
    if (!text?.trim()) {
      return NextResponse.json(
        { error: "Couldn't read text from that file. It may be a scanned/image-only PDF -- try a text-based export instead." },
        { status: 422 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "This tool isn't fully configured yet (missing GEMINI_API_KEY on the server)." },
        { status: 503 }
      );
    }

    const hasJd = jobDescription.trim().length > 20;

    const prompt = hasJd
      ? `You are an ATS (Applicant Tracking System) resume screener evaluating fit for a specific sales role. Score how well this resume matches the target job description.

Return ONLY a JSON object (no markdown fence, no commentary) shaped exactly like:
{
  "score": number (0-100),
  "scoreLabel": string (a short 2-4 word verdict, e.g. "Strong match", "Needs work"),
  "matchedKeywords": string[] (up to 10 skills/terms from the job description that ARE present in the resume),
  "missingKeywords": string[] (up to 8 important skills/terms from the job description that are MISSING from the resume),
  "formattingIssues": string[] (up to 5 issues that could trip up automated resume parsers -- e.g. missing dates, no clear section headers, tables/columns, inconsistent formatting; empty array if none found),
  "strengths": string[] (up to 4 things this resume does well for this specific role),
  "recommendations": string[] (up to 5 specific, actionable changes to improve the match score)
}

Rules:
- Be specific and grounded in the actual resume text -- don't invent skills that aren't there.
- score should reflect genuine keyword/experience overlap with the job description, not general resume quality alone.
- Keep each string concise (under 20 words).

Job description:
${jobDescription.slice(0, 6000)}

Resume text:
${text.slice(0, 12000)}`
      : `You are an ATS (Applicant Tracking System) resume health checker. No specific job description was provided, so evaluate this resume for general ATS-parsability and sales-resume best practices.

Return ONLY a JSON object (no markdown fence, no commentary) shaped exactly like:
{
  "score": number (0-100),
  "scoreLabel": string (a short 2-4 word verdict, e.g. "Solid foundation", "Needs work"),
  "matchedKeywords": string[] (up to 10 strong, quantifiable sales/professional keywords or achievements already present -- e.g. "Exceeded quota by 120%", "Salesforce"),
  "missingKeywords": string[] (up to 8 commonly-expected elements missing for a strong sales resume -- e.g. "Quantified achievements", "Quota attainment numbers", "Contact info"),
  "formattingIssues": string[] (up to 5 issues that could trip up automated resume parsers -- e.g. missing dates, no clear section headers, tables/columns; empty array if none found),
  "strengths": string[] (up to 4 things this resume does well),
  "recommendations": string[] (up to 5 specific, actionable changes to improve ATS-friendliness and impact)
}

Rules:
- Be specific and grounded in the actual resume text -- don't invent content that isn't there.
- Keep each string concise (under 20 words).

Resume text:
${text.slice(0, 12000)}`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

    let lastError: unknown = null;
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const raw = result.response.text().trim();
        const parsed = parseJson(raw);
        if (!parsed) {
          lastError = new Error("Model response was not valid JSON.");
          continue;
        }

        const score =
          typeof parsed.score === "number" && Number.isFinite(parsed.score)
            ? Math.max(0, Math.min(100, Math.round(parsed.score)))
            : null;
        if (score === null) {
          lastError = new Error("Model response missing a valid score.");
          continue;
        }

        const response: AtsScoreResult = {
          score,
          scoreLabel: typeof parsed.scoreLabel === "string" && parsed.scoreLabel.trim() ? parsed.scoreLabel.trim() : "",
          matchedKeywords: asStringArray(parsed.matchedKeywords, 10),
          missingKeywords: asStringArray(parsed.missingKeywords, 8),
          formattingIssues: asStringArray(parsed.formattingIssues, 5),
          strengths: asStringArray(parsed.strengths, 4),
          recommendations: asStringArray(parsed.recommendations, 5),
        };
        return NextResponse.json(response);
      } catch (err) {
        lastError = err;
        console.error(`ATS score generation failed with model ${modelName}`, err);
      }
    }

    console.error("All ATS score models failed", lastError);
    return NextResponse.json({ error: "Couldn't score your resume right now. Please try again in a moment." }, { status: 502 });
  } catch (err) {
    console.error("ats-score route failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
