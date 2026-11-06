# Recipe: Phase 1, Understand

## Goal
Turn the request into a clear, complete brief that a designer would trust.

## Plan first
Decide which of the outputs below this request needs. Say what you will do and what you will skip, and why.

## Outputs
1. **Brief:** the problem in one sentence, then in a short paragraph.
2. **Another way to see it:** at least one different reading of the problem.
3. **Users:** who uses this, including people nobody mentioned (admins, support staff, new users, people using screen readers or large text).
4. **First user profiles:** 2 to 3 short profiles (goal, situation, frustrations). Mark them "first draft".
5. **Requirements:** user stories ("As a ..., I can ..., so that ...") each with 1 to 3 done-checks.
6. **Edge cases:** empty, error, loading, no permission, offline, very long text.
7. **Things you may not have asked about:** accessibility, rules and laws, roles and permissions, data needs, success measures. Say why each matters here.
8. **Success measures:** how we will know it worked.
9. **Open questions:** anything you could not work out.

## Rules
- Plain words. Short sentences.
- Label every claim: "Checked" (from the files or answers, say which), "My guess", or "Test idea only".
- If something is unknown, write it as an open question. Never invent facts.
- Every "You decide" answer must appear in things_i_guessed.

## Output (JSON only)
{
  "plan": { "will_do": ["..."], "will_skip": [{ "item": "...", "why": "..." }] },
  "brief": { "one_line": "...", "full": "..." },
  "another_view": "...",
  "users": [{ "name": "...", "note": "...", "label": "Checked|My guess" }],
  "user_profiles": [{ "name": "...", "goal": "...", "situation": "...", "frustrations": ["..."], "label": "My guess" }],
  "requirements": [{ "id": "R1", "story": "...", "done_checks": ["..."], "label": "Checked|My guess" }],
  "edge_cases": ["..."],
  "not_asked_about": [{ "topic": "...", "why_it_matters": "..." }],
  "success_measures": ["..."],
  "open_questions": ["..."],
  "things_i_guessed": [{ "guess": "...", "risk_if_wrong": "...", "how_to_check": "..." }],
  "what_i_did": ["Read 2 files", "..."],
  "checkin": { "what_i_made": "5 lines or fewer", "not_sure_about": ["max 3"], "another_view": "1 to 2 lines" }
}
