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
export const PHASE_INFO: Record<number, { goal: string; makes: { label: string; icon: string }[] }> = {
  1: { goal: "Make sure I understood what you need.", makes: [{ label: "Brief", icon: "file-text" }, { label: "User profiles", icon: "users" }, { label: "Requirements", icon: "list-checks" }, { label: "Things you may not have asked about", icon: "help" }] },
  2: { goal: "Find out what already exists and what people need.", makes: [{ label: "Competitors and patterns", icon: "search" }, { label: "What people say", icon: "message" }, { label: "What the numbers say", icon: "chart" }, { label: "Accessibility", icon: "eye" }] },
  3: { goal: "Shape the product and pick a direction.", makes: [{ label: "Product structure", icon: "network" }, { label: "User flows", icon: "route" }, { label: "User journeys", icon: "activity" }, { label: "2 to 3 directions", icon: "compass" }] },
  4: { goal: "Draw every screen in grey, clickable form.", makes: [{ label: "Wireframes of every screen and state", icon: "layout" }] },
  5: { goal: "Give it the final look.", makes: [{ label: "Working HTML prototype", icon: "phone" }] },
  6: { goal: "Check it with real people.", makes: [{ label: "Test plan and script", icon: "clipboard" }, { label: "Analysis of your test notes", icon: "chart" }, { label: "Suggested fixes", icon: "wrench" }] },
};
