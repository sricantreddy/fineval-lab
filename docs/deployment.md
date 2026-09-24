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
```

## 2. Connect GitHub

Create a GitHub repository and push this project. The included workflow runs tests and builds the application on pull requests and pushes to `main`.

## 3. Deploy the web application to Vercel

Import the GitHub repository, keep the detected Vite settings, and add `VITE_CONVEX_URL` in project settings.

## 4. Deploy Convex

Add `CONVEX_DEPLOY_KEY` to Vercel. Run `npm run convex:deploy` before the web build when backend schema or functions change.
