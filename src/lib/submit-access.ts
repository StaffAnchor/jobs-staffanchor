// Who may write to an existing candidate profile through /api/candidate-submit.
//
// The endpoint is public (anonymous visitors register and apply through it), so
// it must never let an anonymous caller who merely knows an email address
// change that person's profile -- or learn the profile's internal id, which
// other functions treat as a read key.
//
//  - Nothing exists for this email  -> anyone may create it (new registration).
//  - A profile or sign-in account already exists, and the caller is:
//      * signed in as that same email           -> allowed (the owner)
//      * holding that profile's own completion link (a recruiter-sent
//        /register?ref=<id>, whose id is an unguessable capability) -> allowed
//      * anyone else                            -> refused: sign in first.

export type SubmitAccessInput = {
  // true when a candidates row OR an auth account already exists for the email
  emailInUse: boolean;
  // verified email of the signed-in caller (from a validated session token), lowercased
  callerEmail: string | null;
  payloadEmail: string;
  // candidates.id of the existing row for this email, if any
  existingCandidateId: string | null;
  // id the caller says they hold a completion link for
  completionRef: string | null;
};

export type SubmitAccessDecision = { allowed: true } | { allowed: false; reason: "PROFILE_EXISTS" };

export function decideSubmitAccess(i: SubmitAccessInput): SubmitAccessDecision {
  if (!i.emailInUse) return { allowed: true };
  if (i.callerEmail && i.callerEmail === i.payloadEmail.trim().toLowerCase()) return { allowed: true };
  if (i.completionRef && i.existingCandidateId && i.completionRef === i.existingCandidateId) return { allowed: true };
  return { allowed: false, reason: "PROFILE_EXISTS" };
}
