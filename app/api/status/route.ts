import { NextResponse, connection } from "next/server";
import { anthropicKeySet, isDemo } from "@/lib/ai";

// Tells Home whether the app is ready to use. It never sends the key itself.
export async function GET() {
  await connection();
  return NextResponse.json({ demo: isDemo(), keySet: anthropicKeySet() });
}
