import { describe, it, expect } from "vitest";
import { currentPeriod } from "../src/lib/quota";

describe("currentPeriod", () => {
  it("returns the first and last day of the month in UTC", () => {
    const { start, end } = currentPeriod(new Date("2026-04-22T10:00:00Z"));
    expect(start.toISOString()).toBe("2026-04-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-05-01T00:00:00.000Z");
  });
  it("wraps year correctly in December", () => {
    const { start, end } = currentPeriod(new Date("2026-12-15T00:00:00Z"));
    expect(start.toISOString()).toBe("2026-12-01T00:00:00.000Z");
    expect(end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
