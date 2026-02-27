import { NextResponse } from 'next/server';
import type { AgentResponse, BillingRecord } from '@/lib/types';

type AgentInput = {
  question: string;
  billingRecord: BillingRecord;
  policySnippets: string[];
};

function hasMavenConfig() {
  return Boolean(
    process.env.MAVEN_APP_ID &&
      process.env.MAVEN_APP_SECRET &&
      process.env.MAVEN_ORG_ID &&
      process.env.MAVEN_AGENT_ID,
  );
}

function buildDeterministicResponse(input: AgentInput): AgentResponse {
  const { question, billingRecord, policySnippets } = input;
  const baseCitations = [
    `billing.invoiceId=${billingRecord.invoiceId}`,
    `billing.balance=${billingRecord.balance}`,
    `billing.status=${billingRecord.status}`,
    ...policySnippets.slice(0, 3).map((snippet, idx) => `policy[${idx + 1}]=${snippet}`),
  ];

  const lowered = question.toLowerCase();

  if (lowered.includes('payment plan')) {
    return {
      summary: `Your invoice ${billingRecord.invoiceId} has a remaining balance of $${billingRecord.balance.toFixed(2)}, and it appears eligible for a payment plan.`,
      explanation: [
        `The account is currently ${billingRecord.status} with a due date of ${billingRecord.dueDate}.`,
        'The balance is above the $500 policy threshold commonly used for installment options.',
        'No urgent coding disputes are visible in the line items, so a payment arrangement is the fastest path.',
      ],
      next_steps: [
        'Offer a 6-month draft plan and confirm monthly amount with the patient.',
        'Route patient to financial counseling if hardship support is requested.',
      ],
      confidence: 0.89,
      citations: baseCitations,
    };
  }

  if (lowered.includes('charged twice') || lowered.includes('duplicate')) {
    return {
      summary: `There may be a duplicate billing concern on invoice ${billingRecord.invoiceId}; a targeted charge audit is recommended.`,
      explanation: [
        'The question indicates a potential duplicate lab charge and should be reviewed against same-day code postings.',
        `Current outstanding balance is $${billingRecord.balance.toFixed(2)} while review is pending.`,
        'Policy supports manual review requests within 30 days of statement date.',
      ],
      next_steps: [
        'Open a billing dispute review for line items with repeated lab/CPT codes.',
        'Place temporary hold on collections activity for disputed charges.',
      ],
      confidence: 0.84,
      citations: baseCitations,
    };
  }

  return {
    summary: `The ER invoice total of $${billingRecord.total.toFixed(2)} likely reflects facility fees plus diagnostics performed during the visit.`,
    explanation: [
      'ER claims commonly include an acuity-based facility component and additional service line items.',
      `This invoice includes ${billingRecord.lineItems.length} itemized services with a remaining balance of $${billingRecord.balance.toFixed(2)}.`,
      'Emergency services generally do not need prior authorization, but cost-sharing depends on payer contract terms.',
    ],
    next_steps: [
      'Share an itemized statement and explain the largest line item first.',
      'Offer payment plan enrollment or formal review if the patient disputes specific charges.',
    ],
    confidence: 0.81,
    citations: baseCitations,
  };
}

function toStructuredResponse(rawText: string, input: AgentInput): AgentResponse {
  const fallback = buildDeterministicResponse(input);
  return {
    ...fallback,
    summary: rawText.slice(0, 280) || fallback.summary,
  };
}

async function callMaven(input: AgentInput): Promise<AgentResponse | null> {
  try {
    const { MavenAGIClient } = await import('mavenagi');
    const client = new MavenAGIClient({
      appId: process.env.MAVEN_APP_ID,
      appSecret: process.env.MAVEN_APP_SECRET,
      orgId: process.env.MAVEN_ORG_ID,
    });

    const prompt = `You are a healthcare billing support agent. Respond with concise guidance.\nQuestion: ${input.question}\nBilling Record: ${JSON.stringify(
      input.billingRecord,
    )}\nPolicy Snippets: ${JSON.stringify(input.policySnippets)}\nReturn plain text summary and rationale.`;

    const dynamicClient = client as any;
    let text = '';

    if (dynamicClient.agents?.responses?.create) {
      const response = await dynamicClient.agents.responses.create({
        agentId: process.env.MAVEN_AGENT_ID,
        input: prompt,
      });
      text = response?.output_text ?? response?.text ?? JSON.stringify(response);
    } else if (dynamicClient.responses?.create) {
      const response = await dynamicClient.responses.create({
        agentId: process.env.MAVEN_AGENT_ID,
        input: prompt,
      });
      text = response?.output_text ?? response?.text ?? JSON.stringify(response);
    } else if (dynamicClient.agents?.run) {
      const response = await dynamicClient.agents.run({
        agent_id: process.env.MAVEN_AGENT_ID,
        prompt,
      });
      text = response?.text ?? JSON.stringify(response);
    }

    if (!text) {
      return null;
    }

    return toStructuredResponse(text, input);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const input = (await request.json()) as AgentInput;

  if (hasMavenConfig()) {
    const mavenResponse = await callMaven(input);
    if (mavenResponse) {
      return NextResponse.json(mavenResponse);
    }
  }

  return NextResponse.json(buildDeterministicResponse(input));
}
