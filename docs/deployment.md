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

## 2. Connect an agent provider

Open the target deployment in the Convex dashboard and add these values under **Settings → Environment Variables**:

```text
AGENT_API_KEY=<provider secret>
AGENT_MODEL=<model identifier>
AGENT_API_BASE_URL=https://api.openai.com/v1
AGENT_PROVIDER=OpenAI
```

The adapter accepts an HTTPS OpenAI-compatible chat-completions endpoint. Configure development and production separately. The UI receives only a configured status plus the provider and model names. It never receives the key.

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
