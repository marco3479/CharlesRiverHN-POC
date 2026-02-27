import { NextResponse } from "next/server";
import { hasMavenCredentials } from "@/lib/maven";

export async function GET() {
  return NextResponse.json({ connectedToMaven: hasMavenCredentials() });
}
