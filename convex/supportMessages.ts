import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => ctx.db.query("supportMessages").order("desc").collect(),
});

export const add = mutation({
  args: {
    externalId: v.string(),
    message: v.string(),
    intent: v.string(),
    risk: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    failurePattern: v.string(),
  },
  handler: async (ctx, args) => ctx.db.insert("supportMessages", {
    ...args,
    status: "new",
    createdAt: Date.now(),
  }),
});

export const promoteToEvaluationCase = mutation({
  args: {
    messageId: v.id("supportMessages"),
    caseId: v.string(),
    name: v.string(),
    expectedIntent: v.string(),
    expectedTool: v.union(v.string(), v.null()),
    forbiddenTools: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.messageId);
    if (!source) throw new Error("Support message not found");

    const evaluationCaseId = await ctx.db.insert("evaluationCases", {
      caseId: args.caseId,
      name: args.name,
      message: source.message,
      expectedIntent: args.expectedIntent,
      expectedTool: args.expectedTool,
      forbiddenTools: args.forbiddenTools,
      risk: source.risk,
      sourceMessageId: source._id,
      approvedAt: Date.now(),
    });
    await ctx.db.patch(source._id, { status: "promoted" });
    return evaluationCaseId;
  },
});
