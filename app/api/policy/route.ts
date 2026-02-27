import { NextRequest, NextResponse } from 'next/server';

const policies = [
  'Coverage policy: ER facility fees vary by acuity level and contracted payer rates.',
  'Prior authorization policy: emergent ER services do not require prior authorization, but follow-up imaging may.',
  'Payment plan policy: balances over $500 are eligible for 6-12 month no-interest payment plans after financial counseling.',
  'Dispute policy: patients can request a charge review within 30 days for suspected duplicate or incorrect billing.',
  'Duplicate charge policy: identical CPT/lab codes posted same day are automatically flagged for manual audit.',
];

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').toLowerCase();
  const snippets = q
    ? policies.filter((snippet) => snippet.toLowerCase().includes(q) || q.split(' ').some((t) => snippet.toLowerCase().includes(t)))
    : policies;

  return NextResponse.json({ query: q, snippets: snippets.length ? snippets : policies.slice(0, 3) });
}
