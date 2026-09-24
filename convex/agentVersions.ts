import { query } from "./_generated/server";

export const providerStatus = query({
  args: {},
  handler: async () => ({ configured: Boolean(process.env.AGENT_API_KEY && process.env.AGENT_MODEL) }),
});
