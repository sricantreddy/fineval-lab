import { query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("agentVersions").order("desc").collect(),
});

export const providerStatus = query({
  args: {},
  handler: async () => ({
    configured: Boolean(process.env.AGENT_API_KEY),
    provider: process.env.AGENT_PROVIDER ?? "OpenAI-compatible",
    model: process.env.AGENT_MODEL ?? "Not configured",
    baseUrl: process.env.AGENT_API_BASE_URL ?? "https://api.openai.com/v1",
    secretLocation: "Convex environment variables",
  }),
});
