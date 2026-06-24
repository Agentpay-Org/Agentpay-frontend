import { IDENTIFIER_MAX_LENGTH, validateIdentifier } from "../validateId";

describe("validateIdentifier", () => {
  it("rejects empty input", () => {
    expect(validateIdentifier("", "Agent")).toEqual({
      ok: false,
      message: "Agent is required.",
    });
  });

  it("rejects whitespace-only input", () => {
    expect(validateIdentifier("   \t", "Service ID")).toEqual({
      ok: false,
      message: "Service ID is required.",
    });
  });

  it("rejects identifiers over the max length", () => {
    const tooLong = "a".repeat(IDENTIFIER_MAX_LENGTH + 1);

    expect(validateIdentifier(tooLong, "Agent")).toEqual({
      ok: false,
      message: "Agent must be 128 characters or fewer.",
    });
  });

  it("rejects characters outside the allow-list", () => {
    expect(validateIdentifier("agent/with/slash", "Agent")).toEqual({
      ok: false,
      message:
        "Agent can only contain letters, numbers, dots, underscores, colons, and hyphens.",
    });
  });

  it("accepts and trims valid identifiers", () => {
    expect(validateIdentifier(" agent_1.prod:west-2 ", "Agent")).toEqual({
      ok: true,
      value: "agent_1.prod:west-2",
    });
  });
});
