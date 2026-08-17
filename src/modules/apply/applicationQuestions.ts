import { supabase } from "@/lib/supabaseClient";

// Candidate-facing screening questions a recruiter sets up per mandate in
// the CRM (Sales & Public Listing tab -> Application Questions), e.g. "What
// is your current fixed CTC?" (numeric) or "Are you comfortable with night
// shifts?" (yes/no). Read via the public get_mandate_screening_questions()
// RPC (SECURITY DEFINER, only returns questions for OPEN mandates) rather
// than a direct table select, same pattern as listOpenJobs() -> the anon key
// never gets a policy onto mandate_screening_questions itself.
export type ApplicationQuestion = {
  id: string;
  question_text: string;
  answer_type: "short_answer" | "yes_no" | "numeric";
  is_required: boolean;
  display_order: number;
};

export async function fetchApplicationQuestions(mandateId: string): Promise<ApplicationQuestion[]> {
  const { data, error } = await supabase.rpc("get_mandate_screening_questions", { p_mandate_id: mandateId });
  if (error) {
    // Non-fatal: a candidate should never be blocked from applying because
    // this optional extra couldn't load.
    console.error("Failed to load application questions", error);
    return [];
  }
  return (data ?? []) as ApplicationQuestion[];
}

// Shape quick_apply()'s p_screening_answers param expects -- see the
// add_mandate_screening_questions_v2 / quick_apply_accept_screening_answers
// migrations.
export type ApplicationAnswerPayload = {
  question_id: string;
  answer_text: string | null;
  answer_number: number | null;
  answer_bool: boolean | null;
};

export function buildAnswerPayload(
  questions: ApplicationQuestion[],
  answers: Record<string, string>
): ApplicationAnswerPayload[] {
  return questions
    .filter((q) => (answers[q.id] ?? "").trim() !== "")
    .map((q) => {
      const raw = answers[q.id].trim();
      return {
        question_id: q.id,
        answer_text: q.answer_type === "short_answer" ? raw : null,
        answer_number: q.answer_type === "numeric" ? Number(raw) : null,
        answer_bool: q.answer_type === "yes_no" ? raw === "yes" : null,
      };
    });
}
