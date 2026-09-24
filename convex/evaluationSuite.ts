import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { evaluateTrace } from "../src/domain/evaluator";
import { runSyntheticAgent, AGENT_PROMPT_VERSION } from "../src/domain/syntheticAgent";
import { GOLDEN_DATASET_VERSION } from "../src/domain/goldenDataset";

export const runSynthetic = mutation({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db
      .query("evaluationCases")
      .withIndex("by_dataset_version", (q) => q.eq("datasetVersion", GOLDEN_DATASET_VERSION))
      .collect();
    if (cases.length === 0) throw new Error("Seed the golden dataset before running an evaluation.");

    const startedAt = Date.now();
    const results = cases.map((testCase) => {
      const caseStartedAt = Date.now();
      const agent = runSyntheticAgent(testCase.message);
      const evaluation = evaluateTrace({
        id: testCase.caseId,
        name: testCase.name,
        message: testCase.message,
        expectedIntent: testCase.expectedIntent,
        expectedTool: testCase.expectedTool,
        forbiddenTools: testCase.forbiddenTools,
        risk: testCase.risk,
      }, {
        predictedIntent: agent.selectedIntent,
        toolCalls: agent.selectedTool ? [agent.selectedTool] : [],
        latencyMs: Math.max(1, Date.now() - caseStartedAt),
        response: agent.response,
      });
      return { testCase, agent, evaluation, latencyMs: Math.max(1, Date.now() - caseStartedAt) };
    });

    const passedCases = results.filter((item) => item.evaluation.passed).length;
    const safetyViolations = results.filter((item) => item.testCase.risk === "high" && !item.evaluation.checks.forbiddenTools).length;
    const runId = await ctx.db.insert("evaluationRuns", {
      version: `rules-v0.1 · ${AGENT_PROMPT_VERSION}`,
      totalCases: results.length,
      passedCases,
      safetyViolations,
      avgLatencyMs: Math.max(1, Math.round((Date.now() - startedAt) / results.length)),
      avgCostUsd: 0,
      promptVersion: AGENT_PROMPT_VERSION,
      datasetVersion: GOLDEN_DATASET_VERSION,
      provider: "deterministic",
      model: "rules-v0.1",
      createdAt: Date.now(),
    });

    for (const item of results) {
      await ctx.db.insert("evaluationResults", {
        runId,
        caseId: item.testCase.caseId,
        passed: item.evaluation.passed,
        intentPassed: item.evaluation.checks.intent,
        expectedToolPassed: item.evaluation.checks.expectedTool,
        forbiddenToolsPassed: item.evaluation.checks.forbiddenTools,
        predictedIntent: item.agent.selectedIntent,
        selectedTool: item.agent.selectedTool,
        latencyMs: item.latencyMs,
        response: item.agent.response,
      });
    }

    return { runId, totalCases: results.length, passedCases, safetyViolations, datasetVersion: GOLDEN_DATASET_VERSION };
  },
});

export const resultsForRun = query({
  args: { runId: v.id("evaluationRuns") },
  handler: async (ctx, args) => ctx.db.query("evaluationResults").withIndex("by_run", (q) => q.eq("runId", args.runId)).collect(),
});
