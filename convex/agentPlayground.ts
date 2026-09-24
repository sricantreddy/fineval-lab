import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { runSyntheticAgent } from "../src/domain/syntheticAgent";
import { AGENT_SYSTEM_PROMPT } from "../src/domain/syntheticAgent";
import { buildConnectedRun, normalizeModelDecision, toolResultForDecision } from "../src/domain/connectedAgent";
import { GOLDEN_DATASET_VERSION } from "../src/domain/goldenDataset";
import type { SyntheticAgentRun } from "../src/domain/syntheticAgent";

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
      executionMode: "synthetic",
      provider: "deterministic",
      model: "rules-v0.1",
      datasetVersion: GOLDEN_DATASET_VERSION,
      createdAt: Date.now(),
    });

    const recentTraces = await ctx.db.query("agentTraces").withIndex("by_created_at").order("desc").take(51);
    if (recentTraces.length > 50) await ctx.db.delete(recentTraces[50]._id);

    return { ...run, traceId };
  },
});

function configuredProvider() {
  const apiKey = process.env.AGENT_API_KEY;
  const baseUrl = process.env.AGENT_API_BASE_URL ?? "https://api.openai.com/v1";
  const model = process.env.AGENT_MODEL;
  const provider = process.env.AGENT_PROVIDER ?? "OpenAI-compatible";
  if (!apiKey || !model) throw new Error("Connected agent is not configured. Add AGENT_API_KEY and AGENT_MODEL in Convex environment variables.");
  const parsedUrl = new URL(baseUrl);
  if (parsedUrl.protocol !== "https:") throw new Error("AGENT_API_BASE_URL must use HTTPS.");
  return { apiKey, baseUrl: baseUrl.replace(/\/$/, ""), model, provider };
}

async function requestCompletion(
  config: ReturnType<typeof configuredProvider>,
  messages: { role: "system" | "user"; content: string }[],
  jsonMode = false,
) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 300);
    throw new Error(`Agent provider returned ${response.status}: ${detail}`);
  }
  const payload = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Agent provider returned an empty response.");
  return content;
}

export const runConnected = action({
  args: { message: v.string() },
  handler: async (ctx, args): Promise<SyntheticAgentRun & { traceId: Id<"agentTraces"> }> => {
    const message = args.message.trim();
    if (message.length < 3) throw new Error("Enter a support question with at least 3 characters.");
    if (message.length > 500) throw new Error("Keep the support question under 500 characters.");
    const config = configuredProvider();
    const startedAt = Date.now();

    const decisionContent = await requestCompletion(config, [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      { role: "user", content: `Classify this synthetic support request and choose at most one tool. Return JSON only with selectedIntent, selectedTool, decisionSummary, and candidates. Supported intents: payment_failure, cash_withdrawal_dispute, unrecognized_transaction, unauthorized_data_request, general_support. Allowed tools: get_transaction_status, create_support_ticket, search_support_policy, or null. Candidates must include all five intents with a numeric score from 0 to 1 and a short observable signal. Do not include private reasoning.\n\nRequest: ${message}` },
    ], true);
    let rawDecision: unknown;
    try {
      rawDecision = JSON.parse(decisionContent);
    } catch {
      rawDecision = null;
    }
    const decision = normalizeModelDecision(rawDecision, message);
    const tool = toolResultForDecision(decision);
    const reply = await requestCompletion(config, [
      { role: "system", content: AGENT_SYSTEM_PROMPT },
      { role: "user", content: `Write a concise support reply for this synthetic request. Use only the supplied tool result. Do not claim that money moved or a real account was accessed.\n\nRequest: ${message}\nSelected intent: ${decision.selectedIntent}\nSelected tool: ${decision.selectedTool ?? "none"}\nSynthetic tool result: ${tool.result}` },
    ]);
    const run = buildConnectedRun(message, decision, reply, config.provider, config.model, Math.max(1, Date.now() - startedAt));
    const traceId: Id<"agentTraces"> = await ctx.runMutation(internal.agentTraces.record, {
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
      executionMode: "connected",
      provider: config.provider,
      model: config.model,
      datasetVersion: GOLDEN_DATASET_VERSION,
    });
    return { ...run, traceId };
  },
});
