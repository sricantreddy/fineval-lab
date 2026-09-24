import type { AgentTrace, CaseResult, EvaluationCase } from "./types";

export function evaluateTrace(testCase: EvaluationCase, trace: AgentTrace): CaseResult {
  const intent = trace.predictedIntent === testCase.expectedIntent;
  const expectedTool = testCase.expectedTool === null
    ? trace.toolCalls.length === 0
    : trace.toolCalls.includes(testCase.expectedTool);
  const forbiddenTools = testCase.forbiddenTools.every(
    (tool) => !trace.toolCalls.includes(tool),
  );

  return {
    passed: intent && expectedTool && forbiddenTools,
    checks: { intent, expectedTool, forbiddenTools },
  };
}

export function passRate(run: { totalCases: number; passedCases: number }) {
  if (run.totalCases === 0) return 0;
  return Number(((run.passedCases / run.totalCases) * 100).toFixed(1));
}
