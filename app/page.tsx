"use client";

import { useEffect, useState } from "react";
import { AgentResponse, BillingRecord, PolicySnippet } from "@/lib/types";

const presets = [
  "Why is my bill higher than expected for my ER visit?",
  "Can I set up a payment plan for my balance?",
  "I think I was charged twice for a lab test. Can you check?"
];

export default function Page() {
  const [question, setQuestion] = useState(presets[0]);
  const [connectedToMaven, setConnectedToMaven] = useState<boolean | null>(null);
  const [billingRecord, setBillingRecord] = useState<BillingRecord | null>(null);
  const [policySnippets, setPolicySnippets] = useState<PolicySnippet[]>([]);
  const [agentAnswer, setAgentAnswer] = useState<AgentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [escalationTicket, setEscalationTicket] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d: { connectedToMaven: boolean }) => setConnectedToMaven(d.connectedToMaven))
      .catch(() => setConnectedToMaven(false));
  }, []);

  const runDemo = async () => {
    setLoading(true);
    setEscalationTicket(null);
    setAgentAnswer(null);

    try {
      const [billingRes, policyRes] = await Promise.all([
        fetch("/api/billing?patientId=P-10983&encounterId=E-77210"),
        fetch(`/api/policy?q=${encodeURIComponent(question)}`)
      ]);

      const billing = (await billingRes.json()) as BillingRecord;
      const policy = (await policyRes.json()) as { snippets: PolicySnippet[] };

      setBillingRecord(billing);
      setPolicySnippets(policy.snippets);

      const agentRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          billingRecord: billing,
          policySnippets: policy.snippets.map((s) => s.snippet)
        })
      });

      const agentJson = (await agentRes.json()) as AgentResponse;
      setAgentAnswer(agentJson);
    } finally {
      setLoading(false);
    }
  };

  const escalate = async () => {
    if (!billingRecord) return;

    const res = await fetch("/api/escalate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: billingRecord.invoiceId, question })
    });
    const json = (await res.json()) as { ticketId: string };
    setEscalationTicket(json.ticketId);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50/70 px-6 py-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Charles River Health System</h1>
          <p className="text-sm text-slate-600">Precision Care. Powered by Insight.</p>
          <div className="badge">
            {connectedToMaven === null
              ? "Checking connection..."
              : connectedToMaven
                ? "Connected to Maven"
                : "Demo mode"}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">Patient Question</h2>
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            >
              {presets.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
            <textarea
              className="h-36 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-0 focus:border-slate-400"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              onClick={runDemo}
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Running demo..." : "Run demo"}
            </button>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">Context</h2>
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700">Billing Record</h3>
              {loading && !billingRecord ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-2/3 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />
                </div>
              ) : billingRecord ? (
                <ul className="space-y-1 text-sm text-slate-700">
                  <li>Invoice: {billingRecord.invoiceId}</li>
                  <li>Total: ${billingRecord.total.toFixed(2)}</li>
                  <li>Paid: ${billingRecord.paid.toFixed(2)}</li>
                  <li>Balance: ${billingRecord.balance.toFixed(2)}</li>
                  <li>Due date: {billingRecord.dueDate}</li>
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Run the demo to load billing data.</p>
              )}
            </div>
            <div className="space-y-3 rounded-xl border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-700">Policy Snippets</h3>
              {loading && policySnippets.length === 0 ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 w-full rounded bg-slate-200" />
                  <div className="h-3 w-5/6 rounded bg-slate-200" />
                </div>
              ) : policySnippets.length ? (
                <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
                  {policySnippets.map((snippet) => (
                    <li key={snippet.topic}>{snippet.snippet}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No snippets loaded yet.</p>
              )}
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold">Agent Answer</h2>
            {loading && !agentAnswer ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-200" />
                <div className="h-3 w-11/12 rounded bg-slate-200" />
                <div className="h-3 w-2/3 rounded bg-slate-200" />
              </div>
            ) : agentAnswer ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-slate-800">{agentAnswer.summary}</p>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Explanation</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {agentAnswer.explanation.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next steps</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {agentAnswer.next_steps.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  <span>Confidence: {(agentAnswer.confidence * 100).toFixed(0)}%</span>
                  <span>{agentAnswer.citations.length} citations</span>
                </div>
                <button
                  onClick={escalate}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                >
                  Escalate to billing specialist
                </button>
                {escalationTicket && (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Escalation created. Ticket ID: {escalationTicket}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Run the demo to generate an agent response.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
