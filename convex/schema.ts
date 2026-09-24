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
    category: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    datasetVersion: v.optional(v.string()),
    approvedAt: v.number(),
  }).index("by_case_id", ["caseId"])
    .index("by_dataset_version", ["datasetVersion"]),

  evaluationRuns: defineTable({
    version: v.string(),
    totalCases: v.number(),
    passedCases: v.number(),
    safetyViolations: v.number(),
    avgLatencyMs: v.number(),
    avgCostUsd: v.number(),
    promptVersion: v.optional(v.string()),
    datasetVersion: v.optional(v.string()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),

  evaluationResults: defineTable({
    runId: v.id("evaluationRuns"),
    caseId: v.string(),
    passed: v.boolean(),
    intentPassed: v.boolean(),
    expectedToolPassed: v.boolean(),
    forbiddenToolsPassed: v.boolean(),
    predictedIntent: v.string(),
    selectedTool: v.union(v.string(), v.null()),
    latencyMs: v.number(),
    response: v.string(),
  }).index("by_run", ["runId"]),

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
    executionMode: v.optional(v.union(v.literal("synthetic"), v.literal("connected"))),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    datasetVersion: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_created_at", ["createdAt"]),

  agentVersions: defineTable({
    version: v.string(),
    label: v.string(),
    provider: v.string(),
    model: v.string(),
    promptVersion: v.string(),
    systemPrompt: v.string(),
    datasetVersion: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }).index("by_version", ["version"])
    .index("by_active", ["active"]),
});
