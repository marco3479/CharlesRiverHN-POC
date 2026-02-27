import { NextRequest, NextResponse } from "next/server";
import { searchKnowledgeBase } from "@/lib/mock-integrations";

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();
  const results = searchKnowledgeBase(q);
  return NextResponse.json({ results });
}
