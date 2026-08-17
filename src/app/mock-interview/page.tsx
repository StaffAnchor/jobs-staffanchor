"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { CATEGORY_LABEL, QUESTIONS, randomQuestion, type MockInterviewCategory } from "@/modules/mock-interview/questions";

type Feedback = {
  score: number | null;
  strengths: string[];
  improvements: string[];
  modelAnswerTip: string | null;
};

// Free, no-signup practice tool -- a candidate picks a sales scenario,
// answers a real interview-style question, and gets instant AI feedback.
// Deliberately stateless and public: no account needed to try it, matching
// the "free career tool" pattern used to bring candidates in the door
// before ever asking for a profile. The one CTA at the bottom nudges toward
// Build My Profile, but the tool itself works with zero commitment.
export default function MockInterviewPage() {
  const [category, setCategory] = useState<MockInterviewCategory>("general");
  const [question, setQuestion] = useState(() => randomQuestion("general"));
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCategoryChange(next: MockInterviewCategory) {
    setCategory(next);
    setQuestion(randomQuestion(next));
    setAnswer("");
    setFeedback(null);
    setError(null);
  }

  function shuffleQuestion() {
    setQuestion(randomQuestion(category));
    setAnswer("");
    setFeedback(null);
    setError(null);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch("/api/mock-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, question, answer }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setFeedback(data);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-page py-12 md:py-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-800">
            <Sparkles className="h-3.5 w-3.5" />
            Free practice tool
          </div>
          <h1 className="mt-4 font-(family-name:--font-space-grotesk) text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            AI Sales Mock Interview
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Practice answering real sales interview questions — discovery calls, objection handling, pitching, and
            closing — and get instant, specific feedback before your next interview. No sign-up needed.
          </p>
        </div>
      </section>

      <section className="container-page grid gap-6 py-10 lg:grid-cols-[1fr_1fr] lg:items-start">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Scenario
              </label>
              <Select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as MockInterviewCategory)}
              >
                {(Object.keys(QUESTIONS) as MockInterviewCategory[]).map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABEL[key]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold leading-6 text-slate-900">{question}</p>
                <button
                  type="button"
                  onClick={shuffleQuestion}
                  className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-white hover:text-slate-700"
                  title="Try a different question"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Your answer
              </label>
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer as you would in a real interview — a couple of sentences to a short paragraph works best."
                className="min-h-[160px]"
                maxLength={4000}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button onClick={handleSubmit} disabled={submitting || answer.trim().length < 20} className="w-full">
              {submitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" /> Getting feedback...
                </>
              ) : (
                "Get AI Feedback"
              )}
            </Button>
          </div>
        </Card>

        <div>
          {!feedback && !submitting && (
            <Card className="flex h-full min-h-[280px] flex-col items-center justify-center gap-2 border-dashed p-6 text-center text-sm text-slate-400">
              <Sparkles className="h-6 w-6 text-slate-300" />
              Your feedback will appear here once you submit an answer.
            </Card>
          )}

          {submitting && (
            <Card className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 p-6">
              <Spinner className="h-6 w-6" />
              <p className="text-sm text-slate-500">Reviewing your answer like a sales hiring manager would...</p>
            </Card>
          )}

          {feedback && !submitting && (
            <Card className="p-6">
              {feedback.score !== null && (
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-indigo-600 text-lg font-bold text-indigo-700">
                    {feedback.score}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      How this would land
                    </p>
                    <p className="text-sm text-slate-600">out of 10</p>
                  </div>
                </div>
              )}

              {feedback.strengths.length > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    What worked
                  </p>
                  <ul className="space-y-1">
                    {feedback.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements.length > 0 && (
                <div className="mb-4">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-700">
                    What to sharpen
                  </p>
                  <ul className="space-y-1">
                    {feedback.improvements.map((s) => (
                      <li key={s} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.modelAnswerTip && (
                <div className="rounded-xl bg-indigo-50 p-3 text-sm text-indigo-900">{feedback.modelAnswerTip}</div>
              )}
            </Card>
          )}

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">Ready to put this into practice?</p>
            <Link href="/register">
              <Button variant="outline" className="rounded-full">
                Build My Profile <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
