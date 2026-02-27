import { NextRequest, NextResponse } from "next/server";
import { hasMavenCredentials } from "@/lib/maven";
import { AgentResponse, BillingRecord } from "@/lib/types";

type AgentInput = {
  question: string;
  billingRecord: BillingRecord;
  policySnippets: string[];
};

function buildDeterministicResponse(input: AgentInput): AgentResponse {
  const { question, billingRecord, policySnippets } = input;
  const mentionPaymentPlan = /payment plan|installment|monthly/i.test(question);
  const mentionDuplicate = /charged twice|duplicate|double/i.test(question);

  const explanation = [
    `Invoice ${billingRecord.invoiceId} shows total $${billingRecord.total}, paid $${billingRecord.paid}, leaving balance $${billingRecord.balance}.`,
    `Current status is ${billingRecord.status} with due date ${billingRecord.dueDate}.`
  ];

  if (mentionDuplicate) {
    explanation.push("The question indicates a possible duplicate charge, so an itemized coding review is recommended.");
  }

  if (mentionPaymentPlan) {
    explanation.push("Policy supports installment plans for balances above $250.");
  }

  const nextSteps = mentionPaymentPlan
    ? [
        "Offer a 6 or 12-month payment plan and confirm preferred monthly amount.",
        "Send payment plan consent link and first due date.",
        "Escalate to billing specialist if patient requests hardship adjustment."
      ]
    : [
        "Share an itemized bill to explain each line item.",
        "Validate insurance adjudication details and deductible application.",
        "Escalate if patient contests coding or requests a formal dispute review."
      ];

  return {
    summary:
      mentionPaymentPlan
        ? "Your balance is eligible for a payment plan, and we can spread the remaining amount into monthly installments."
        : "Your balance appears tied to ER and diagnostic services after insurance processing; we can review each charge and address any dispute.",
    explanation,
    next_steps: nextSteps,
    confidence: mentionDuplicate ? 0.82 : 0.88,
    citations: [
      "billing.invoiceId",
      "billing.total",
      "billing.paid",
      "billing.balance",
      "billing.dueDate",
      ...policySnippets.slice(0, 3).map((_, i) => `policy[${i}]`)
    ]
  };
}

async function callMaven(input: AgentInput): Promise<AgentResponse | null> {
  try {
    const sdk = await import("mavenagi");
    const MavenAGIClient = (sdk as any).MavenAGIClient;
    if (!MavenAGIClient) {
      return null;
    }

    const client = new MavenAGIClient({
      appId: process.env.MAVEN_APP_ID,
      appSecret: process.env.MAVEN_APP_SECRET,
      orgId: process.env.MAVEN_ORG_ID
    });

    const prompt = [
      "You are a hospital billing support agent.",
      "Return strictly valid JSON with keys: summary, explanation, next_steps, confidence, citations.",
      "explanation and next_steps must be arrays of concise bullet strings.",
      `Patient question: ${input.question}`,
      `Billing record: ${JSON.stringify(input.billingRecord)}`,
      `Policy snippets: ${JSON.stringify(input.policySnippets)}`
    ].join("\n");

    const response = await (client as any).agents.generate({
      agentId: process.env.MAVEN_AGENT_ID,
      input: prompt
    });

    const rawText =
      response?.outputText ??
      response?.text ??
      response?.output?.[0]?.content?.[0]?.text ??
      response?.result ??
      "";

    if (!rawText) return null;

    const parsed = JSON.parse(rawText) as AgentResponse;

    return {
      summary: parsed.summary,
      explanation: parsed.explanation ?? [],
      next_steps: parsed.next_steps ?? [],
      confidence: Number(parsed.confidence ?? 0.75),
      citations: Array.isArray(parsed.citations) ? parsed.citations : []
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const input = (await request.json()) as AgentInput;

  if (!input?.question || !input?.billingRecord || !Array.isArray(input?.policySnippets)) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const connected = hasMavenCredentials();
  const mavenResponse = connected ? await callMaven(input) : null;

  const fallback = buildDeterministicResponse(input);
  const final = mavenResponse
    ? {
        ...mavenResponse,
        citations: mavenResponse.citations.length ? mavenResponse.citations : fallback.citations
      }
    : fallback;

  return NextResponse.json(final);
}
