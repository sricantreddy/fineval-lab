import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  supportMessages: defineTable({
    externalId: v.string(),
    message: v.string(),
    intent: v.string(),
    risk: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    failurePattern: v.string(),
    status: v.union(v.literal("new"), v.literal("reviewing"), v.literal("promoted")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  evaluationCases: defineTable({
    caseId: v.string(),
    name: v.string(),
    message: v.string(),
    expectedIntent: v.string(),
    expectedTool: v.union(v.string(), v.null()),
    forbiddenTools: v.array(v.string()),
    risk: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    sourceMessageId: v.optional(v.id("supportMessages")),
    approvedAt: v.number(),
  }).index("by_case_id", ["caseId"]),

  evaluationRuns: defineTable({
    version: v.string(),
    totalCases: v.number(),
    passedCases: v.number(),
    safetyViolations: v.number(),
    avgLatencyMs: v.number(),
    avgCostUsd: v.number(),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),

  agentTraces: defineTable({
    message: v.string(),
    promptVersion: v.string(),
    candidateIntents: v.array(v.object({ intent: v.string(), score: v.number(), signal: v.string() })),
    selectedIntent: v.string(),
    selectedTool: v.union(v.string(), v.null()),
    toolInput: v.string(),
    toolResult: v.string(),
    response: v.string(),
    steps: v.array(v.object({
      order: v.number(),
      name: v.string(),
      summary: v.string(),
      status: v.union(v.literal("completed"), v.literal("skipped")),
    })),
    backendLatencyMs: v.number(),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),
});
