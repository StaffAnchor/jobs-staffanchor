"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApplicationQuestion } from "./applicationQuestions";

// Shown right before the actual submit, on both the anonymous (ApplyForm)
// and signed-in (SignedInApplyCard) Quick Apply paths -- a mandate with
// custom screening questions gates the final "Apply" click on answering
// them first, instead of weaving them into either of those already-large
// components' own step logic.
export default function ApplicationQuestionsModal({
  mandateTitle,
  questions,
  submitting,
  onCancel,
  onSubmit,
}: {
  mandateTitle?: string;
  questions: ApplicationQuestion[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (answers: Record<string, string>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  function set(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleContinue() {
    for (const q of questions) {
      if (q.is_required && !(answers[q.id] ?? "").trim()) {
        setError(`Please answer: ${q.question_text}`);
        return;
      }
      if (q.answer_type === "numeric" && answers[q.id] && Number.isNaN(Number(answers[q.id]))) {
        setError(`Please enter a number for: ${q.question_text}`);
        return;
      }
    }
    setError(null);
    onSubmit(answers);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-1 flex items-start justify-between">
          <h2 className="text-lg font-bold text-slate-950">A few quick questions</h2>
          <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {mandateTitle ? `Before you apply for ${mandateTitle}` : "Before you apply"}, the hiring team asked us to
          collect a few details.
        </p>

        <div className="space-y-4">
          {questions.map((q) => (
            <div key={q.id}>
              <label className="mb-1.5 block text-[13px] font-medium text-slate-700">
                {q.question_text}
                {q.is_required && <span className="ml-0.5 text-red-500">*</span>}
              </label>
              {q.answer_type === "yes_no" ? (
                <div className="flex gap-2">
                  {(["yes", "no"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => set(q.id, opt)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition ${
                        answers[q.id] === opt
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type={q.answer_type === "numeric" ? "number" : "text"}
                  value={answers[q.id] ?? ""}
                  onChange={(e) => set(q.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  placeholder={q.answer_type === "numeric" ? "Enter a number" : "Your answer"}
                />
              )}
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleContinue} disabled={submitting}>
            {submitting ? "Submitting..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
