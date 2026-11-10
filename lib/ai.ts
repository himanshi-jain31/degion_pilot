import { promises as fs } from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { envValue } from "@/lib/env";
import { Project, UPLOADS_DIR } from "@/lib/storage";

export const MODEL_PHASE = "claude-sonnet-5-5";
export const MODEL_QUICK = "claude-haiku-5-5";

// Errors with a friendly message the screen can show as it is
export class FriendlyError extends Error {}

export const anthropicKeySet = () => !!envValue("ANTHROPIC_API_KEY");
// Demo mode plays back made-up results so the app can be tried without a key (see lib/demo.ts).
// It needs DEMO_MODE=on in .env.local AND no key. As soon as a key is set, the real AI is always used.
export const demoSwitchedOn = () => envValue("DEMO_MODE") === "on";
export const isDemo = () => demoSwitchedOn() && !anthropicKeySet();

export async function readRecipe(name: string): Promise<string> {
  return fs.readFile(path.join(process.cwd(), "recipes", name), "utf8");
}

async function getClient() {
  const key = envValue("ANTHROPIC_API_KEY");
  if (!key) {
    throw new FriendlyError(
      "I can't reach the AI yet because the key is missing. Open the file .env.local, paste your key after ANTHROPIC_API_KEY=, save the file, then click Try again."
    );
  }
  return new Anthropic({ apiKey: key });
}

const MAX_FILE_CHARS = 60000;
const IMAGE_TYPES: Record<string, "image/png" | "image/jpeg" | "image/gif" | "image/webp"> = {
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
};

// Builds the message: the requirement plus the text (and pictures) from every uploaded file
export async function buildProjectContent(project: Project): Promise<Anthropic.ContentBlockParam[]> {
  const blocks: Anthropic.ContentBlockParam[] = [];
  let text = `ORIGINAL REQUIREMENT:\n${project.requirement || "(nothing typed, see the documents)"}`;
  for (const f of project.files) {
    if (f.text) {
      text += `\n\n--- FILE: ${f.name} ---\n${f.text.slice(0, MAX_FILE_CHARS)}`;
      if (f.text.length > MAX_FILE_CHARS) text += "\n(file cut short because it is very long)";
    }
  }
  blocks.push({ type: "text", text });
  for (const f of project.files) {
    const media = IMAGE_TYPES[path.extname(f.name).toLowerCase()];
    if (!media || f.size > 5 * 1024 * 1024) continue;
    try {
      const data = await fs.readFile(path.join(UPLOADS_DIR, project.id, f.savedAs));
      blocks.push({ type: "text", text: `Picture: ${f.name}` });
      blocks.push({ type: "image", source: { type: "base64", media_type: media, data: data.toString("base64") } });
    } catch {
      // picture missing, carry on without it
    }
  }
  return blocks;
}

