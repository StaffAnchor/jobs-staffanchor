export type MockInterviewCategory = "discovery" | "objection_handling" | "pitching" | "closing" | "general";

export const CATEGORY_LABEL: Record<MockInterviewCategory, string> = {
  discovery: "Discovery calls",
  objection_handling: "Objection handling",
  pitching: "Pitching",
  closing: "Closing",
  general: "General sales interview",
};

export const QUESTIONS: Record<MockInterviewCategory, string[]> = {
  discovery: [
    "A prospect agrees to a first call but seems distracted and non-committal. How do you open the call to earn their attention?",
    "Walk me through how you'd qualify a prospect in the first 10 minutes of a discovery call.",
    "How do you uncover a prospect's real budget without asking 'what's your budget?' directly?",
  ],
  objection_handling: [
    "A prospect says, 'This is too expensive compared to your competitor.' How do you respond?",
    "You're told, 'We're happy with our current vendor.' What do you say next?",
    "A buyer says, 'Send me some information and I'll get back to you.' How do you handle that?",
  ],
  pitching: [
    "Pitch me a product you've sold in under 60 seconds, as if I'm a busy decision-maker.",
    "How do you tailor your pitch differently for a CFO versus a end-user of the product?",
    "Tell me about a time your pitch failed to land — what did you learn and change?",
  ],
  closing: [
    "A prospect says 'I need to think about it.' How do you move the deal forward without being pushy?",
    "Walk me through how you'd close a deal that's gone quiet for two weeks after a strong first call.",
    "How do you know when to walk away from a deal versus keep pushing?",
  ],
  general: [
    "Tell me about your biggest sales win and what made it successful.",
    "Describe a quarter where you missed quota. What happened and what did you change?",
    "How do you prioritize your pipeline when you're juggling 20+ active deals?",
    "What does a great sales manager do differently from an average one?",
  ],
};

export function randomQuestion(category: MockInterviewCategory): string {
  const pool = QUESTIONS[category];
  return pool[Math.floor(Math.random() * pool.length)];
}
