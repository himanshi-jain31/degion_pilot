export const PHASES = [
  { n: 1, name: "Understand", recipe: "1-understand.md" },
  { n: 2, name: "Research", recipe: "2-research.md" },
  { n: 3, name: "Ideate", recipe: "3-ideate.md" },
  { n: 4, name: "Wireframes", recipe: "4-wireframes.md" },
  { n: 5, name: "Visual design", recipe: "5-visual-design.md" },
  { n: 6, name: "Testing", recipe: "6-testing.md" },
];

// Phases that are built so far
export const BUILT_PHASES = [1, 2, 3, 4, 5, 6];

export function phaseByNumber(n: number) {
  return PHASES.find((p) => p.n === n);
}

// Plain-words goal and deliverables for each step. This is the same for every project.
export const PHASE_INFO: Record<number, { goal: string; makes: string[] }> = {
  1: { goal: "Make sure I understood what you need.", makes: ["Brief", "User profiles", "Requirements", "Things you may not have asked about"] },
  2: { goal: "Find out what already exists and what people need.", makes: ["Competitors and patterns", "What people say", "What the numbers say", "Accessibility"] },
  3: { goal: "Shape the product and pick a direction.", makes: ["Product structure", "User flows", "User journeys", "2 to 3 directions"] },
  4: { goal: "Draw every screen in grey, clickable form.", makes: ["Wireframes of every screen and state"] },
  5: { goal: "Give it the final look.", makes: ["Working HTML prototype"] },
  6: { goal: "Check it with real people.", makes: ["Test plan and script", "Analysis of your test notes", "Suggested fixes"] },
};
