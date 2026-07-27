import { MAX_IDENTIFIER_LENGTH, validateIdentifier } from "../validateId";

describe("validateIdentifier", () => {
  it("accepts common agent and service identifiers", () => {
    expect(validateIdentifier("agent-01", "Agent")).toEqual({
      ok: true,
      value: "agent-01",
    });
    expect(validateIdentifier("svc.alpha_beta:prod", "Service ID")).toEqual({
      ok: true,
      value: "svc.alpha_beta:prod",
    });
  });

  it("trims surrounding whitespace before returning a valid identifier", () => {
    expect(validateIdentifier("  agent-01  ", "Agent")).toEqual({
      ok: true,
      value: "agent-01",
    });
  });

  it("rejects empty and whitespace-only identifiers", () => {
    expect(validateIdentifier("", "Agent")).toEqual({
      ok: false,
      message: "Agent is required.",
    });
    expect(validateIdentifier("   ", "Service ID")).toEqual({
      ok: false,
      message: "Service ID is required.",
    });
  });

  it("accepts identifiers at the maximum length", () => {
    const value = "a".repeat(MAX_IDENTIFIER_LENGTH);
    expect(validateIdentifier(value, "Agent")).toEqual({ ok: true, value });
  });

  it("rejects identifiers above the maximum length", () => {
    expect(
      validateIdentifier("a".repeat(MAX_IDENTIFIER_LENGTH + 1), "Agent"),
    ).toEqual({
      ok: false,
      message: `Agent must be ${MAX_IDENTIFIER_LENGTH} characters or fewer.`,
    });
  });

  it("rejects spaces, slashes, query strings, and fragments", () => {
    const invalid = ["agent one", "agent/one", "agent?x=1", "agent#frag"];

    for (const value of invalid) {
      expect(validateIdentifier(value, "Agent")).toEqual({
        ok: false,
        message:
          "Agent can only use letters, numbers, dots, underscores, hyphens, and colons.",
      });
    }
  });
});
