import { NextRequest, NextResponse } from "next/server";
import { createSupportCase } from "@/lib/mock-integrations";

export async function POST(request: NextRequest) {
  const { claimId, question } = (await request.json()) as {
    claimId: string;
    question: string;
  };

  if (!claimId || !question) {
    return NextResponse.json({ error: "claimId and question are required" }, { status: 400 });
  }

  const supportCase = createSupportCase({ claimId, question });

  return NextResponse.json(supportCase);
}
