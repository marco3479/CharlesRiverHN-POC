import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { invoiceId, question } = (await request.json()) as { invoiceId: string; question: string };

  const suffix = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, '0');

  return NextResponse.json({
    ticketId: `TKT-${suffix}-${invoiceId.slice(-3)}`,
    status: 'created',
    note: `Escalated for review: ${question.slice(0, 80)}`,
  });
}
