import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

// Free, no-signup practice tool for candidates: pick a sales interview
// question, type an answer, get instant AI feedback -- same idea as
// GoodSpace's AI Mock Interview, but scoped to sales-specific scenarios
// (objection handling, discovery calls, pitching) since that's StaffAnchor's
// actual specialization, not a generic interview-prep product.
//
// Reuses the same Gemini setup as ai-passport.ts (GEMINI_API_KEY, same model
// fallback list) rather than a new integration. Entirely stateless -- no
// candidate identity, no DB write. This is a top-of-funnel engagement tool,
// not part of the application pipeline.
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "This tool isn't fully configured yet (missing GEMINI_API_KEY on the server)." },
      { status: 503 }
    );
  }

  let body: { question?: string; answer?: string; category?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  const category = typeof body.category === "string" ? body.category : "general";

  if (!question || answer.length < 20) {
    return NextResponse.json(
      { error: "Write a fuller answer (at least a couple of sentences) before requesting feedback." },
      { status: 400 }
    );
  }
  if (answer.length > 4000) {
    return NextResponse.json({ error: "That answer is too long — try to keep it under ~600 words." }, { status: 400 });
  }

  const prompt = `You are an experienced sales hiring manager giving a candidate constructive, specific feedback on a practice interview answer. Be encouraging but honest -- vague praise helps no one. This is for a "${category}" sales interview question.

Question asked: "${question}"

Candidate's answer:
"""
${answer}
"""

Return ONLY raw JSON (no markdown fence, no commentary) matching this exact shape:
{
  "score": <integer 1-10, how strong this answer would land with a real sales hiring manager>,
  "strengths": [<0-3 short strings, specific things the answer did well -- omit generic praise like "good communication" unless genuinely evidenced>],
  "improvements": [<1-3 short, concrete, actionable suggestions -- what specifically to add, cut, or restructure>],
  "modelAnswerTip": <one short sentence naming the single highest-leverage thing to fix, phrased as encouragement not criticism>
}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

  let lastError: unknown = null;
  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const raw = result.response.text().trim();
      const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
      const parsed = JSON.parse(cleaned) as {
        score?: number;
        strengths?: string[];
        improvements?: string[];
        modelAnswerTip?: string;
      };

      return NextResponse.json({
        score: typeof parsed.score === "number" ? Math.max(1, Math.min(10, Math.round(parsed.score))) : null,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : [],
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 3) : [],
        modelAnswerTip: typeof parsed.modelAnswerTip === "string" ? parsed.modelAnswerTip : null,
      });
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  console.error("Mock interview feedback generation failed on every model", lastError);
  return NextResponse.json(
    { error: "Couldn't generate feedback right now — please try again in a moment." },
    { status: 502 }
  );
}
