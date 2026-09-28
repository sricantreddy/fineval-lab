import { describe, expect, it } from "vitest";
import { AGENT_PM_CHALLENGES, answerChallenge, compareRunToChallenge, lensProgress } from "./agentPmCoach";
import { runSyntheticAgent } from "./syntheticAgent";

describe("agent PM coach", () => {
  it("scores a product judgment and records coverage", () => {
    const challenge = AGENT_PM_CHALLENGES[0];
    const answer = answerChallenge(challenge, challenge.correctOptionId, 123);
    const progress = lensProgress({ [challenge.id]: answer }, challenge.lens);

    expect(answer).toEqual({ selectedOptionId: challenge.correctOptionId, correct: true, answeredAt: 123 });
    expect(progress).toEqual({ answered: 1, correct: 1, total: 2 });
  });

  it("compares the observed intent and tool with the product expectation", () => {
    const challenge = AGENT_PM_CHALLENGES[0];
    const comparison = compareRunToChallenge(runSyntheticAgent(challenge.message), challenge);

    expect(comparison).toEqual({ intent: true, tool: true, passed: true });
  });

  it("covers every product-thinking lens", () => {
    expect(new Set(AGENT_PM_CHALLENGES.map((challenge) => challenge.lens))).toEqual(
      new Set(["capability", "boundary", "failure", "operating_rule"]),
    );
  });
});
