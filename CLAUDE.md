# DesignPilot: project brief for Claude Code

Read this file before every task. It explains what we are building, who we are, and how to work with us.

## Who you are working with
- We are three UX designers with **no coding experience**.
- Explain everything in **plain, simple words**. No jargon. If you must use a technical word, explain it in one short sentence.
- After every task, tell us: (1) what you did, (2) how to see it working, (3) what to check.
- Work in **small steps**. Do one thing, show us, then wait.
- Before installing anything big or changing many files, tell us what and why, and ask.
- If something fails, explain what went wrong in plain words and fix it.
- Save a checkpoint (git commit) after every working step, with a short plain message.

## What we are building
DesignPilot is a web app that **does the UX design process for a designer**. The designer puts in a requirement (typed, or uploaded documents). The system works through six phases, one at a time. **After every phase it stops and asks for approval.** The final result is a **working HTML prototype**.

The six phases, in order:
1. **Understand**: brief, requirements, first user profiles, things the user may not have asked about.
2. **Research**: competitor, patterns, what people say (qualitative), what the numbers say (quantitative), accessibility. Uses web search with sources.
3. **Ideate**: product structure (sitemap), user flows, user journeys, storyboard, 2 to 3 directions.
4. **Wireframes**: grey, clickable HTML wireframes of every screen and state.
5. **Visual design**: the final look, using the team's design style, delivered as a **working HTML prototype**.
6. **Testing**: test plan and script; the user uploads real test notes; the system analyses them and suggests fixes.

## The must-have rules (never break these)
1. **Plain and simple for the user.** No technical words on any screen. Use the labels in "Plain labels" below.
2. **The system plans its own work.** Each phase first shows "What I will do" and "What I will skip, and why".
3. **One simple check-in after every phase.** It shows: "What I made" (5 lines or fewer), "What I'm not sure about" (up to 3 items), a feedback box, and two buttons: **Go ahead** and **Not yet**.
   - Go ahead: mark the phase approved and start the next one. If there is a note, apply it.
   - Not yet: redo the phase using the feedback, then show the check-in again.
   - **Nothing moves forward without Go ahead.**
4. **The final result is a working HTML prototype** that opens in a browser and works on phone and laptop.
5. **Figma files** can be added by link (later step). Never change the user's original files.
6. **Honesty:** every finding is labelled **Checked** (has a source), **My guess** (inferred), or **Test idea only** (made up for testing). Never invent sources, numbers, or quotes.

## Plain labels (use these exact words in the interface)
| Do not show | Show instead |
|---|---|
| Gate, approval | Check-in |
| Approve / Reject | Go ahead / Not yet |
| Assumptions | Things I guessed |
| Persona | User profile |
| Information architecture | Product structure |
| Qualitative / Quantitative | What people say / What the numbers say |
| Processing, running | Working on it |
| Components, tokens | Ready-made parts, colours and text styles |

## Technology (keep it simple for the first draft)
- **Next.js** (React) with TypeScript, styled with Tailwind.
- **Claude API** through the official Anthropic SDK. Read the API key from `.env.local` as `ANTHROPIC_API_KEY`. Never put the key in code or show it on screen. Make sure `.env.local` is in `.gitignore`.
- **Models:** use `claude-sonnet-5-5` for phase work and `claude-haiku-5-5` for small quick tasks. Check the Anthropic docs if a model name gives an error.
- **Web search:** use the Claude API's built-in web search tool in the Research phase. Check the docs for the current tool version.
- **Storage (first draft):** save each project as a JSON file in `/data/projects/`. Save uploaded files in `/data/uploads/`. No database yet.
- **No login yet.** Single user, runs on our own laptop at http://localhost:3000.
- **Reading files:** support PDF, Word (.docx), Excel (.xlsx/.csv), text, and images.
- Long AI outputs (wireframes and prototypes) need a large output limit. Generate them screen by screen if needed, then join them.

## How the phase engine must work
- Each phase reads its instructions from `/recipes/` (for example `recipes/1-understand.md`). **Do not hard-code the design instructions in the code.** The designers will edit the recipe files.
- Each phase sends the AI: the recipe, the original requirement, all uploaded file text, the quick-question answers, all **approved** outputs from earlier phases, and any feedback.
- Ask the AI to return **JSON** in the format the recipe describes, so the app can show it nicely. Validate the JSON and retry once if it is broken.
- Every run is saved as a new **version**. Keep all versions.
- Phase statuses: Not started, Working on it, Ready for you, Changes asked, Approved.
- Keep a project-wide **"Things I guessed"** list, updated by every phase.

## Screens for the first draft
1. **Home:** "Tell me what you need to design" box, Upload documents, Start. List of my projects.
2. **Quick questions:** up to 5 questions with tap options and "You decide".
3. **Project page:** phase rail on the left (6 phases plus Final result), and for the current phase four tabs: **Plan, Work, What I did, Check-in**. A side panel with "Things I guessed".
4. **Check-in screen:** as described in the rules.
5. **Prototype viewer:** shows the HTML prototype inside the page, with "Open in new tab" and "Download".

Keep the look clean and simple for now. We will apply our own Figma designs to the interface later.
