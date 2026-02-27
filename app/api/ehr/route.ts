import { NextRequest, NextResponse } from "next/server";
import { getEhrData } from "@/lib/mock-integrations";

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get("patientId") ?? "P-10983";
  const encounterId = request.nextUrl.searchParams.get("encounterId") ?? "E-77210";
  const payload = getEhrData(patientId, encounterId);
  return NextResponse.json(payload);
}
