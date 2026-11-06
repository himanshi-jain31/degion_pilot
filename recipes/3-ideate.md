# Recipe: Phase 3, Ideate

## Goal
Shape the product and offer genuinely different directions to choose from.

## Plan first
Choose what this request needs from: product structure, user flows, user journeys, storyboard, priorities, directions. Say what you skip and why.

## Outputs
1. **Product structure:** a simple sitemap as a nested list.
2. **User flows:** main path, other paths, and error, empty, and no-permission paths. Steps as a list.
3. **User journeys:** today and in the future, with steps, feelings, and pain points.
4. **Storyboard:** 4 to 6 short frames of a real situation.
5. **Directions:** 2 or 3 that differ in structure or interaction, not just looks. Include one "flip the constraint" idea. Each direction: name, core idea, key screens, what it is good at, **what it gives up**, effort (Low/Medium/High), risk.
6. **Recommendation:** which direction and why.

## Rules
- Every direction must link to the requirements it serves (R1, R2...).
- A direction without "what it gives up" is not allowed.

## Output (JSON only)
{
  "plan": { "will_do": ["..."], "will_skip": [{ "item": "...", "why": "..." }] },
  "product_structure": [{ "page": "...", "children": [{ "page": "..." }] }],
  "user_flows": [{ "name": "...", "type": "main|other|error|empty|no permission", "steps": ["..."] }],
  "journeys": { "today": [{ "step": "...", "feeling": "...", "pain": "..." }], "future": [{ "step": "...", "feeling": "..." }] },
  "storyboard": [{ "frame": 1, "scene": "..." }],
  "directions": [{ "id": "A", "name": "...", "core_idea": "...", "key_screens": ["..."], "good_at": "...", "gives_up": "...", "effort": "Low|Medium|High", "risk": "...", "serves": ["R1"] }],
  "recommendation": { "direction": "A", "why": "..." },
  "things_i_guessed": [{ "guess": "...", "risk_if_wrong": "...", "how_to_check": "..." }],
  "what_i_did": ["..."],
  "checkin": { "what_i_made": "...", "not_sure_about": ["..."], "another_view": "..." }
}
