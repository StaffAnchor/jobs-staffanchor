import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractResumeText } from "@/lib/resume-text";

export const runtime = "nodejs";

// Live parse-on-upload for the "Build Your Profile" wizard's magical
// resume-triage step. Unlike staffanchor-crm's generateCareerTimelineForCandidate
// (which reads a resume already on a candidate row in Supabase storage), this
// runs BEFORE a candidate row exists at all -- the file comes straight off the
// browser's file input in the request body, nothing is persisted here. The
// wizard uses the returned fields to pre-fill/verify form state; the resume
// itself is still uploaded to storage for real at final submit time, unchanged
// from today's behavior.
export type ParsedResumePreview = {
  full_name: string | null;
  phone: string | null;
  linkedin_url: string | null;
  current_employer: string | null;
  current_job_title: string | null;
  total_experience_years: number | null;
  highest_qualification: string | null;
  current_industry: string | null;
  skills: string[];
  category_guess: "b2b_sales" | "b2c_sales" | "non_sales" | "" | null;
};

const MAX_BYTES = 10 * 1024 * 1024;

function parseJson(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("resume");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No resume file provided." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: "File too large." }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const text = await extractResumeText(buffer, file.name);
    if (!text?.trim()) {
      // Not every resume format we accept is parseable (e.g. a scanned/image-only
      // PDF) -- degrade to "nothing found" rather than erroring the whole wizard.
      return NextResponse.json({ ok: true, skipped: true, fields: null });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ ok: true, skipped: true, fields: null });
    }

    const prompt = `You are pre-filling a job application form from a candidate's resume text. Return ONLY a JSON object (no markdown fence, no commentary) shaped exactly like:
{
  "full_name": string | null,
  "phone": string | null,
  "linkedin_url": string | null,
  "current_employer": string | null,
  "current_job_title": string | null,
  "total_experience_years": number | null,
  "highest_qualification": string | null,
  "current_industry": string | null,
  "skills": string[],
  "category_guess": "b2b_sales" | "b2c_sales" | "non_sales" | ""
}

Rules:
- Only include values you can actually find or confidently infer from the resume text below -- use null (or [] for skills) rather than guessing.
- total_experience_years should be your best estimate of total professional experience in whole years, based on the earliest job start date through today.
- category_guess: "b2b_sales" if their most recent role sells to businesses, "b2c_sales" if selling to individual consumers, "non_sales" if the role isn't a sales role at all, "" if genuinely unclear.
- skills: at most 8 short skill/tool names (e.g. "Salesforce", "Enterprise Sales", "SQL"), not full sentences.
- current_industry: a short industry name (e.g. "SaaS", "BFSI", "EdTech"), not a company name.

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
        const fields: ParsedResumePreview = {
          full_name: typeof parsed.full_name === "string" && parsed.full_name.trim() ? parsed.full_name.trim() : null,
          phone: typeof parsed.phone === "string" && parsed.phone.trim() ? parsed.phone.trim() : null,
          linkedin_url:
            typeof parsed.linkedin_url === "string" && parsed.linkedin_url.trim() ? parsed.linkedin_url.trim() : null,
          current_employer:
            typeof parsed.current_employer === "string" && parsed.current_employer.trim()
              ? parsed.current_employer.trim()
              : null,
          current_job_title:
            typeof parsed.current_job_title === "string" && parsed.current_job_title.trim()
              ? parsed.current_job_title.trim()
              : null,
          total_experience_years:
            typeof parsed.total_experience_years === "number" && Number.isFinite(parsed.total_experience_years)
              ? Math.round(parsed.total_experience_years)
              : null,
          highest_qualification:
            typeof parsed.highest_qualification === "string" && parsed.highest_qualification.trim()
              ? parsed.highest_qualification.trim()
              : null,
          current_industry:
            typeof parsed.current_industry === "string" && parsed.current_industry.trim()
              ? parsed.current_industry.trim()
              : null,
          skills: Array.isArray(parsed.skills) ? parsed.skills.filter((s): s is string => typeof s === "string").slice(0, 8) : [],
          category_guess:
            parsed.category_guess === "b2b_sales" || parsed.category_guess === "b2c_sales" || parsed.category_guess === "non_sales"
              ? parsed.category_guess
              : "",
        };
        return NextResponse.json({ ok: true, fields });
      } catch (err) {
        lastError = err;
        console.error(`Gemini resume-preview extraction failed with model ${modelName}`, err);
      }
    }

    console.error("All resume-preview extraction models failed", lastError);
    return NextResponse.json({ ok: true, skipped: true, fields: null });
  } catch (err) {
    console.error("parse-resume-preview failed", err);
    return NextResponse.json({ ok: false, error: "Could not read resume." }, { status: 500 });
  }
}
