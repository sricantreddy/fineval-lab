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
```

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

- Add a 200-case synthetic golden dataset
- Connect playground traces to the deterministic evaluation runner
- Add a trace importer for external banking agents
- Add release comparisons and failure drill-downs
- Add PII redaction before support-message review
- Add multilingual and code-mixed banking cases
- Add calibrated model-based judges for groundedness and response quality
