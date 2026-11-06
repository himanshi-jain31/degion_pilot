import { NextResponse, connection } from "next/server";
import { figmaTokenSet } from "@/lib/figma";

// Tells the screen whether a token has been pasted. It never sends the token itself.
export async function GET() {
  await connection(); // read it fresh on every request, never saved at build time
  return NextResponse.json({ tokenSet: await figmaTokenSet() });
}
