import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { invoiceId } = (await request.json()) as { invoiceId: string; question: string };
  const ticketId = `TKT-${Date.now().toString().slice(-7)}-${invoiceId ?? "NA"}`;

  return NextResponse.json({ ticketId, status: "created" as const });
}
