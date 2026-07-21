import { parseNonNegativeInt, parsePositiveInt } from "../validateNumber";

describe("validateNumber", () => {
  describe("parseNonNegativeInt", () => {
    it("accepts 0 and positive integers", () => {
      expect(parseNonNegativeInt("0")).toEqual({ ok: true, value: 0 });
      expect(parseNonNegativeInt("1")).toEqual({ ok: true, value: 1 });
      expect(parseNonNegativeInt("42")).toEqual({ ok: true, value: 42 });
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
        message: "Price must be a non-negative integer.",
      };
      expect(parseNonNegativeInt("")).toEqual(expectedError);
      expect(parseNonNegativeInt("   ")).toEqual(expectedError);
      expect(parseNonNegativeInt("\t\n")).toEqual(expectedError);
    });

    it("rejects negative integers and -0", () => {
      const expectedError = {
        ok: false,
        message: "Price must be a non-negative integer.",
      };
      expect(parseNonNegativeInt("-1")).toEqual(expectedError);
      expect(parseNonNegativeInt("-0")).toEqual(expectedError);
      expect(parseNonNegativeInt("-42")).toEqual(expectedError);
    });

    it("rejects floats and non-integer decimals", () => {
      const expectedError = {
        ok: false,
        message: "Price must be a non-negative integer.",
      };
      expect(parseNonNegativeInt("1.5")).toEqual(expectedError);
      expect(parseNonNegativeInt("-0.1")).toEqual(expectedError);
      expect(parseNonNegativeInt("0.0001")).toEqual(expectedError);
    });

    it("rejects non-numeric strings, NaN, and Infinities", () => {
      const expectedError = {
        ok: false,
        message: "Price must be a non-negative integer.",
      };
      expect(parseNonNegativeInt("abc")).toEqual(expectedError);
      expect(parseNonNegativeInt("123abc")).toEqual(expectedError);
      expect(parseNonNegativeInt("NaN")).toEqual(expectedError);
      expect(parseNonNegativeInt("Infinity")).toEqual(expectedError);
      expect(parseNonNegativeInt("-Infinity")).toEqual(expectedError);
    });

    it("accepts scientific notation only when it evaluates to a non-negative integer", () => {
      expect(parseNonNegativeInt("1e2")).toEqual({ ok: true, value: 100 });
      expect(parseNonNegativeInt("1e0")).toEqual({ ok: true, value: 1 });
    });

    it("rejects scientific notation that does not evaluate to an integer or is negative", () => {
      const expectedError = {
        ok: false,
        message: "Price must be a non-negative integer.",
      };
      expect(parseNonNegativeInt("1e-2")).toEqual(expectedError);
      expect(parseNonNegativeInt("-1e2")).toEqual(expectedError);
    });
  });

  describe("parsePositiveInt", () => {
    it("accepts positive integers >= 1", () => {
      expect(parsePositiveInt("1")).toEqual({ ok: true, value: 1 });
      expect(parsePositiveInt("42")).toEqual({ ok: true, value: 42 });
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
        message: "requests must be a positive integer",
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
        message: "requests must be a positive integer",
      };
      expect(parsePositiveInt("abc")).toEqual(expectedError);
      expect(parsePositiveInt("42abc")).toEqual(expectedError);
      expect(parsePositiveInt("NaN")).toEqual(expectedError);
      expect(parsePositiveInt("Infinity")).toEqual(expectedError);
      expect(parsePositiveInt("-Infinity")).toEqual(expectedError);
    });

    it("rejects scientific notation that is not an integer", () => {
      expect(parsePositiveInt("1e-1")).toEqual({
        ok: false,
        message: "requests must be a positive integer",
      });
    });

    it("accepts scientific notation only when it becomes a positive integer", () => {
      expect(parsePositiveInt("1e1")).toEqual({ ok: true, value: 10 });
    });
  });
});
