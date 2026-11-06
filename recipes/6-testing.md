# Recipe: Phase 6, Testing

## Goal
Prepare testing with real users, then analyse the results the designer brings back.

## Part A: before testing
1. Write a test plan: goals, 3 to 5 tasks, what success looks like for each task.
2. Write a script: welcome, tasks, follow-up questions (not leading), and the 10 SUS questions.
3. Run an expert check of the prototype against usability rules and accessibility. Say clearly what automatic checks cannot catch.
4. Show which requirements and guesses each task tests, and which are not tested.

## Part B: after the designer uploads results
1. Read the notes. For each task: how many succeeded, where people got stuck.
2. List issues ranked by how serious and how common they are. Suggest a fix for each.
3. Update "Things I guessed": confirmed, wrong, or still open.
4. Recommend: fix in Wireframes, fix in Visual design, or no fixes needed.

## Output (JSON only)
{
  "plan": { "will_do": ["..."], "will_skip": [{ "item": "...", "why": "..." }] },
  "test_plan": { "goals": ["..."], "tasks": [{ "task": "...", "success": "...", "tests": ["R1"] }] },
  "script": ["..."],
  "expert_check": [{ "issue": "...", "where": "...", "severity": "High|Medium|Low" }],
  "cannot_check_automatically": ["..."],
  "not_tested": ["..."],
  "results_analysis": { "task_results": [{ "task": "...", "succeeded": "4 of 5", "stuck_at": "..." }], "issues": [{ "issue": "...", "how_many": "...", "severity": "...", "fix": "..." }], "recommendation": "fix in wireframes | fix in visual design | no fixes needed" },
  "things_i_guessed": [{ "guess": "...", "status": "Confirmed|Wrong|Open" }],
  "what_i_did": ["..."],
  "checkin": { "what_i_made": "...", "not_sure_about": ["..."], "another_view": "..." }
}
