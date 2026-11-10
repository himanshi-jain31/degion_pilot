import { NextResponse, connection } from "next/server";
import { anthropicKeySet, demoSwitchedOn, isDemo } from "@/lib/ai";

// Tells Home whether the app is ready to use. It never sends the key itself.
// "demoIgnored" means DEMO_MODE=on is still in .env.local, but a key is set, so the real AI is used.
export async function GET() {
  await connection();
  return NextResponse.json({ demo: isDemo(), keySet: anthropicKeySet(), demoIgnored: demoSwitchedOn() && anthropicKeySet() });
}
