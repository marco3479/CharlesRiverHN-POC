import { BillingRecord, CoverageResource, EhrPayload, KnowledgeBaseItem, SupportCase } from "@/lib/types";

type EscalationInput = {
  claimId: string;
  question: string;
};

const kbCorpus: KnowledgeBaseItem[] = [
  {
    source: "Confluence",
    title: "Patient Billing FAQ - ER Encounters",
    snippet:
      "Emergency services are adjudicated using plan deductible and coinsurance logic. Use claim-level EOB to explain patient share.",
    link: "https://confluence.charlesriverhealth.local/display/RCM/Patient+Billing+FAQ+-+ER+Encounters"
  },
  {
    source: "Confluence",
    title: "Payment Plan Eligibility Matrix",
    snippet:
      "Balances above $250 can be split into 6 or 12-month plans when coverage is active and no fraud hold exists.",
    link: "https://confluence.charlesriverhealth.local/display/RCM/Payment+Plan+Eligibility+Matrix"
  },
  {
    source: "Confluence",
    title: "Duplicate Charge Review Workflow",
    snippet:
      "Potential duplicate CPT posting must be reviewed against encounter timeline and claim adjudication history before adjustment.",
    link: "https://confluence.charlesriverhealth.local/display/RCM/Duplicate+Charge+Review+Workflow"
  }
];

function checksum(input: string): string {
  let sum = 0;
  for (let i = 0; i < input.length; i += 1) {
    sum = (sum + input.charCodeAt(i) * (i + 1)) % 100000;
  }
  return sum.toString().padStart(5, "0");
}

export function getEhrData(patientId: string, encounterId: string): EhrPayload {
  return {
    patient: {
      resourceType: "Patient",
      id: patientId,
      identifier: [{ system: "urn:epic:mrn", value: "MRN-442198" }],
      name: [{ family: "Carter", given: ["Jordan"] }],
      gender: "female",
      birthDate: "1985-11-03"
    },
    encounter: {
      resourceType: "Encounter",
      id: encounterId,
      status: "finished",
      class: { code: "EMER", display: "Emergency" },
      subject: { reference: `Patient/${patientId}`, display: "Jordan Carter" },
      period: { start: "2026-01-12T19:42:00Z", end: "2026-01-12T22:15:00Z" },
      reasonCode: [{ text: "Chest pain and shortness of breath" }]
    },
    appointment: {
      resourceType: "Appointment",
      id: `APT-${encounterId}`,
      status: "fulfilled",
      start: "2026-01-19T14:00:00Z",
      end: "2026-01-19T14:30:00Z",
      serviceType: [{ text: "Post-ER Follow-up" }],
      participant: [
        {
          actor: { reference: "Practitioner/PR-203", display: "Dr. Elena Kim" },
          status: "accepted"
        }
      ]
    },
    coverage: {
      resourceType: "Coverage",
      id: `COV-${patientId}`,
      status: "active",
      beneficiary: { reference: `Patient/${patientId}` },
      payor: [{ display: "Blue Cross Blue Shield MA" }],
      type: { text: "PPO" },
      subscriberId: "BCBS-00994412",
      class: [
        { type: { text: "plan" }, value: "PPO-GOLD-2000", name: "Gold PPO" },
        { type: { text: "group" }, value: "GRP-45012" }
      ]
    }
  };
}

export function getCoverage(patientId: string, encounterId = "E-77210"): CoverageResource {
  return getEhrData(patientId, encounterId).coverage;
}

export function getBillingClaim(patientId: string, encounterId: string): BillingRecord {
  const lineItems = [
    {
      cptCode: "99284",
      description: "Emergency department visit, moderate complexity",
      billedAmount: 1200,
      allowedAmount: 860,
      patientResponsibility: 420
    },
    {
      cptCode: "80053",
      description: "Comprehensive metabolic panel",
      billedAmount: 220,
      allowedAmount: 150,
      patientResponsibility: 60
    },
    {
      cptCode: "71045",
      description: "Chest radiologic exam, single view",
      billedAmount: 320,
      allowedAmount: 210,
      patientResponsibility: 90
    },
    {
      cptCode: "93010",
      description: "Electrocardiogram interpretation",
      billedAmount: 100,
      allowedAmount: 75,
      patientResponsibility: 25
    }
  ];

  return {
    patientId,
    encounterId,
    claimId: `CLM-${encounterId}`,
    explanationOfBenefit:
      "Claim adjudicated. In-network rates applied. Deductible and coinsurance remain patient responsibility.",
    allowedAmount: lineItems.reduce((sum, item) => sum + item.allowedAmount, 0),
    patientResponsibility: lineItems.reduce((sum, item) => sum + item.patientResponsibility, 0),
    deductibleApplied: 420,
    status: "adjudicated",
    lineItems
  };
}

export function searchKnowledgeBase(query: string): KnowledgeBaseItem[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return kbCorpus.slice(0, 3);

  const ranked = kbCorpus
    .map((item) => {
      const haystack = `${item.title} ${item.snippet}`.toLowerCase();
      const score = normalized
        .split(/\s+/)
        .filter(Boolean)
        .reduce((acc, token) => acc + (haystack.includes(token) ? 1 : 0), 0);
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked.length ? ranked.slice(0, 4).map((entry) => entry.item) : kbCorpus.slice(0, 3);
}

export function createSupportCase(input: EscalationInput): SupportCase {
  const lower = input.question.toLowerCase();
  const isHighPriority = /duplicate|double charge|dispute|appeal/.test(lower);
  const isMediumPriority = /payment plan|billing question|balance/.test(lower);
  const priority: SupportCase["priority"] = isHighPriority ? "High" : isMediumPriority ? "Medium" : "Low";

  return {
    caseId: `CASE-${checksum(`${input.claimId}-${input.question}`)}`,
    priority,
    status: "New",
    estimatedResponseTime: priority === "High" ? "4 business hours" : priority === "Medium" ? "1 business day" : "2 business days",
    subject: `Patient billing support for ${input.claimId}`,
    system: "Salesforce Health Cloud"
  };
}

