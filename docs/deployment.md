# Deployment

## 1. Create the Convex project

```bash
npm install
npx convex dev
```

The command creates a Convex deployment, writes `VITE_CONVEX_URL` to `.env.local`, and generates the typed files under `convex/_generated`.

Seed a new empty development deployment with synthetic records:

```bash
npx convex run seed:demoData
npx convex run goldenDataset:seed
```

## 2. Connect an agent provider after cloning

The public application has no provider-setup page or Convex dashboard link. The repository owner configures each deployment privately through the Convex CLI or Convex dashboard.

Add these values under **Settings → Environment Variables**:

```text
AGENT_API_KEY=<provider secret>
AGENT_MODEL=<model identifier>
AGENT_API_BASE_URL=https://api.openai.com/v1
AGENT_PROVIDER=OpenAI
```

The adapter accepts an HTTPS OpenAI-compatible chat-completions endpoint. Configure development and production separately. Before a run, the UI receives only a configured-or-not status. It never receives the key.

Google AI Studio keys work through Gemini's OpenAI-compatible endpoint:

```text
AGENT_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AGENT_PROVIDER=Google AI Studio
AGENT_MODEL=<selected Gemini model>
```

The CLI can prompt for each value without putting the key in a committed file:

```bash
npx convex env set AGENT_API_KEY
npx convex env set AGENT_MODEL
npx convex env set AGENT_API_BASE_URL
npx convex env set AGENT_PROVIDER
```

Use the same commands with `--prod` for production.

## 3. Connect GitHub

Create a GitHub repository and push this project. The included workflow runs tests and builds the application on pull requests and pushes to `main`.

## 4. Deploy the web application to Vercel

Import the GitHub repository, keep the detected Vite settings, and add `VITE_CONVEX_URL` in project settings.

## 5. Deploy Convex

Add `CONVEX_DEPLOY_KEY` to Vercel. Run `npm run convex:deploy` before the web build when backend schema or functions change.

After deploying a new backend, seed the production golden dataset:

```bash
npx convex run goldenDataset:seed --prod
```
