import {
  AGENT_PROMPT_VERSION,
  AGENT_SYSTEM_PROMPT,
  executeSyntheticTool,
  scoreIntents,
  type AgentIntent,
  type AgentStep,
  type IntentCandidate,
  type SyntheticAgentRun,
} from "./syntheticAgent";
import { GOLDEN_DATASET_VERSION } from "./goldenDataset";

const supportedIntents: AgentIntent[] = [
  "payment_failure",
  "cash_withdrawal_dispute",
  "unrecognized_transaction",
  "unauthorized_data_request",
  "general_support",
];

const allowedTools = ["get_transaction_status", "create_support_ticket", "search_support_policy"];

export interface ModelDecision {
  selectedIntent: AgentIntent;
  selectedTool: string | null;
  candidates: IntentCandidate[];
  decisionSummary: string;
}

export function normalizeModelDecision(value: unknown, message: string): ModelDecision {
  const fallback = scoreIntents(message);
  if (!value || typeof value !== "object") {
    return { selectedIntent: fallback[0].intent, selectedTool: null, candidates: fallback, decisionSummary: "The provider returned an invalid decision, so the safe fallback was used." };
  }
  const raw = value as Record<string, unknown>;
  const selectedIntent = supportedIntents.includes(raw.selectedIntent as AgentIntent)
    ? raw.selectedIntent as AgentIntent
    : fallback[0].intent;
  const selectedTool = raw.selectedTool === null || raw.selectedTool === undefined
    ? null
    : allowedTools.includes(String(raw.selectedTool)) ? String(raw.selectedTool) : null;
  const suppliedCandidates = Array.isArray(raw.candidates) ? raw.candidates : [];
  const candidates = supportedIntents.map((intent) => {
    const candidate = suppliedCandidates.find((item) => item && typeof item === "object" && (item as Record<string, unknown>).intent === intent) as Record<string, unknown> | undefined;
    const score = typeof candidate?.score === "number" ? Math.min(1, Math.max(0, candidate.score)) : fallback.find((item) => item.intent === intent)?.score ?? 0;
    return { intent, score, signal: typeof candidate?.signal === "string" ? candidate.signal.slice(0, 180) : "No provider signal supplied" };
  }).sort((a, b) => b.score - a.score);

  return {
    selectedIntent,
    selectedTool,
    candidates,
    decisionSummary: typeof raw.decisionSummary === "string" ? raw.decisionSummary.slice(0, 240) : "Provider selected an intent and tool from the allowed inventory.",
  };
}

export function buildConnectedRun(
  message: string,
  decision: ModelDecision,
  response: string,
  provider: string,
  model: string,
  backendLatencyMs: number,
): SyntheticAgentRun {
  const tool = executeSyntheticTool(decision.selectedIntent, decision.selectedTool);
  const skippedTool = decision.selectedTool === null;
  const steps: AgentStep[] = [
    { order: 1, name: "Received user message", summary: `Accepted ${message.length} characters of synthetic support input.`, status: "completed" },
    { order: 2, name: "Understood the request", summary: decision.decisionSummary, status: "completed" },
    { order: 3, name: "Checked candidate intents", summary: `The connected model compared ${decision.candidates.length} supported intents.`, status: "completed" },
    { order: 4, name: "Selected intent", summary: `${decision.selectedIntent} at ${Math.round((decision.candidates.find((item) => item.intent === decision.selectedIntent)?.score ?? 0) * 100)}% confidence.`, status: "completed" },
    { order: 5, name: "Selected tool", summary: decision.selectedTool ?? "No tool selected.", status: skippedTool ? "skipped" : "completed" },
    { order: 6, name: "Accessed tool", summary: skippedTool ? "No synthetic tool was called." : `Called ${decision.selectedTool} against synthetic records.`, status: skippedTool ? "skipped" : "completed" },
    { order: 7, name: "Received tool result", summary: tool.result, status: "completed" },
    { order: 8, name: "Summarized the result", summary: `${provider}/${model} composed the reply from the synthetic tool result.`, status: "completed" },
    { order: 9, name: "Sent reply", summary: "Returned the final response and stored the versioned trace.", status: "completed" },
  ];

  return {
    promptVersion: AGENT_PROMPT_VERSION,
    systemPrompt: AGENT_SYSTEM_PROMPT,
    message,
    candidates: decision.candidates,
    selectedIntent: decision.selectedIntent,
    selectedTool: decision.selectedTool,
    toolInput: tool.input,
    toolResult: tool.result,
    response,
    steps,
    backendLatencyMs,
    executionMode: "connected",
    provider,
    model,
    datasetVersion: GOLDEN_DATASET_VERSION,
  };
}

export function toolResultForDecision(decision: ModelDecision) {
  return executeSyntheticTool(decision.selectedIntent, decision.selectedTool);
}
