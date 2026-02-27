export type BillingLineItem = {
  code: string;
  description: string;
  amount: number;
};

export type BillingRecord = {
  patientId: string;
  encounterId: string;
  invoiceId: string;
  total: number;
  paid: number;
  balance: number;
  dueDate: string;
  status: "open" | "paid" | "overdue";
  lineItems: BillingLineItem[];
};

export type PolicySnippet = {
  topic: string;
  snippet: string;
};

export type AgentResponse = {
  summary: string;
  explanation: string[];
  next_steps: string[];
  confidence: number;
  citations: string[];
};