function parseJson(raw: string): unknown {
  const cleaned = raw.replace(/```(?:json)?/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no JSON");
  return JSON.parse(cleaned.slice(start, end + 1));
}

// Asks the AI for JSON, checks it, and tries once more if it is broken.
// With useWebSearch the AI can search the web, and every web address it really found is reported.
export async function askForJson<T>(opts: {
  model: string;
  recipe: string;
  content: Anthropic.ContentBlockParam[];
  validate: (data: unknown) => T; // throws if the shape is wrong
  maxTokens?: number;
  onProgress?: (charsWritten: number) => void;
  useWebSearch?: boolean;
  onSearchedUrls?: (urls: Set<string>) => void;
  demo?: { data: unknown; seconds: number }; // used only in demo mode
}): Promise<T> {
  if (isDemo() && opts.demo) {
    const steps = opts.demo.seconds * 2;
    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 500));
      opts.onProgress?.(Math.round((i / steps) * 14000));
    }
    return opts.validate(opts.demo.data);
  }

  const client = await getClient();
  const system = `${opts.recipe}\n\nReply with the JSON only. No other words, no code fences.`;
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: opts.content }];
  let lastProblem = "";
  let lastRaw = "";
  let cutOff = false;
  let written = 0;
  const urls = new Set<string>();

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      let convo: Anthropic.MessageParam[] =
        attempt === 0
          ? messages
          : [
              ...messages,
              { role: "assistant", content: lastRaw || "{}" },
              { role: "user", content: `That was not valid. Problem: ${lastProblem}. Send the JSON again, exactly in the format asked.` },
            ];
      const search = opts.useWebSearch && attempt === 0;
      // A long search can be paused by the AI service; carry on where it stopped (up to 6 times)
      for (let turn = 0; turn < 6; turn++) {
        const stream = client.messages.stream({
          model: opts.model,
          max_tokens: opts.maxTokens ?? 4000,
          system,
          messages: convo,
          ...(search
            ? { tools: [{ type: "web_search_20260318" as const, name: "web_search" as const, max_uses: 8, allowed_callers: ["direct" as const] }] }
            : {}),
        });
        stream.on("text", (t) => {
          written += t.length;
          opts.onProgress?.(written);
        });
        const res = await stream.finalMessage();
        cutOff = res.stop_reason === "max_tokens";

        let lastResult = -1;
        res.content.forEach((b, idx) => {
          if (b.type === "web_search_tool_result") {
            lastResult = idx;
            if (Array.isArray(b.content)) for (const r of b.content) if (r.url) urls.add(r.url);
          }
        });
        // The answer is the text after the last search; text before it is the AI thinking aloud
        lastRaw = res.content
          .filter((b, idx) => b.type === "text" && idx > lastResult)
          .map((b) => (b.type === "text" ? b.text : ""))
          .join("");
        if (res.stop_reason === "pause_turn") {
          convo = [...convo, { role: "assistant", content: res.content as Anthropic.ContentBlockParam[] }];
          continue;
        }
        break;
      }
      opts.onSearchedUrls?.(urls);
    } catch (e) {
      throw toFriendly(e);
    }
    try {
      return opts.validate(parseJson(lastRaw));
    } catch (e) {
      lastProblem = cutOff
        ? "your answer was cut off because it was too long. Send a shorter version of the same JSON: fewer and shorter items"
        : e instanceof Error ? e.message : "broken JSON";
    }
  }
  throw new FriendlyError("The AI sent back something I couldn't read. Please try again.");
}

function toFriendly(e: unknown): FriendlyError {
  const status = (e as { status?: number })?.status;
  if (status === 401) return new FriendlyError("The AI did not accept the key. Check the key in .env.local, save the file, then click Try again.");
  if (status === 404) return new FriendlyError("The AI model name was not found. Please tell the team so the name can be updated.");
  if (status === 429) return new FriendlyError("The AI is busy right now. Wait a minute and try again.");
  if (status === 402 || status === 403) return new FriendlyError("The AI account may be out of credit or not allowed. Please check the account, then try again.");
  return new FriendlyError("I couldn't reach the AI. Check your internet and try again.");
}

// Asks the AI for plain text (used for one wireframe or prototype screen at a time).
// If the reply is cut off by its length limit, it asks again for a shorter version. A cut-off screen is never kept.
export async function askForText(opts: {
  model: string;
  system: string;
  content: Anthropic.ContentBlockParam[];
  maxTokens?: number;
  demo?: string;
}): Promise<string> {
  if (isDemo() && opts.demo !== undefined) {
    await new Promise((r) => setTimeout(r, 900));
    return opts.demo;
  }
  const client = await getClient();
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.messages.stream({
        model: opts.model,
        max_tokens: (opts.maxTokens ?? 6000) * (attempt + 1),
        system: opts.system + (attempt > 0 ? "\n\nYour last reply was cut off because it was too long. Make this screen simpler and shorter so it fits." : ""),
        messages: [{ role: "user", content: opts.content }],
      }).finalMessage();
      if (res.stop_reason !== "max_tokens") return res.content.map((b) => (b.type === "text" ? b.text : "")).join("");
    } catch (e) {
      throw toFriendly(e);
    }
  }
  throw new FriendlyError("One screen was too long for me to finish. Please try again.");
}
