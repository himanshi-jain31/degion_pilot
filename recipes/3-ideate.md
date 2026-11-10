# Recipe: Phase 3, Ideate

## Goal
Shape the product and offer genuinely different directions to choose from.

## Plan first
Choose what this request needs from: product structure, user flows, user journeys, storyboard, priorities, directions. Say what you skip and why.

## Outputs
1. **Product structure:** a simple sitemap as a nested list.
2. **User flows:** main path, other paths, and error, empty, and no-permission paths. Steps as a list.
3. **User journeys:** one journey map for how the main user does this job **today**, and one for **in the future** with the new product. Each has **5 to 7 stages** from first need to finished outcome (never fewer than 3). The future journey follows the same stages as today, so the two can be compared. Every stage has: a short stage name, what the user does, what they think, how they feel (one or two plain words), a feeling score from 1 (very low) to 5 (very good), and for today a pain point (or empty if none). In the future journey say which pain point a stage fixes, and name one opportunity.
4. **Storyboard:** 4 to 6 short frames of a real situation.
5. **Directions:** 2 or 3 that differ in structure or interaction, not just looks. Include one "flip the constraint" idea. Each direction: name, core idea, key screens, what it is good at, **what it gives up**, effort (Low/Medium/High), risk.
6. **Recommendation:** which direction and why.

## Rules
- Journeys are never a single step. Give 5 to 7 stages. The score must match the feeling words (for example "Unsure" is a 2).
- Every direction must link to the requirements it serves (R1, R2...).
- A direction without "what it gives up" is not allowed.

## Output (JSON only)
{
  "plan": { "will_do": ["..."], "will_skip": [{ "item": "...", "why": "..." }] },
  "product_structure": [{ "page": "...", "children": [{ "page": "..." }] }],
  "user_flows": [{ "name": "...", "type": "main|other|error|empty|no permission", "steps": ["..."] }],
  "journeys": {
    "today": [{ "stage": "...", "step": "what the user does", "thought": "...", "feeling": "...", "score": 1, "pain": "...", "opportunity": "..." }],
    "future": [{ "stage": "same stage name as today", "step": "what the user does", "thought": "...", "feeling": "...", "score": 4, "improves": "which pain point this fixes, or empty" }]
  },
  "storyboard": [{ "frame": 1, "scene": "..." }],
  "directions": [{ "id": "A", "name": "...", "core_idea": "...", "key_screens": ["..."], "good_at": "...", "gives_up": "...", "effort": "Low|Medium|High", "risk": "...", "serves": ["R1"] }],
  "recommendation": { "direction": "A", "why": "..." },
  "things_i_guessed": [{ "guess": "...", "risk_if_wrong": "...", "how_to_check": "..." }],
  "what_i_did": ["..."],
  "checkin": { "what_i_made": "...", "not_sure_about": ["..."], "another_view": "..." }
}
