import { NextRequest, NextResponse } from "next/server";
import { AgentResponse } from "@/lib/types";
import {
  createSupportCase,
  getBillingClaim,
  getCoverage,
  searchKnowledgeBase
} from "@/lib/mock-integrations";

type AgentInput = {
  question: string;
  patientId: string;
  encounterId: string;
};

function buildToolDrivenResponse(input: AgentInput): AgentResponse {
  const question = input.question.trim();

  // Tool: Waystar RCM claim retrieval
  const claim = getBillingClaim(input.patientId, input.encounterId);
  // Tool: Epic FHIR coverage retrieval
  const coverage = getCoverage(input.patientId, input.encounterId);
  // Tool: Knowledge base search over Confluence
  const kbResults = searchKnowledgeBase(question);

  const asksPaymentPlan = /payment plan|installment|monthly|balance/.test(question.toLowerCase());
  const asksDispute = /duplicate|double charge|dispute|appeal|charged twice/.test(question.toLowerCase());

  const maybeCase = asksDispute
    ? createSupportCase({
        claimId: claim.claimId,
        question
      })
    : null;

  const explanation = [
    `Waystar claim ${claim.claimId} is ${claim.status} with allowed amount $${claim.allowedAmount.toFixed(2)} and patient responsibility $${claim.patientResponsibility.toFixed(2)}.`,
    `Epic coverage ${coverage.id} shows active ${coverage.type.text} coverage with payor ${coverage.payor[0]?.display ?? "Unknown payor"}.`,
    `EOB indicates deductible applied is $${claim.deductibleApplied.toFixed(2)}.`
  ];

  if (asksPaymentPlan) {
    explanation.push("Knowledge base guidance indicates payment plans are available for balances above policy thresholds.");
  }

  if (asksDispute) {
    explanation.push("Potential duplicate-charge pattern detected from the question; escalation to billing operations is recommended.");
  }

  const nextSteps = asksPaymentPlan
    ? [
        "Offer a 6 or 12-month payment plan option and capture preferred monthly amount.",
        "Provide line-level EOB explanation for each CPT code on the claim.",
        "Document patient consent and send payment plan terms through MyChart messaging."
      ]
    : [
        "Share claim-level EOB details and explain deductible + coinsurance impact.",
        "Review each CPT line item against encounter documentation.",
        "If patient disputes remain, open a Salesforce Health Cloud case for specialist follow-up."
      ];

  if (maybeCase) {
    nextSteps.push(
      `Salesforce case ${maybeCase.caseId} created (${maybeCase.priority}) with estimated response time ${maybeCase.estimatedResponseTime}.`
    );
  }

  const summary = asksPaymentPlan
    ? "Your claim has been adjudicated and your remaining patient responsibility is eligible for payment plan review."
    : "Your balance is driven by deductible and coinsurance after claim adjudication; line-level review can clarify each charge.";

  return {
    summary,
    explanation,
    next_steps: nextSteps,
    confidence: maybeCase ? 0.84 : 0.9,
    sources_used: [
      `Waystar claimId: ${claim.claimId}`,
      `Epic encounterId: ${input.encounterId}`,
      ...kbResults.slice(0, 3).map((item) => `${item.source}: ${item.title}`)
    ]
  };
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<AgentInput>;
  const question = body.question?.trim() ?? "";
  const patientId = body.patientId?.trim() ?? "P-10983";
  const encounterId = body.encounterId?.trim() ?? "E-77210";

  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  return NextResponse.json(
    buildToolDrivenResponse({
      question,
      patientId,
      encounterId
    })
  );
}
