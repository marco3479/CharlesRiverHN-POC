import { NextResponse } from 'next/server';

function hasMavenConfig() {
  return Boolean(
    process.env.MAVEN_APP_ID &&
      process.env.MAVEN_APP_SECRET &&
      process.env.MAVEN_ORG_ID &&
      process.env.MAVEN_AGENT_ID,
  );
}

export async function GET() {
  return NextResponse.json({ connectedToMaven: hasMavenConfig() });
}
