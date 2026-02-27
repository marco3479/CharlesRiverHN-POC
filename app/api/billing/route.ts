import { NextRequest, NextResponse } from 'next/server';
import type { BillingRecord } from '@/lib/types';

export async function GET(request: NextRequest) {
  const patientId = request.nextUrl.searchParams.get('patientId') ?? 'PT-10294';
  const encounterId = request.nextUrl.searchParams.get('encounterId') ?? 'ER-5571';

  const record: BillingRecord = {
    patientId,
    encounterId,
    invoiceId: 'INV-883024',
    total: 2475,
    paid: 900,
    balance: 1575,
    dueDate: '2026-03-15',
    status: 'open',
    lineItems: [
      { code: 'ER100', description: 'Emergency department facility fee', amount: 1800 },
      { code: 'LAB204', description: 'Comprehensive metabolic panel', amount: 225 },
      { code: 'IMG319', description: 'Chest X-ray, two view', amount: 450 },
    ],
  };

  return NextResponse.json(record);
}
