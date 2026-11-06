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
