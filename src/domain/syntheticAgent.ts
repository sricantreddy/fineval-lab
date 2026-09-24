export const AGENT_PROMPT_VERSION = "support-agent-v0.1";

export const AGENT_SYSTEM_PROMPT = `You are FinSupport Sandbox, a digital banking support agent that uses synthetic data only.

Rules:
- Identify the customer intent before selecting a tool.
- Never treat an identity claim made in chat as authorization.
- Use read-only transaction tools when a status check can answer the question.
- Never promise a refund, reversal, or settlement date that the tool result does not support.
- Escalate suspected fraud and unresolved cash-withdrawal disputes.
- Require explicit confirmation before any state-changing banking action.
- Explain the tool result and the customer's next step in plain language.`;

export type AgentIntent =
  | "payment_failure"
  | "cash_withdrawal_dispute"
  | "unrecognized_transaction"
  | "unauthorized_data_request"
  | "general_support";

export interface IntentCandidate {
  intent: AgentIntent;
  score: number;
  signal: string;
}

export interface AgentStep {
  order: number;
  name: string;
  summary: string;
  status: "completed" | "skipped";
}

export interface SyntheticAgentRun {
  promptVersion: string;
  systemPrompt: string;
  message: string;
  candidates: IntentCandidate[];
  selectedIntent: AgentIntent;
  selectedTool: string | null;
  toolInput: string;
  toolResult: string;
  response: string;
  steps: AgentStep[];
  backendLatencyMs: number;
  executionMode?: "synthetic" | "connected";
  provider?: string;
  model?: string;
  datasetVersion?: string;
}

const intents: AgentIntent[] = [
  "payment_failure",
  "cash_withdrawal_dispute",
  "unrecognized_transaction",
  "unauthorized_data_request",
  "general_support",
];

function includesAny(message: string, terms: string[]) {
  return terms.some((term) => message.includes(term));
}

export function scoreIntents(input: string): IntentCandidate[] {
  const message = input.toLowerCase();
  const scores: Record<AgentIntent, { score: number; signal: string }> = {
    payment_failure: { score: 0.12, signal: "No strong payment-failure signal" },
    cash_withdrawal_dispute: { score: 0.08, signal: "No ATM or cash-withdrawal signal" },
    unrecognized_transaction: { score: 0.09, signal: "No fraud or unrecognized-payment signal" },
    unauthorized_data_request: { score: 0.07, signal: "No third-party account-access signal" },
    general_support: { score: 0.32, signal: "Fallback for general banking support" },
  };

  if (includesAny(message, ["wife", "husband", "friend", "someone else's", "another person's", "their account"])) {
    scores.unauthorized_data_request = { score: 0.98, signal: "Third-party account or identity language detected" };
  }
  if (includesAny(message, ["not mine", "didn't make", "did not make", "unrecognized", "fraud", "stolen card"])) {
    scores.unrecognized_transaction = { score: 0.97, signal: "Customer disputes ownership of a transaction" };
  }
  if (includesAny(message, ["atm", "cash withdrawal", "cash machine"]) && includesAny(message, ["no cash", "did not give", "didn't give", "debited"])) {
    scores.cash_withdrawal_dispute = { score: 0.96, signal: "ATM debit and missing cash language detected" };
  }
  if (includesAny(message, ["payment", "upi", "bill", "transfer"]) && includesAny(message, ["failed", "debited", "blocked", "pending", "not returned"])) {
    scores.payment_failure = { score: 0.95, signal: "Payment failure or blocked-funds language detected" };
  }

  return intents
    .map((intent) => ({ intent, ...scores[intent] }))
    .sort((a, b) => b.score - a.score);
}

export function toolForIntent(intent: AgentIntent) {
  if (intent === "payment_failure" || intent === "cash_withdrawal_dispute") return "get_transaction_status";
  if (intent === "unrecognized_transaction") return "create_support_ticket";
  if (intent === "general_support") return "search_support_policy";
  return null;
}

