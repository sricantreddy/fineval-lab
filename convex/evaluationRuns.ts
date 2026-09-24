import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("evaluationRuns").withIndex("by_created_at").order("desc").take(20),
});

export const record = mutation({
  args: {
    version: v.string(),
    totalCases: v.number(),
    passedCases: v.number(),
    safetyViolations: v.number(),
    avgLatencyMs: v.number(),
    avgCostUsd: v.number(),
  },
  handler: async (ctx, args) => ctx.db.insert("evaluationRuns", { ...args, createdAt: Date.now() }),
});
