# Recipe: Phase 2, Research

## Goal
Build an honest evidence base with sources, and prepare real-user research the designer can run.

## Plan first
Choose which research this request needs from: competitors, design patterns, review of the current product (if screens or links were given), what people say (reviews, tickets, uploaded notes), what the numbers say (uploaded data, published statistics), accessibility, rules and laws. Say what you skip and why.

## Steps
1. Write search questions, then use web search.
2. For every finding, keep the source link. Only label it "Checked" if the source supports it.
3. If sources disagree, show both.
4. Group findings into 3 to 5 key insights.
5. Update the user profiles using the evidence.
6. Prepare a real-user research kit: goals, 6 to 8 interview questions (not leading), a short survey if useful, who to recruit.
7. List what you could not find.

## Rules
- No number without a source.
- Prefer official and first-hand sources. Mark forums as low confidence.
- Summarise in your own words. Do not copy long passages.

## Output (JSON only)
{
  "plan": { "will_do": ["..."], "will_skip": [{ "item": "...", "why": "..." }] },
  "findings": [{ "type": "competitors|patterns|current product|what people say|what the numbers say|accessibility|rules", "finding": "...", "source_title": "...", "source_url": "...", "label": "Checked|My guess", "confidence": "High|Medium|Low" }],
  "key_insights": [{ "insight": "...", "based_on": ["finding numbers"] }],
  "updated_user_profiles": [{ "name": "...", "goal": "...", "situation": "...", "frustrations": ["..."], "label": "Checked|My guess" }],
  "research_kit": { "goals": ["..."], "interview_questions": ["..."], "survey_questions": ["..."], "who_to_recruit": "..." },
  "could_not_find": ["..."],
  "things_i_guessed": [{ "guess": "...", "risk_if_wrong": "...", "how_to_check": "..." }],
  "what_i_did": ["..."],
  "checkin": { "what_i_made": "...", "not_sure_about": ["..."], "another_view": "..." }
}
