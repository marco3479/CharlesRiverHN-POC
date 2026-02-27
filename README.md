# Charles River Health System Demo

Polished Next.js App Router demo that simulates a Maven AGI-powered billing support workflow for a healthcare system.

## Features
- Patient billing question intake with prefilled prompts.
- Mock billing + policy retrieval via server route handlers.
- Agent response generation through Maven AGI SDK when credentials are present.
- Deterministic local fallback response when credentials are missing.
- Escalation workflow that creates a mock ticket confirmation.

## Project Structure
- `app/page.tsx`: main single-page demo shell.
- `components/demo-page.tsx`: client UI and orchestration logic.
- `app/api/health`: connectivity status for Maven credentials.
- `app/api/billing`: mock billing record endpoint.
- `app/api/policy`: mock policy snippet endpoint.
- `app/api/agent`: Maven-backed or fallback structured response generation.
- `app/api/escalate`: mock escalation ticket endpoint.

## Local Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Set Maven environment variables in `.env.local`:
   ```bash
   MAVEN_APP_ID=your_app_id
   MAVEN_APP_SECRET=your_app_secret
   MAVEN_ORG_ID=your_org_id
   MAVEN_AGENT_ID=your_agent_id
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000.
