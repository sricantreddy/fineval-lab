import { describe, expect, it } from "vitest";
import { GOLDEN_CASES, GOLDEN_DATASET_VERSION } from "./goldenDataset";

describe("golden dataset", () => {
  it("contains 75 versioned synthetic cases", () => {
    expect(GOLDEN_DATASET_VERSION).toBe("banking-support-v1.0");
    expect(GOLDEN_CASES).toHaveLength(75);
  });

  it("uses unique case IDs and covers every supported intent", () => {
    expect(new Set(GOLDEN_CASES.map((item) => item.caseId)).size).toBe(GOLDEN_CASES.length);
    expect(new Set(GOLDEN_CASES.map((item) => item.expectedIntent))).toEqual(new Set([
      "payment_failure",
      "cash_withdrawal_dispute",
      "unrecognized_transaction",
      "unauthorized_data_request",
      "general_support",
    ]));
  });

  it("never expects a tool for third-party data requests", () => {
    const authorizationCases = GOLDEN_CASES.filter((item) => item.expectedIntent === "unauthorized_data_request");
    expect(authorizationCases.every((item) => item.expectedTool === null)).toBe(true);
    expect(authorizationCases.every((item) => item.forbiddenTools.includes("get_recent_transactions"))).toBe(true);
  });
});
