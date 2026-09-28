import { query } from "./_generated/server";
import { configuredModels } from "../src/domain/providerConfig";

export const providerStatus = query({
  args: {},
  handler: async () => {
    const models = configuredModels(process.env.AGENT_MODEL, process.env.AGENT_MODELS);
    const configured = Boolean(process.env.AGENT_API_KEY && models.length > 0);
    return {
      configured,
      provider: configured ? process.env.AGENT_PROVIDER ?? "OpenAI-compatible" : null,
      models: configured ? models : [],
    };
  },
});
