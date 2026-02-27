"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  AgentResponse,
  BillingRecord,
  EhrPayload,
  KnowledgeBaseItem,
  SupportCase
} from "@/lib/types";
import brandImage from "./Gemini_Generated_Image_832fw0832fw0832f.png";

const PATIENT_ID = "P-10983";
const ENCOUNTER_ID = "E-77210";

const presets = [
  "Why is my bill higher than expected for my ER visit?",
  "Can I set up a payment plan for my balance?",
  "I think I was charged twice for a lab test. Can you check?"
];

const connectedSystems = [
  "Epic (FHIR)",
  "Waystar RCM",
  "Confluence",
  "Salesforce Health Cloud"
];

export default function Page() {
  const [question, setQuestion] = useState(presets[0]);
  const [connectedToMaven, setConnectedToMaven] = useState<boolean | null>(null);
  const [ehrData, setEhrData] = useState<EhrPayload | null>(null);
  const [billingRecord, setBillingRecord] = useState<BillingRecord | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeBaseItem[]>([]);
  const [agentAnswer, setAgentAnswer] = useState<AgentResponse | null>(null);
  const [supportCase, setSupportCase] = useState<SupportCase | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d: { connectedToMaven: boolean }) => setConnectedToMaven(d.connectedToMaven))
      .catch(() => setConnectedToMaven(false));
  }, []);

  const runDemo = async () => {
    setLoading(true);
    setSupportCase(null);
    setAgentAnswer(null);

    try {
      const [ehrRes, billingRes, policyRes] = await Promise.all([
        fetch(`/api/ehr?patientId=${PATIENT_ID}&encounterId=${ENCOUNTER_ID}`),
        fetch(`/api/billing?patientId=${PATIENT_ID}&encounterId=${ENCOUNTER_ID}`),
        fetch(`/api/policy?q=${encodeURIComponent(question)}`)
      ]);

      const ehrJson = (await ehrRes.json()) as EhrPayload;
      const billingJson = (await billingRes.json()) as BillingRecord;
      const policyJson = (await policyRes.json()) as { results: KnowledgeBaseItem[] };

      setEhrData(ehrJson);
      setBillingRecord(billingJson);
      setKnowledgeItems(policyJson.results);

      const agentRes = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          patientId: PATIENT_ID,
          encounterId: ENCOUNTER_ID
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
      body: JSON.stringify({ claimId: billingRecord.claimId, question })
    });
    const json = (await res.json()) as SupportCase;
    setSupportCase(json);
  };

  return (
    <main className="min-h-screen overflow-y-auto bg-violet-50/40 px-5 py-4 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="space-y-2">
          <Image
            src={brandImage}
            alt="Charles River Health System"
            priority
            quality={100}
            sizes="(max-width: 768px) 35vw, 110px"
            className="h-auto w-full max-w-[110px] rounded-xl border border-violet-200 bg-white object-contain shadow-sm"
          />
          <p className="text-xs text-violet-700/80">AI Support Copilot embedded in Epic MyChart</p>
          <div className="badge">
            {connectedToMaven === null
              ? "Checking connection..."
              : connectedToMaven
                ? "Connected to Maven"
                : "Demo mode"}
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="card space-y-3">
            <h2 className="text-base font-semibold text-violet-950">Patient Question</h2>
            <select
              className="w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm text-violet-950 focus:border-violet-400 focus:outline-none"
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
              className="h-24 w-full rounded-xl border border-violet-200 px-3 py-2 text-sm text-violet-950 outline-none ring-0 focus:border-violet-400"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <button
              onClick={runDemo}
              disabled={loading}
              className="w-full rounded-xl bg-violet-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Running demo..." : "Run demo"}
            </button>
          </div>

          <div className="card space-y-3 border-fuchsia-300 bg-fuchsia-100">
            <h2 className="text-base font-semibold text-fuchsia-950">Context</h2>

            <div className="space-y-2 rounded-xl border border-fuchsia-300 bg-fuchsia-200/70 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fuchsia-800">
                Connected Systems
              </h3>
              <ul className="space-y-1 text-sm text-fuchsia-950/85">
                {connectedSystems.map((system) => (
                  <li key={system}>- {system}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 rounded-xl border border-fuchsia-300 bg-fuchsia-200/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-800/80">
                Epic FHIR Data
              </p>
              {ehrData ? (
                <ul className="space-y-1 text-sm text-fuchsia-950/85">
                  <li>Patient: {ehrData.patient.name[0]?.given.join(" ")} {ehrData.patient.name[0]?.family}</li>
                  <li>Encounter: {ehrData.encounter.id}</li>
                  <li>Encounter class: {ehrData.encounter.class.display}</li>
                  <li>Coverage: {ehrData.coverage.type.text}</li>
                  <li>Payor: {ehrData.coverage.payor[0]?.display}</li>
                </ul>
              ) : (
                <p className="text-sm text-fuchsia-900/70">Run the demo to load Epic resources.</p>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-fuchsia-300 bg-fuchsia-200/55 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-800/80">
                Waystar Claim Record
              </p>
              {billingRecord ? (
                <div className="space-y-2">
                  <ul className="space-y-1 text-sm text-fuchsia-950/85">
                    <li>Claim: {billingRecord.claimId}</li>
                    <li>Status: {billingRecord.status}</li>
                    <li>Allowed: ${billingRecord.allowedAmount.toFixed(2)}</li>
                    <li>Patient responsibility: ${billingRecord.patientResponsibility.toFixed(2)}</li>
                    <li>Deductible applied: ${billingRecord.deductibleApplied.toFixed(2)}</li>
                  </ul>
                  <ul className="space-y-1 text-xs text-fuchsia-900/80">
                    {billingRecord.lineItems.map((item) => (
                      <li key={item.cptCode}>
                        CPT {item.cptCode}: ${item.patientResponsibility.toFixed(2)} patient share
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-fuchsia-900/70">Run the demo to load Waystar claim data.</p>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-fuchsia-300 bg-fuchsia-200/55 p-4">
              <h3 className="text-sm font-semibold text-fuchsia-950">Knowledge Base</h3>
              {knowledgeItems.length ? (
                <ul className="space-y-2 text-sm text-fuchsia-950/85">
                  {knowledgeItems.map((item) => (
                    <li key={`${item.source}-${item.title}`} className="rounded-lg border border-fuchsia-300 bg-fuchsia-100 p-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-fuchsia-800/80">
                        Confluence Article
                      </p>
                      <p className="mt-1 font-medium text-fuchsia-950">{item.title}</p>
                      <p className="text-xs text-fuchsia-950/75">{item.snippet}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-fuchsia-900/70">Run the demo to search policy knowledge sources.</p>
              )}
            </div>
          </div>

          <div className="card space-y-3">
            <h2 className="text-base font-semibold text-violet-950">Agent Answer</h2>
            {loading && !agentAnswer ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-3/4 rounded bg-violet-200/80" />
                <div className="h-3 w-full rounded bg-violet-200/80" />
                <div className="h-3 w-11/12 rounded bg-violet-200/80" />
                <div className="h-3 w-2/3 rounded bg-violet-200/80" />
              </div>
            ) : agentAnswer ? (
              <div className="space-y-3">
                <p className="text-sm leading-6 text-violet-950/90">{agentAnswer.summary}</p>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-700/80">Explanation</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-violet-900/85">
                    {agentAnswer.explanation.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-700/80">Next steps</h3>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-violet-900/85">
                    {agentAnswer.next_steps.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1 rounded-xl border border-violet-200 bg-violet-50 p-3 text-xs text-violet-800/85">
                  <div className="flex items-center justify-between">
                    <span>Confidence: {(agentAnswer.confidence * 100).toFixed(0)}%</span>
                    <span>{agentAnswer.sources_used.length} sources</span>
                  </div>
                  <ul className="space-y-1">
                    {agentAnswer.sources_used.map((source) => (
                      <li key={source}>{source}</li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={escalate}
                  className="w-full rounded-xl border border-fuchsia-300 bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-300"
                >
                  Escalate to billing specialist
                </button>
                {supportCase && (
                  <div className="space-y-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                      Salesforce Case Created
                    </p>
                    <p>Case: {supportCase.caseId}</p>
                    <p>Status: {supportCase.status}</p>
                    <p>Priority: {supportCase.priority}</p>
                    <p>ETA: {supportCase.estimatedResponseTime}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-violet-800/70">Run the demo to generate an agent response.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

