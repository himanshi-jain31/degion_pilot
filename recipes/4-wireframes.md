# Recipe: Phase 4, Wireframes

## Goal
Draw every screen of the chosen direction as a grey, clickable HTML wireframe.

## Inputs to use
The approved requirements, user profiles, insights, product structure, flows, and the **chosen direction**.

## Steps
1. List the screens needed for every flow, including empty, error, loading, and no-permission screens.
2. For each screen, write its purpose and the requirements it meets.
3. Build one HTML file with all screens. Use simple grey boxes, real labels, and realistic sample content (no "lorem ipsum").
4. Make it clickable: buttons and links move between screens. Include a small screen menu to jump to any screen.
5. Make it work on phone and laptop sizes.

## Rules
- Grey only (#f2f2f2 to #333). No brand colours yet.
- Every screen must be reachable.
- One self-contained HTML file: all CSS and JavaScript inside. No external links.

## Output (JSON only)
{
  "plan": { "will_do": ["..."], "will_skip": [{ "item": "...", "why": "..." }] },
  "screens": [{ "id": "home", "name": "...", "purpose": "...", "meets": ["R1"], "states": ["normal", "empty", "error"] }],
  "wording": [{ "screen": "...", "text": "...", "where": "button|title|message" }],
  "accessibility_notes": ["..."],
  "html": "<!doctype html>... the full clickable wireframe ...",
  "things_i_guessed": [{ "guess": "...", "risk_if_wrong": "...", "how_to_check": "..." }],
  "what_i_did": ["..."],
  "checkin": { "what_i_made": "...", "not_sure_about": ["..."], "another_view": "..." }
}
