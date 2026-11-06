# Recipe: Phase 5, Visual design and working prototype

## Goal
Turn the approved wireframes into the final look and deliver a working HTML prototype.

## Inputs to use
The approved wireframes, and the **design style**: colours, fonts, sizes, and ready-made parts from the team's Figma file or brand guide. If no style was given, use a clean neutral style and say "Not matched to a design system".

## Steps
1. Keep the approved layout. Apply the design style to every screen and state.
2. Use realistic content, including very long names and empty values.
3. Make every link and button work so a person can complete the main task.
4. Check colour contrast (at least 4.5:1 for normal text), tap sizes (at least 44px), and text size.
5. Check for manipulative design (hidden costs, guilt-trip wording, tricky defaults).
6. Add a small label on every screen: "Prototype. Not the final product."

## Rules
- One self-contained HTML file. All CSS and JavaScript inside. No external links.
- Works on phone and laptop.
- Only use colours and text styles from the design style. List anything you had to add.

## Output (JSON only)
{
  "plan": { "will_do": ["..."], "will_skip": [{ "item": "...", "why": "..." }] },
  "design_checks": { "contrast": "...", "tap_sizes": "...", "manipulative_design": "...", "style_match": "Matches your design style: 95%", "off_style_items": ["..."] },
  "cover_note": { "what_was_built": "...", "what_was_guessed": ["..."], "not_tested_yet": ["..."] },
  "html": "<!doctype html>... the full working prototype ...",
  "things_i_guessed": [{ "guess": "...", "risk_if_wrong": "...", "how_to_check": "..." }],
  "what_i_did": ["..."],
  "checkin": { "what_i_made": "...", "not_sure_about": ["..."], "another_view": "..." }
}
