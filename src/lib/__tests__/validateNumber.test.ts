import {
  parseNonNegativeInt,
  parsePositiveInt,
  MAX_SAFE_INTEGER_VAL,
  type ParseResult,
} from "../validateNumber";

// Type-level assertion: ParseResult is the correct discriminated union shape.
const _typeCheck: ParseResult = { ok: true, value: 0 };
void _typeCheck;

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

    it("accepts string representation of integers with trailing zero decimals", () => {
      expect(parseNonNegativeInt("0.0")).toEqual({ ok: true, value: 0 });
      expect(parseNonNegativeInt("5.000")).toEqual({ ok: true, value: 5 });
    });

    it("accepts large safe integers", () => {
      expect(parseNonNegativeInt("9007199254740991")).toEqual({
        ok: true,
        value: 9007199254740991,
      });
    });

    it("rejects empty strings and whitespace-only inputs", () => {
      const expectedError = {
        ok: false,
        message: NON_NEG_MSG,
      };
      expect(parseNonNegativeInt("")).toEqual(expectedError);
      expect(parseNonNegativeInt("   ")).toEqual(expectedError);
      expect(parseNonNegativeInt("\t\n")).toEqual(expectedError);
    });

    it("rejects negative integers and -0", () => {
      const expectedError = {
        ok: false,
        message: NON_NEG_MSG,
      };
      expect(parseNonNegativeInt("-1")).toEqual(expectedError);
      expect(parseNonNegativeInt("-0")).toEqual(expectedError);
      expect(parseNonNegativeInt("-42")).toEqual(expectedError);
    });

    it("rejects floats and non-integer decimals", () => {
      const expectedError = {
        ok: false,
        message: NON_NEG_MSG,
      };
      expect(parseNonNegativeInt("1.5")).toEqual(expectedError);
      expect(parseNonNegativeInt("-0.1")).toEqual(expectedError);
      expect(parseNonNegativeInt("0.0001")).toEqual(expectedError);
    });

    it("rejects non-numeric strings, NaN, and Infinities", () => {
      const expectedError = {
        ok: false,
        message: NON_NEG_MSG,
      };
      expect(parseNonNegativeInt("abc")).toEqual(expectedError);
      expect(parseNonNegativeInt("123abc")).toEqual(expectedError);
      expect(parseNonNegativeInt("NaN")).toEqual(expectedError);
      expect(parseNonNegativeInt("Infinity")).toEqual(expectedError);
      expect(parseNonNegativeInt("-Infinity")).toEqual(expectedError);
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

    it("documents coercion behaviour: hex, binary, and octal literals are accepted by Number()", () => {
      expect(parseNonNegativeInt("0xff")).toEqual({ ok: true, value: 255 });
      expect(parseNonNegativeInt("0b101")).toEqual({ ok: true, value: 5 });
    });

    it("accepts strings with a leading plus sign via Number() coercion", () => {
      expect(parseNonNegativeInt("+1")).toEqual({ ok: true, value: 1 });
      expect(parseNonNegativeInt("+0")).toEqual({ ok: true, value: 0 });
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

    it("accepts string representation of positive integers with trailing zero decimals", () => {
      expect(parsePositiveInt("10.0")).toEqual({ ok: true, value: 10 });
    });

    it("accepts large positive safe integers", () => {
      expect(parsePositiveInt("9007199254740991")).toEqual({
        ok: true,
        value: 9007199254740991,
      });
    });

    it("rejects empty, whitespace-only, 0, negative integers, and floats", () => {
      const expectedError = {
        ok: false,
        message: POS_MSG,
      };
      expect(parsePositiveInt("")).toEqual(expectedError);
      expect(parsePositiveInt("   ")).toEqual(expectedError);
      expect(parsePositiveInt("\n\t")).toEqual(expectedError);
      expect(parsePositiveInt("0")).toEqual(expectedError);
      expect(parsePositiveInt("-0")).toEqual(expectedError);
      expect(parsePositiveInt("-1")).toEqual(expectedError);
      expect(parsePositiveInt("1.5")).toEqual(expectedError);
      expect(parsePositiveInt("-0.1")).toEqual(expectedError);
    });

    it("rejects non-numeric strings, NaN, and Infinities", () => {
      const expectedError = {
        ok: false,
        message: POS_MSG,
      };
      expect(parsePositiveInt("abc")).toEqual(expectedError);
      expect(parsePositiveInt("42abc")).toEqual(expectedError);
      expect(parsePositiveInt("NaN")).toEqual(expectedError);
      expect(parsePositiveInt("Infinity")).toEqual(expectedError);
      expect(parsePositiveInt("-Infinity")).toEqual(expectedError);
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

    it("documents coercion behaviour: hex and binary literals are accepted when they evaluate to a positive integer", () => {
      expect(parsePositiveInt("0xff")).toEqual({ ok: true, value: 255 });
      expect(parsePositiveInt("0b101")).toEqual({ ok: true, value: 5 });
    });

    it("accepts strings with a leading plus sign via Number() coercion", () => {
      expect(parsePositiveInt("+1")).toEqual({ ok: true, value: 1 });
    });

    it("rejects leading-zero strings that evaluate to zero", () => {
      expect(parsePositiveInt("00000")).toEqual({
        ok: false,
        message: POS_MSG,
      });
    });
  });
});
