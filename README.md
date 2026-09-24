# FinEval Lab

FinEval Lab is an evaluation-first release gate for digital banking support agents. It tests whether a candidate agent chooses the correct tools, protects customer data, escalates risky cases, grounds its answers, and stays within latency and cost limits.

The banking agent is the test subject. The evaluation workflow is the product.

## Current first slice

- Responsive shadcn/ui dashboard with a focused release-readiness view
- Persistent dark and light modes, with dark mode as the default
- Side-by-side support-agent playground and execution inspector
- Visible, versioned system prompt with structured intent and tool traces
- Synthetic payment, ATM, fraud, authorization, and general-support routes
- Convex-backed trace capture capped to the 50 most recent sandbox runs
- Secure OpenAI-compatible agent adapter with secrets kept in Convex environment variables
- Versioned 75-case golden dataset covering five banking-support intent families
- Trace metadata for provider, model, prompt version, and dataset version
- One-click deterministic evaluation with case-level results stored in Convex
- Evaluation run comparison
- Golden test-case browser
- Support-message review queue
- Human-approved conversion of support failures into regression cases
- Deterministic TypeScript evaluator with tests
- Convex schema and server functions
- Live Convex queries and support-message promotion mutations
- Idempotent synthetic-data seed
- GitHub Actions test and build gate
- Vercel deployment configuration

The development environment is connected to a Convex cloud deployment. The included seed uses synthetic banking scenarios only.

## Run locally

```bash
npm install
npm run dev
```

Run the quality checks:

```bash
npm test
npm run build
```

Connect a new local checkout to Convex:

```bash
npx convex dev
npx convex run goldenDataset:seed
```

## Configure an agent after cloning

Provider setup is intentionally absent from the deployed FinEval Lab UI. Each person who clones the repository must connect their own provider to their own Convex deployment.

Set these variables through the Convex CLI or in the private Convex dashboard under **Settings → Environment Variables**:

```text
AGENT_API_KEY=<provider secret>
AGENT_MODEL=<model identifier>
AGENT_API_BASE_URL=https://api.openai.com/v1
AGENT_PROVIDER=OpenAI
```

`AGENT_API_BASE_URL` can point to any HTTPS service that implements the OpenAI chat-completions format. Add the values separately to development and production. Never add an API key to `.env`, the browser, Convex tables, Vercel public variables, or GitHub.

For a Gemini key created in Google AI Studio, use:

```text
AGENT_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
AGENT_PROVIDER=Google AI Studio
AGENT_MODEL=<the Gemini model selected by the repository owner>
```

Set a secret interactively so it does not appear in shell history:

```bash
npx convex env set AGENT_API_KEY
npx convex env set AGENT_MODEL
npx convex env set AGENT_API_BASE_URL
npx convex env set AGENT_PROVIDER
```

Append `--prod` to configure the production deployment. The connected-model control activates only on deployments with both `AGENT_API_KEY` and `AGENT_MODEL`.

## Product documents

- [Product specification](docs/product-spec.md)
- [Architecture](docs/architecture.md)
- [Deployment](docs/deployment.md)

## Technology choices

- React, TypeScript, and Vite
- shadcn/ui default style and Tailwind CSS
- Convex backend
- GitHub Actions CI
- Vercel hosting
- Codex-assisted development workflow

## Safety boundary

This project uses synthetic data. It does not move money, make lending decisions, provide investment advice, or connect to real banking accounts.

## Roadmap

- Run the 75-case dataset against connected agents
- Add failure drill-downs and side-by-side release comparisons
- Add a trace importer for external banking agents
- Add release comparisons and failure drill-downs
- Add PII redaction before support-message review
- Add multilingual and code-mixed banking cases
- Add calibrated model-based judges for groundedness and response quality
