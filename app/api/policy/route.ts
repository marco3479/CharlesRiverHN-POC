import { NextRequest, NextResponse } from "next/server";
import { PolicySnippet } from "@/lib/types";

const snippets: PolicySnippet[] = [
  {
    topic: "coverage",
    snippet:
      "ER services are covered at in-network rates after deductible; coinsurance applies based on plan tier."
  },
  {
    topic: "prior authorization",
    snippet:
      "Prior authorization is not required for emergency stabilization services but may apply to follow-up imaging."
  },
  {
    topic: "payment plans",
    snippet:
      "Balances above $250 are eligible for 3, 6, or 12-month payment plans without interest."
  },
  {
    topic: "disputes",
    snippet:
      "Patients can dispute potential duplicate charges within 60 days by requesting an itemized review."
  }
];

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") ?? "").toLowerCase().trim();

  const filtered = q
    ? snippets.filter(
        (item) => item.topic.toLowerCase().includes(q) || item.snippet.toLowerCase().includes(q)
      )
    : snippets;

  return NextResponse.json({ snippets: filtered });
}
