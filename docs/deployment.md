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

## 3. Choose one web host

### Vercel

Import the GitHub repository, keep the detected Vite settings, and add `VITE_CONVEX_URL` in project settings.

### Netlify

Import the GitHub repository. `netlify.toml` already defines the build command, output directory, and single-page application redirect. Add `VITE_CONVEX_URL` in site configuration.

Do not connect both hosts to the production domain. Use one as production and the other only if you want a separate preview environment.

## 4. Deploy Convex

Add `CONVEX_DEPLOY_KEY` to the chosen deployment system. Run `npm run convex:deploy` before the web build when backend schema or functions change.
