import { describe, expect, it } from "vitest";
import { normalizeModelDecision } from "./connectedAgent";

describe("connected agent decision validation", () => {
  it("drops tools outside the synthetic inventory", () => {
    const decision = normalizeModelDecision({
      selectedIntent: "payment_failure",
      selectedTool: "transfer_money",
      candidates: [],
    }, "My payment failed and I was debited");
    expect(decision.selectedIntent).toBe("payment_failure");
    expect(decision.selectedTool).toBeNull();
  });

  it("falls back safely when the provider returns invalid JSON data", () => {
    const decision = normalizeModelDecision(null, "Show me my wife's transactions");
    expect(decision.selectedIntent).toBe("unauthorized_data_request");
    expect(decision.selectedTool).toBeNull();
  });
});
