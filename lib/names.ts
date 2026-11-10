// Short, readable project names (2 to 4 words), made from the main topic of a request

export const capFirst = (t: string) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);

const FILLER = new Set(["a", "an", "the", "our", "my", "your", "one", "some", "this", "that", "new", "simple", "simpler", "tiny", "small", "better", "easy", "easier", "clean", "nice", "basic", "quick", "great", "modern", "whole", "entire", "complete", "full", "proper", "single", "very", "really", "more"]);
const STOP = new Set(["for", "to", "that", "which", "with", "so", "so that", "where", "when", "because", "in", "on", "at", "of", "by", "from", "who", "can", "will", "should", "and", "or", "but", "is", "are", "it", "they", "we", "i", "you", "how", "what", "why", "if", "as", "about"]);
const TYPE_NOUNS = "app|application|flow|flows|system|tool|dashboard|portal|page|pages|screen|screens|form|platform|tracker|planner|site|website|journey|process|workflow|feature|widget|checkout|onboarding|experience|interface|prototype|service|calendar|list|board|booking|manager|assistant";
const VERBS = "design|build|create|make|improve|redesign|develop|prototype|draft|sketch|rethink";
const ASK = new Set(["need", "needs", "want", "wants", "like", "looking", "help", "please", "try", "sample"]);
const GENERIC = new Set(["current", "existing", "screens", "screen", "flow", "flows", "app", "design", "designs", "ui", "ux", "product", "experience", "pages", "page"]);

const words = (s: string) => s.toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9\- ]+/g, " ").split(/\s+/).filter(Boolean);

function shorten(phrase: string): string {
  let w = words(phrase).filter((x) => !FILLER.has(x));
  // "leave request and approval flow" -> "leave request flow": keep the head and the last word
  const and = w.indexOf("and");
  if (and > 0 && and < w.length - 1) w = [...w.slice(0, and), w[w.length - 1]];
  w = w.filter((x) => x !== "and" && x !== "or");
  if (w.length > 4) w = [...w.slice(0, 3), w[w.length - 1]].slice(0, 4);
  return w.join(" ");
}

export function suggestName(text: string, fallback = "New project"): string {
  let t = text.replace(/\s+/g, " ").trim().replace(/\bto do\b/gi, "to-do");
  if (!t) return fallback;
  // "I want to redesign an existing flow: checkout for our shop" or "Keyboard test: a leave app" -> use what comes after the colon
  const colon = t.indexOf(":");
  if (colon > 0 && colon < 60 && t.slice(colon + 1).trim().length >= 6) t = t.slice(colon + 1).trim();

    const forTopic = (rest: string) => {
    const m = rest.match(/\bfor\s+([^.,;:!?]+)/i);
    return m ? words(m[1]).filter((x) => !FILLER.has(x) && !STOP.has(x) && !ASK.has(x)).slice(0, 2) : [];
  };

  // 1. "Design a simpler leave request and approval flow for ..." -> the thing after the verb
  const verb = t.match(new RegExp(`\\b(?:${VERBS})\\s+((?:(?:a|an|the|our|my|one|some|new|simple|simpler|tiny|small|better|easy|easier|basic|quick)\\s+)*)([^.,;:!?]+?)(?=\\s+(?:for|that|which|with|so|where|when|because|to|in|on|at|from|who)\\b|[.,;:!?]|$)`, "i"));
  if (verb) {
    const n = shorten(verb[2]);
    const w = n.split(" ").filter(Boolean);
    if (w.length && w.every((x) => GENERIC.has(x))) {
      // "my current screens for the banking app" -> "Banking app screens"
      const topic = forTopic(t.slice(verb.index! + verb[0].length));
      if (topic.length) return capFirst([...topic, w[w.length - 1]].join(" "));
    }
    if (w.length >= 2) return capFirst(n);
  }

  // 2. the words in front of a kind of thing ("leave request app", "to-do list app")
  const typed = t.match(new RegExp(`((?:[a-z0-9\\-]+\\s+){0,3})(${TYPE_NOUNS})\\b`, "i"));
  if (typed) {
    const before = words(typed[1]).filter((x) => !FILLER.has(x) && !STOP.has(x) && !ASK.has(x) && !new RegExp(`^(?:${VERBS})$`).test(x));
    const kind = typed[2].toLowerCase();
    if (before.length) return capFirst([...before.slice(-2), kind].join(" "));
    // "a dashboard for hospital nurses" -> "Hospital nurses dashboard"
    const topic = forTopic(t.slice(typed.index! + typed[0].length));
    if (topic.length) return capFirst([...topic, kind].join(" "));
  }

  // 3. the most repeated meaningful words, in the order they first appear
  const all = words(t).filter((x) => x.length > 3 && !FILLER.has(x) && !STOP.has(x) && !ASK.has(x) && !new RegExp(`^(?:${VERBS})$`).test(x));
  const count = new Map<string, number>();
  all.forEach((x) => count.set(x, (count.get(x) ?? 0) + 1));
  const top = [...new Set(all)].sort((a, b) => (count.get(b)! - count.get(a)!) || all.indexOf(a) - all.indexOf(b)).slice(0, 3);
  const ordered = [...new Set(all)].filter((x) => top.includes(x));
  return ordered.length ? capFirst(ordered.join(" ")) : fallback;
}

// A name from the AI or the designer is fine if it is 1 to 6 words
export function cleanName(raw: string): string {
  const n = raw.replace(/\s+/g, " ").trim().replace(/[.!?]+$/, "");
  const count = n.split(" ").filter(Boolean).length;
  return count >= 1 && count <= 6 && n.length <= 60 ? capFirst(n) : "";
}
