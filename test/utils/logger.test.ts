import { formatParams } from "../../src/utils/logger";

describe("formatParams", () => {
  it("returns empty brackets for no params", () => {
    expect(formatParams(undefined)).toBe("[]");
    expect(formatParams([])).toBe("[]");
  });

  it("formats primitive values", () => {
    expect(formatParams([1, "two", true, null])).toBe("[1, 'two', true, null]");
  });

  it("truncates long string values", () => {
    const long = "a".repeat(200);
    expect(formatParams([long])).toBe(`['${"a".repeat(60)}…']`);
  });

  it("caps the number of params shown", () => {
    const params = Array.from({ length: 15 }, (_, i) => i);
    expect(formatParams(params)).toBe(
      "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, … (5 more)]",
    );
  });
});
