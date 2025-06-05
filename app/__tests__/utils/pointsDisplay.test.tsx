import { describe, it, expect } from "vitest";
import { formatPointsDisplay } from "../../utils/pointsDisplay";

describe("formatPointsDisplay", () => {
  describe("normal point formatting", () => {
    it("should format points with 1 decimal place by default", () => {
      expect(formatPointsDisplay(5.123)).toBe("5.1");
      expect(formatPointsDisplay(10.67)).toBe("10.7");
      expect(formatPointsDisplay(0.45)).toBe("0.5");
    });

    it("should format points with custom decimal places", () => {
      expect(formatPointsDisplay(5.123, false, 2)).toBe("5.12");
      expect(formatPointsDisplay(10.67, false, 0)).toBe("11");
      expect(formatPointsDisplay(0.45, false, 3)).toBe("0.450");
    });

    it("should handle whole numbers", () => {
      expect(formatPointsDisplay(5)).toBe("5.0");
      expect(formatPointsDisplay(10)).toBe("10.0");
      expect(formatPointsDisplay(0)).toBe("0.0");
    });
  });

  describe("deduplication formatting", () => {
    it("should return '0' for deduplicated stamps with 0 points", () => {
      expect(formatPointsDisplay(0, true)).toBe("0");
      expect(formatPointsDisplay(0.0, true)).toBe("0");
    });

    it("should return normal formatting for deduplicated stamps with non-zero points", () => {
      expect(formatPointsDisplay(5.123, true)).toBe("5.1");
      expect(formatPointsDisplay(10.67, true)).toBe("10.7");
    });

    it("should return normal formatting for non-deduplicated stamps with 0 points", () => {
      expect(formatPointsDisplay(0, false)).toBe("0.0");
      expect(formatPointsDisplay(0.0, false)).toBe("0.0");
    });

    it("should handle custom decimal places with deduplication", () => {
      expect(formatPointsDisplay(0, true, 2)).toBe("0");
      expect(formatPointsDisplay(5.123, true, 2)).toBe("5.12");
      expect(formatPointsDisplay(0, false, 2)).toBe("0.00");
    });
  });

  describe("edge cases", () => {
    it("should handle negative numbers", () => {
      expect(formatPointsDisplay(-5.123)).toBe("-5.1");
      expect(formatPointsDisplay(-0.456, true)).toBe("-0.5");
    });

    it("should handle very small numbers", () => {
      expect(formatPointsDisplay(0.001)).toBe("0.0");
      expect(formatPointsDisplay(0.001, true)).toBe("0");
    });

    it("should handle very large numbers", () => {
      expect(formatPointsDisplay(999999.999)).toBe("1000000.0");
      expect(formatPointsDisplay(999999.999, true)).toBe("1000000.0");
    });
  });
});
