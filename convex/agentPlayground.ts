import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { runSyntheticAgent } from "../src/domain/syntheticAgent";

export const run = mutation({
  args: { message: v.string() },
  handler: async (ctx, args) => {
    const message = args.message.trim();
    if (message.length < 3) throw new Error("Enter a support question with at least 3 characters.");
    if (message.length > 500) throw new Error("Keep the support question under 500 characters.");

    const startedAt = Date.now();
    const initialRun = runSyntheticAgent(message);
    const run = { ...initialRun, backendLatencyMs: Math.max(1, Date.now() - startedAt) };
    const traceId = await ctx.db.insert("agentTraces", {
      message: run.message,
      promptVersion: run.promptVersion,
      candidateIntents: run.candidates,
      selectedIntent: run.selectedIntent,
      selectedTool: run.selectedTool,
      toolInput: run.toolInput,
      toolResult: run.toolResult,
      response: run.response,
      steps: run.steps,
      backendLatencyMs: run.backendLatencyMs,
      createdAt: Date.now(),
    });

    const recentTraces = await ctx.db.query("agentTraces").withIndex("by_created_at").order("desc").take(51);
    if (recentTraces.length > 50) await ctx.db.delete(recentTraces[50]._id);

    return { ...run, traceId };
  },
});
