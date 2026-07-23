import { parseNonNegativeInt, parsePositiveInt, MAX_SAFE_INTEGER_VAL } from "../validateNumber";

const NON_NEG_MSG =
  "Price must be a non-negative integer between 0 and 9,007,199,254,740,991.";
const POS_MSG =
  "requests must be a positive integer between 1 and 9,007,199,254,740,991";

describe("validateNumber", () => {
  describe("parseNonNegativeInt", () => {
    it("accepts 0 and positive integers", () => {
      expect(parseNonNegativeInt("0")).toEqual({ ok: true, value: 0 });
      expect(parseNonNegativeInt("1")).toEqual({ ok: true, value: 1 });
      expect(parseNonNegativeInt("42")).toEqual({ ok: true, value: 42 });
    });

    it("accepts MAX_SAFE_INTEGER_VAL but rejects values above it", () => {
      const max = MAX_SAFE_INTEGER_VAL;
      expect(parseNonNegativeInt(String(max))).toEqual({
        ok: true,
        value: max,
      });

      const above = BigInt(max) + 1n;
      expect(parseNonNegativeInt(String(above))).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
    });

    it("accepts leading zeros", () => {
      expect(parseNonNegativeInt("001")).toEqual({ ok: true, value: 1 });
      expect(parseNonNegativeInt("000")).toEqual({ ok: true, value: 0 });
    });

    it("rejects empty", () => {
      expect(parseNonNegativeInt("")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
    });

    it("rejects negative integers and -0", () => {
      expect(parseNonNegativeInt("-1")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
      expect(parseNonNegativeInt("-0")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
    });

    it("rejects floats", () => {
      expect(parseNonNegativeInt("1.5")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
      expect(parseNonNegativeInt("-0.1")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
    });

    it("rejects exponent notation (e.g. 1e2, 1E2)", () => {
      expect(parseNonNegativeInt("1e2")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
      expect(parseNonNegativeInt("1E2")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
      expect(parseNonNegativeInt("1e-2")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
      expect(parseNonNegativeInt("1e0")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
    });

    it("rejects whitespace-padded input", () => {
      expect(parseNonNegativeInt(" 100 ")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
      expect(parseNonNegativeInt("100 ")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
      expect(parseNonNegativeInt(" 100")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
      expect(parseNonNegativeInt("\t42")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
      expect(parseNonNegativeInt("\n42")).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
    });

    it("rejects strings that look like large unsafe integers", () => {
      const unsafe1 = String(BigInt(MAX_SAFE_INTEGER_VAL) + 100n);
      expect(parseNonNegativeInt(unsafe1)).toEqual({
        ok: false,
        message: NON_NEG_MSG,
      });
    });
  });

  describe("parsePositiveInt", () => {
    it("accepts positive integers >= 1", () => {
      expect(parsePositiveInt("1")).toEqual({ ok: true, value: 1 });
      expect(parsePositiveInt("42")).toEqual({ ok: true, value: 42 });
    });

    it("accepts MAX_SAFE_INTEGER_VAL but rejects values above it", () => {
      const max = MAX_SAFE_INTEGER_VAL;
      expect(parsePositiveInt(String(max))).toEqual({
        ok: true,
        value: max,
      });

      const above = BigInt(max) + 1n;
      expect(parsePositiveInt(String(above))).toEqual({
        ok: false,
        message: POS_MSG,
      });
    });

    it("accepts leading zeros for non-zero values", () => {
      expect(parsePositiveInt("001")).toEqual({ ok: true, value: 1 });
      expect(parsePositiveInt("00042")).toEqual({ ok: true, value: 42 });
    });

    it("rejects empty, 0, negative, and floats", () => {
      expect(parsePositiveInt("")).toEqual({
        ok: false,
        message: POS_MSG,
      });
      expect(parsePositiveInt("0")).toEqual({
        ok: false,
        message: POS_MSG,
      });
      expect(parsePositiveInt("-1")).toEqual({
        ok: false,
        message: POS_MSG,
      });
      expect(parsePositiveInt("1.5")).toEqual({
        ok: false,
        message: POS_MSG,
      });
      expect(parsePositiveInt("-0.1")).toEqual({
        ok: false,
        message: POS_MSG,
      });
    });

    it("rejects exponent notation", () => {
      expect(parsePositiveInt("1e1")).toEqual({
        ok: false,
        message: POS_MSG,
      });
      expect(parsePositiveInt("1E1")).toEqual({
        ok: false,
        message: POS_MSG,
      });
      expect(parsePositiveInt("1e-1")).toEqual({
        ok: false,
        message: POS_MSG,
      });
    });

    it("rejects whitespace-padded input", () => {
      expect(parsePositiveInt(" 1 ")).toEqual({
        ok: false,
        message: POS_MSG,
      });
      expect(parsePositiveInt("1 ")).toEqual({
        ok: false,
        message: POS_MSG,
      });
      expect(parsePositiveInt(" 1")).toEqual({
        ok: false,
        message: POS_MSG,
      });
    });

    it("rejects strings that look like large unsafe integers", () => {
      const unsafe1 = String(BigInt(MAX_SAFE_INTEGER_VAL) + 100n);
      expect(parsePositiveInt(unsafe1)).toEqual({
        ok: false,
        message: POS_MSG,
      });
    });
  });
});

