import { describe, expect, it } from "vitest";
import { configuredModels, selectConfiguredModel } from "./providerConfig";

describe("provider configuration", () => {
  it("builds a unique allowlist from the default model and optional list", () => {
    expect(configuredModels("openai/gpt-4.1-mini", "anthropic/claude-3.5-haiku, openai/gpt-4.1-mini"))
      .toEqual(["openai/gpt-4.1-mini", "anthropic/claude-3.5-haiku"]);
  });

  it("rejects a model that the deployment owner did not enable", () => {
    expect(() => selectConfiguredModel(["openai/gpt-4.1-mini"], "openai/gpt-4.1"))
      .toThrow("not enabled");
  });
});
