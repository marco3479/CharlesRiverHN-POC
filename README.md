# Charles River Health System Demo

A polished Next.js App Router demo that simulates a Maven AGI-powered billing support flow.

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Configure Maven credentials in `.env.local`:
   ```bash
   MAVEN_APP_ID=your_app_id
   MAVEN_APP_SECRET=your_app_secret
   MAVEN_ORG_ID=your_org_id
   MAVEN_AGENT_ID=your_agent_id
   ```

   If these are not set, the app automatically runs in deterministic demo mode.

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.
