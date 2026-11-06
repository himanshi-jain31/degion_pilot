# DesignPilot first draft: step-by-step build guide

**Who this is for:** designers with no coding experience. You will talk to Claude Code in plain words. It writes the code. You check the result in your browser.

**What you will have at the end:** a working DesignPilot on your laptop. You paste a requirement, it goes through all six phases with a check-in after each, and it gives you a working HTML prototype.

**Rough time:** 2 to 4 weeks, doing one or two steps a day. Some steps will need a few rounds of "that's not right, please fix".

---

## Part 1: Before you start (one time only)

| # | What to do | Why |
|---|---|---|
| 1 | **Ask IT / security** if you can use Claude Code and the Claude API on your work laptop. Use only test requirements (no real client data) until they say yes | Company rules |
| 2 | Get a **paid Claude plan** (Pro or higher) for the person who will build | Needed for Claude Code |
| 3 | Install the **Claude desktop app** and open the **Code** tab | This is where you talk to Claude Code |
| 4 | Create an account on the **Claude Console** (Anthropic's developer site), add billing, and create an **API key**. Copy it somewhere safe | DesignPilot itself uses this to do the design work. It is paid per use, separate from your Claude plan |
| 5 | Create a free **GitHub** account | Saves your work safely, like version history |
| 6 | Make a folder on your laptop called `designpilot` and copy everything from this starter kit into it | Claude Code reads `CLAUDE.md` and the `recipes` folder from here |

**Keep your API key secret.** Never paste it into a chat, a document, or a screenshot. You only put it in one file, in Step 1.

---

## Part 2: How to work with Claude Code

1. Open the Claude desktop app, go to **Code**, and choose your `designpilot` folder.
2. Copy **one** message from Part 3 and paste it in.
3. Claude Code will explain what it plans, then do it. If it asks permission to run something, read its plain explanation and allow it.
4. When it says it is done, open **http://localhost:3000** in your browser and do the check listed under the step.
5. If something is wrong, just say so in plain words: *"The Go ahead button does nothing. Please fix it."* You can also paste a screenshot.
6. Only move to the next step when the current one works.

**Good habits**
- One step at a time. Never paste two steps together.
- If Claude Code gets confused, say: *"Stop. Read CLAUDE.md again and explain what we are doing."*
- If something breaks badly, say: *"Go back to the last checkpoint."*
- Edit the files in the `recipes` folder to change how DesignPilot designs. You don't need to touch the code for that.

---

## Part 3: The build steps (copy and paste each message)

### Step 1: Set up the project
> Read CLAUDE.md and the recipes folder. Set up a new Next.js project in this folder as described in CLAUDE.md. Check if anything needs to be installed on my laptop first (like Node.js) and guide me in plain words. Create the .env.local file for my API key and tell me exactly where to paste it. Make sure the key is never saved to GitHub. Start the app and show me a simple page that says "DesignPilot". Then explain what you did in plain words.

**Check:** http://localhost:3000 shows "DesignPilot". You pasted your API key into `.env.local` yourself.

### Step 2: Home screen and saving a project
> Build the Home screen from CLAUDE.md: a big box "Tell me what you need to design", an "Upload documents" button (PDF, Word, Excel, CSV, text, images), and a Start button. When I click Start, create a new project, save it as a JSON file in /data/projects, save the files in /data/uploads, and pull the text out of every file. Show a list of my projects on Home. Explain in plain words how I can test it.

**Check:** paste test requirement 1, upload any PDF, click Start. The project appears in the list. Ask Claude Code to show you the saved project file.

### Step 3: Quick questions (first real AI step)
> Connect the Claude API as described in CLAUDE.md. After Start, use recipes/0-quick-questions.md to ask me up to 5 questions, one at a time, with tap options and a "You decide" button. Save my answers in the project. Every "You decide" goes into a "Things I guessed" list. Show friendly plain messages if the AI fails, and let me try again.

**Check:** try test requirement 2 (the one-line HR dashboard). You should get sensible questions about who it is for and what it shows.

### Step 4: The phase engine and Phase 1 with the check-in
> Build the project page from CLAUDE.md: a phase rail on the left with the 6 phases and Final result, and four tabs for the current phase: Plan, Work, What I did, Check-in. Add a side panel for "Things I guessed". Run Phase 1 using recipes/1-understand.md, sending everything listed in CLAUDE.md. Show "Working on it" with progress while it runs. Show the results nicely, not as raw JSON. Build the Check-in tab exactly as the rules say: What I made, What I'm not sure about, Another view, a feedback box, and Go ahead and Not yet. Not yet must redo the phase using my feedback and show the check-in again with "What changed". Save every version. Go ahead marks the phase approved. Do not start Phase 2 yet.

**Check:** run test requirement 1. Read the brief. Click **Not yet** and type "Focus only on managers". The new version should change. Then click **Go ahead**.

### Step 5: Phases 2 and 3
> Add Phase 2 using recipes/2-research.md, with the Claude API web search tool (check the docs for the current version). Show every finding with its source as a clickable link and its label (Checked or My guess). At Check-in 2, add the choice "Talk to real users first?" with "No, keep going" and "Yes, wait for me". Waiting lets me upload interview notes, then redoes the research using them. Then add Phase 3 using recipes/3-ideate.md. Show the product structure as an indented tree, the flows as step lists, and the directions as cards side by side. At Check-in 3, let me pick direction A, B, C, or "Mix" with a note. A mix must show Check-in 3 again. Each phase starts only after the previous Go ahead.

**Check:** sources open real web pages. Directions are really different. Picking B carries B into the next phase.

### Step 6: Phase 4, clickable wireframes
> Add Phase 4 using recipes/4-wireframes.md. The AI must return a full HTML wireframe. If it is too long for one reply, generate it screen by screen and join it. Show the wireframe inside the page in a preview frame, with buttons to switch between phone and laptop size, plus "Open in new tab". Also list the screens with what each one is for. Keep the usual check-in.

**Check:** click through the wireframe. Every button goes somewhere. The empty and error screens exist.

### Step 7: Phase 5, design style and the working prototype
> Add a "Design style" section to the project where I can enter colours, fonts, and corner style, or upload a brand guide PDF or screenshots. Then add Phase 5 using recipes/5-visual-design.md, using the approved wireframe and the design style. Show the prototype in the preview frame with phone and laptop sizes, "Open in new tab", and "Download". Show the design checks and cover note. After Go ahead at Check-in 5, mark the design as final and show it on the Final result page.

**Check:** open the prototype on your phone too (Claude Code can show you how on the same Wi-Fi). Can you open last month's report in 2 taps?

### Step 8: Phase 6, testing
> Add Phase 6 using recipes/6-testing.md. First show the test plan, script, and expert check, with "Download test kit". Then let me upload test notes (text, Word, or Excel). The AI analyses them and shows issues ranked from most to least important. At Check-in 6, offer "Send fixes to Wireframes", "Send fixes to Visual design", or "No fixes needed". Sending fixes reopens that phase with the fix list, then returns here. Update "Things I guessed" with Confirmed, Wrong, or Open.

**Check:** write fake test notes ("3 of 5 people missed the filter button") and upload them. The issue list should mention the filter.

### Step 9: Figma link (reading only)
> Add "Add a Figma file" to the project. I paste a Figma link and a Figma personal access token (explain in plain words how I create one and keep it safe in .env.local). Read the file's colours, text styles, and main components using Figma's official API, and show a plain summary like "I found 38 colours and 12 text styles". Ask me "What is this?" (my design system, my current screens, inspiration, or reference). If it is my design system, use it as the design style in Phase 5. Never change the Figma file.

**Check:** paste a Figma link from your team. The summary should match what you see in Figma.

### Step 10: Make it look and feel right
> Now improve the interface. [Attach screenshots of your DesignPilot designs, or describe them.] Match these designs. Use only the plain labels from CLAUDE.md. Add friendly empty, loading, and error states on every screen. Make sure everything works with a keyboard and has good colour contrast.

**Check:** a colleague who has never seen it can get from Home to Check-in 1 without help.

### Step 11: Full test run
> Run through the whole flow with test requirement 3 (leave request) and list everything that feels broken, slow, or confusing. Then fix the issues one by one, telling me about each fix in plain words.

**Check:** do the full run yourself with all three test requirements. Write down what the AI did well and badly in each phase. Then improve the **recipe files** (not the code) and run again.

---

## Part 4: How to judge if it's working

| Phase | Good sign | Bad sign (improve the recipe) |
|---|---|---|
| Quick questions | Asks what really matters | Asks things already in the request |
| Understand | Finds things you missed | Just repeats your request |
| Research | Real sources that support the claims | Claims without links, or broken links |
| Ideate | Directions really differ | Three versions of the same idea |
| Wireframes | Every screen and state exists | Dead buttons, missing error screens |
| Visual design | Looks like your product | Generic look, poor contrast |
| Testing | Clear, ranked fixes | Vague advice |

**Your most important job:** improving the recipes. They hold your design knowledge. The better the recipes, the better DesignPilot designs.

---

## Part 5: What this first draft does not have yet
Login and roles, saving to a real database, sharing links with others, writing into Figma, Jira or Slack connections, and running on a company server. These come after the first draft works, and that is the point to bring in a developer for a security review.
