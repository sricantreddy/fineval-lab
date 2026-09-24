import { mutation, query } from "./_generated/server";
import { GOLDEN_CASES, GOLDEN_DATASET_VERSION } from "../src/domain/goldenDataset";
import { AGENT_PROMPT_VERSION, AGENT_SYSTEM_PROMPT } from "../src/domain/syntheticAgent";

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const cases = await ctx.db
      .query("evaluationCases")
      .withIndex("by_dataset_version", (q) => q.eq("datasetVersion", GOLDEN_DATASET_VERSION))
      .collect();
    const categories = [...new Set(cases.map((item) => item.category).filter(Boolean))];
    return { version: GOLDEN_DATASET_VERSION, caseCount: cases.length, categories };
  },
});

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    let inserted = 0;
    let updated = 0;

    for (const item of GOLDEN_CASES) {
      const existing = await ctx.db
        .query("evaluationCases")
        .withIndex("by_case_id", (q) => q.eq("caseId", item.caseId))
        .unique();
      const document = { ...item, datasetVersion: GOLDEN_DATASET_VERSION, approvedAt: Date.now() };
      if (existing) {
        await ctx.db.patch(existing._id, document);
        updated += 1;
      } else {
        await ctx.db.insert("evaluationCases", document);
        inserted += 1;
      }
    }

    const version = await ctx.db
      .query("agentVersions")
      .withIndex("by_version", (q) => q.eq("version", "agent-v0.1.0"))
      .unique();
    if (!version) {
      await ctx.db.insert("agentVersions", {
        version: "agent-v0.1.0",
        label: "Synthetic baseline",
        provider: "deterministic",
        model: "rules-v0.1",
        promptVersion: AGENT_PROMPT_VERSION,
        systemPrompt: AGENT_SYSTEM_PROMPT,
        datasetVersion: GOLDEN_DATASET_VERSION,
        active: true,
        createdAt: Date.now(),
      });
    }

    return { version: GOLDEN_DATASET_VERSION, total: GOLDEN_CASES.length, inserted, updated };
  },
});
