export type PatientResource = {
  resourceType: "Patient";
  id: string;
  identifier: Array<{ system: string; value: string }>;
  name: Array<{ family: string; given: string[] }>;
  gender: "male" | "female" | "other" | "unknown";
  birthDate: string;
};

export type EncounterResource = {
  resourceType: "Encounter";
  id: string;
  status: "finished" | "in-progress" | "planned";
  class: { code: string; display: string };
  subject: { reference: string; display: string };
  period: { start: string; end: string };
  reasonCode: Array<{ text: string }>;
};

export type AppointmentResource = {
  resourceType: "Appointment";
  id: string;
  status: "booked" | "arrived" | "fulfilled";
  start: string;
  end: string;
  serviceType: Array<{ text: string }>;
  participant: Array<{
    actor: { reference: string; display: string };
    status: "accepted" | "needs-action";
  }>;
};

export type CoverageResource = {
  resourceType: "Coverage";
  id: string;
  status: "active" | "cancelled";
  beneficiary: { reference: string };
  payor: Array<{ display: string }>;
  type: { text: string };
  subscriberId: string;
  class: Array<{
    type: { text: string };
    value: string;
    name?: string;
  }>;
};

export type EhrPayload = {
  patient: PatientResource;
  encounter: EncounterResource;
  appointment: AppointmentResource;
  coverage: CoverageResource;
};

export type BillingLineItem = {
  cptCode: string;
  description: string;
  billedAmount: number;
  allowedAmount: number;
  patientResponsibility: number;
};

export type BillingRecord = {
  patientId: string;
  encounterId: string;
  claimId: string;
  explanationOfBenefit: string;
  allowedAmount: number;
  patientResponsibility: number;
  deductibleApplied: number;
  status: "pending" | "adjudicated" | "denied" | "paid";
  lineItems: BillingLineItem[];
};

export type KnowledgeBaseItem = {
  source: "Confluence";
  title: string;
  snippet: string;
  link: string;
};

export type SupportCase = {
  caseId: string;
  priority: "Low" | "Medium" | "High";
  status: "New" | "In Progress" | "Closed";
  estimatedResponseTime: string;
  subject: string;
  system: "Salesforce Health Cloud";
};

export type AgentResponse = {
  summary: string;
  explanation: string[];
  next_steps: string[];
  confidence: number;
  sources_used: string[];
};
