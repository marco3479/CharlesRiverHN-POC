'use client';

import { useEffect, useState } from 'react';
import type { AgentResponse, BillingRecord } from '@/lib/types';

const presetQuestions = [
  'Why is my bill higher than expected for my ER visit?',
  'Can I set up a payment plan for my balance?',
  'I think I was charged twice for a lab test. Can you check?',
];

type PolicyPayload = {
  query: string;
  snippets: string[];
};

type HealthPayload = {
  connectedToMaven: boolean;
};

type EscalationPayload = {
  ticketId: string;
  status: 'created';
};

export default function DemoPage() {
  const [question, setQuestion] = useState(presetQuestions[0]);
  const [billingRecord, setBillingRecord] = useState<BillingRecord | null>(null);
  const [policySnippets, setPolicySnippets] = useState<string[]>([]);
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);
  const [connectedToMaven, setConnectedToMaven] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [escalation, setEscalation] = useState<EscalationPayload | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: HealthPayload) => setConnectedToMaven(data.connectedToMaven))
      .catch(() => setConnectedToMaven(false));
  }, []);

  const runDemo = async () => {
    setLoading(true);
    setEscalation(null);

    try {
      const billingPromise = fetch('/api/billing?patientId=PT-10294&encounterId=ER-5571').then((res) =>
        res.json(),
      );
      const policyPromise = fetch(`/api/policy?q=${encodeURIComponent(question)}`).then((res) => res.json());

      const [billingData, policyData]: [BillingRecord, PolicyPayload] = await Promise.all([
        billingPromise,
        policyPromise,
      ]);

      setBillingRecord(billingData);
      setPolicySnippets(policyData.snippets);

      const agentRes = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          billingRecord: billingData,
          policySnippets: policyData.snippets,
        }),
      });

      const agentData: AgentResponse = await agentRes.json();
      setAgentResponse(agentData);
    } finally {
      setLoading(false);
    }
  };

  const escalate = async () => {
    if (!billingRecord) {
      return;
    }

    const res = await fetch('/api/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId: billingRecord.invoiceId,
        question,
      }),
    });

    const data: EscalationPayload = await res.json();
    setEscalation(data);
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Charles River Health System</h1>
          <p className="mt-1 text-sm text-slate-600">Precision Care. Powered by Insight.</p>
        </div>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
          {connectedToMaven === null
            ? 'Checking connection...'
            : connectedToMaven
              ? 'Connected to Maven'
              : 'Demo mode'}
        </span>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card space-y-4">
          <h2 className="text-lg font-semibold">Patient Question</h2>
          <select
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          >
            {presetQuestions.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
          <textarea
            className="h-48 w-full rounded-xl border border-slate-200 p-3 text-sm leading-relaxed"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button
            onClick={runDemo}
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Running demo…' : 'Run demo'}
          </button>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">Billing Record</h2>
            {!billingRecord || loading ? (
              <div className="space-y-2 text-sm text-slate-400">
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-3/5 animate-pulse rounded bg-slate-100" />
              </div>
            ) : (
              <div className="space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-medium">Invoice:</span> {billingRecord.invoiceId}
                </p>
                <p>
                  <span className="font-medium">Status:</span> {billingRecord.status}
                </p>
                <p>
                  <span className="font-medium">Total:</span> ${billingRecord.total.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Paid:</span> ${billingRecord.paid.toFixed(2)}
                </p>
                <p>
                  <span className="font-medium">Balance:</span> ${billingRecord.balance.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="mb-3 text-lg font-semibold">Policy Snippets</h2>
            {loading ? (
              <div className="space-y-2 text-sm text-slate-400">
                <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
              </div>
            ) : (
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                {policySnippets.map((snippet) => (
                  <li key={snippet}>{snippet}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 text-lg font-semibold">Agent Answer</h2>
          {!agentResponse || loading ? (
            <div className="space-y-2 text-sm text-slate-400">
              <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-slate-100" />
              <div className="h-4 w-9/12 animate-pulse rounded bg-slate-100" />
            </div>
          ) : (
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</p>
                <p>{agentResponse.summary}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Explanation</p>
                <ul className="list-disc space-y-1 pl-5">
                  {agentResponse.explanation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Next steps</p>
                <ul className="list-disc space-y-1 pl-5">
                  {agentResponse.next_steps.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Confidence</p>
                <p>{Math.round(agentResponse.confidence * 100)}%</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Citations</p>
                <ul className="list-disc space-y-1 pl-5">
                  {agentResponse.citations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <button
            onClick={escalate}
            disabled={!agentResponse || loading}
            className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Escalate to billing specialist
          </button>

          {escalation && (
            <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Ticket {escalation.ticketId} was created successfully.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
