import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { AGENT_SYSTEM_PROMPT } from "../src/domain/syntheticAgent";

const candidateValidator = v.object({ intent: v.string(), score: v.number(), signal: v.string() });
const stepValidator = v.object({
  order: v.number(),
  name: v.string(),
  summary: v.string(),
  status: v.union(v.literal("completed"), v.literal("skipped")),
});

export const record = internalMutation({
  args: {
    message: v.string(),
    promptVersion: v.string(),
    candidateIntents: v.array(candidateValidator),
    selectedIntent: v.string(),
    selectedTool: v.union(v.string(), v.null()),
    toolInput: v.string(),
    toolResult: v.string(),
    response: v.string(),
    steps: v.array(stepValidator),
    backendLatencyMs: v.number(),
    executionMode: v.union(v.literal("synthetic"), v.literal("connected")),
    provider: v.string(),
    model: v.string(),
    datasetVersion: v.string(),
  },
  handler: async (ctx, args) => {
    const traceId = await ctx.db.insert("agentTraces", { ...args, createdAt: Date.now() });
    const versionName = `${args.provider}-${args.model}-${args.promptVersion}`
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .slice(0, 120);
    const existingVersion = await ctx.db
      .query("agentVersions")
      .withIndex("by_version", (q) => q.eq("version", versionName))
      .unique();
    if (!existingVersion) {
      const activeVersions = await ctx.db
        .query("agentVersions")
        .withIndex("by_active", (q) => q.eq("active", true))
        .collect();
      for (const version of activeVersions) await ctx.db.patch(version._id, { active: false });
      await ctx.db.insert("agentVersions", {
        version: versionName,
        label: "Connected agent",
        provider: args.provider,
        model: args.model,
        promptVersion: args.promptVersion,
        systemPrompt: AGENT_SYSTEM_PROMPT,
        datasetVersion: args.datasetVersion,
        active: true,
        createdAt: Date.now(),
      });
    }
    const recentTraces = await ctx.db.query("agentTraces").withIndex("by_created_at").order("desc").take(51);
    if (recentTraces.length > 50) await ctx.db.delete(recentTraces[50]._id);
    return traceId;
  },
});
