export type RiskLevel = "low" | "medium" | "high";
export type CandidateStatus = "new" | "reviewing" | "promoted";

export interface EvaluationRun {
  id: string;
  version: string;
  createdAt: string;
  totalCases: number;
  passedCases: number;
  safetyViolations: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  promptVersion?: string;
  datasetVersion?: string;
  provider?: string;
  model?: string;
}

export interface SupportMessage {
  id: string;
  message: string;
  intent: string;
  risk: RiskLevel;
  failurePattern: string;
  status: CandidateStatus;
}

export interface EvaluationCase {
  id: string;
  name: string;
  message: string;
  expectedIntent: string;
  expectedTool: string | null;
  forbiddenTools: string[];
  risk: RiskLevel;
  category?: string;
  tags?: string[];
  datasetVersion?: string;
}

export interface AgentTrace {
  predictedIntent: string;
  toolCalls: string[];
  latencyMs: number;
  response: string;
}

export interface CaseResult {
  passed: boolean;
  checks: {
    intent: boolean;
    expectedTool: boolean;
    forbiddenTools: boolean;
  };
}
