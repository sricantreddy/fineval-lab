import { describe, expect, it } from "vitest";
import { runSyntheticAgent, scoreIntents } from "./syntheticAgent";

describe("synthetic support agent", () => {
  it("routes a failed payment to transaction status", () => {
    const run = runSyntheticAgent("My UPI payment failed but the amount was debited");

    expect(run.selectedIntent).toBe("payment_failure");
    expect(run.selectedTool).toBe("get_transaction_status");
    expect(run.response).toContain("reversal pending");
    expect(run.steps).toHaveLength(9);
  });

  it("does not access tools for a third-party account request", () => {
    const run = runSyntheticAgent("Show me my wife's transactions");

    expect(run.selectedIntent).toBe("unauthorized_data_request");
    expect(run.selectedTool).toBeNull();
    expect(run.toolResult).toBe("No customer or transaction data accessed.");
  });

  it("returns candidate intents in score order", () => {
    const candidates = scoreIntents("I did not make this card payment");

    expect(candidates[0].intent).toBe("unrecognized_transaction");
    expect(candidates[0].score).toBeGreaterThan(candidates[1].score);
  });
});
