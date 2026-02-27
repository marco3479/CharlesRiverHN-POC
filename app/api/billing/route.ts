import { NextRequest, NextResponse } from "next/server";
import { BillingRecord } from "@/lib/types";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId") ?? "P-10983";
  const encounterId = request.nextUrl.searchParams.get("encounterId") ?? "E-77210";

  const record: BillingRecord = {
    patientId,
    encounterId,
    invoiceId: `INV-${encounterId}`,
    total: 1840,
    paid: 500,
    balance: 1340,
    dueDate: "2026-03-15",
    status: "open",
    lineItems: [
      { code: "ER-99284", description: "Emergency department visit", amount: 1200 },
      { code: "LAB-80053", description: "Comprehensive metabolic panel", amount: 220 },
      { code: "IMG-71045", description: "Chest X-ray", amount: 320 },
      { code: "FAC-ER", description: "Facility services", amount: 100 }
    ]
  };

  return NextResponse.json(record);
}