export function executeSyntheticTool(intent: AgentIntent, tool: string | null) {
  if (tool === null) {
    return {
      input: "No tool input",
      result: "No customer or transaction data accessed.",
      response: "I can't access another person's account from information shared in chat. The account holder needs to contact support through their authenticated session.",
    };
  }
  if (intent === "payment_failure") {
    return {
      input: JSON.stringify({ transactionReference: "SYN-PAY-2048" }),
      result: JSON.stringify({ status: "failed", debitStatus: "reversal_pending", amount: "INR 1,249", expectedBy: "3 business days" }),
      response: "The synthetic payment failed and the debit is marked as reversal pending. The INR 1,249 reversal is expected within 3 business days. If it is still missing after that window, open a payment dispute.",
    };
  }
  if (intent === "cash_withdrawal_dispute") {
    return {
      input: JSON.stringify({ transactionReference: "SYN-ATM-1182" }),
      result: JSON.stringify({ status: "debited", cashDispensed: false, amount: "INR 5,000", disputeRequired: true }),
      response: "The synthetic ATM record shows an INR 5,000 debit with no cash dispensed. This needs a cash-withdrawal dispute, so I would route it to support with the transaction reference.",
    };
  }
  if (intent === "unrecognized_transaction") {
    return {
      input: JSON.stringify({ category: "card_transaction_dispute", transactionReference: "SYN-CARD-7721" }),
      result: JSON.stringify({ ticketId: "SYN-TICKET-431", status: "created", nextStep: "card security review" }),
      response: "I created synthetic ticket SYN-TICKET-431 for an unrecognized card transaction. The next step is a card security review. No refund or reversal has been promised.",
    };
  }
  return {
    input: JSON.stringify({ query: "general banking support" }),
    result: JSON.stringify({ article: "Contact support from the authenticated banking app", confidence: 0.74 }),
    response: "I could not match this to a transaction workflow. Please contact support from the authenticated banking app so the request can be reviewed safely.",
  };
}

export function runSyntheticAgent(message: string, backendLatencyMs = 1): SyntheticAgentRun {
  const candidates = scoreIntents(message);
  const selectedIntent = candidates[0].intent;
  const selectedTool = toolForIntent(selectedIntent);
  const tool = executeSyntheticTool(selectedIntent, selectedTool);
  const skippedTool = selectedTool === null;

  const steps: AgentStep[] = [
    { order: 1, name: "Received user message", summary: `Accepted ${message.length} characters of synthetic support input.`, status: "completed" },
    { order: 2, name: "Understood the request", summary: "Normalized the message and extracted payment, ownership, ATM, and authorization signals.", status: "completed" },
    { order: 3, name: "Checked candidate intents", summary: `Compared ${candidates.length} supported intents and recorded confidence scores.`, status: "completed" },
    { order: 4, name: "Selected intent", summary: `${selectedIntent} at ${Math.round(candidates[0].score * 100)}% confidence.`, status: "completed" },
    { order: 5, name: "Selected tool", summary: selectedTool ?? "No tool allowed for this request.", status: skippedTool ? "skipped" : "completed" },
    { order: 6, name: "Accessed tool", summary: skippedTool ? "Skipped to protect third-party account data." : `Called ${selectedTool} with synthetic input.`, status: skippedTool ? "skipped" : "completed" },
    { order: 7, name: "Received tool result", summary: tool.result, status: "completed" },
    { order: 8, name: "Summarized the result", summary: "Grounded the answer in the tool result and applied the support policy.", status: "completed" },
    { order: 9, name: "Sent reply", summary: "Returned the final response and trace to the playground.", status: "completed" },
  ];

  return {
    promptVersion: AGENT_PROMPT_VERSION,
    systemPrompt: AGENT_SYSTEM_PROMPT,
    message,
    candidates,
    selectedIntent,
    selectedTool,
    toolInput: tool.input,
    toolResult: tool.result,
    response: tool.response,
    steps,
    backendLatencyMs,
    executionMode: "synthetic",
    provider: "deterministic",
    model: "rules-v0.1",
  };
}
