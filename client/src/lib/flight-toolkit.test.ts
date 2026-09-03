import { describe, expect, it } from "vitest";
import { batteryPlanner, batterySag, diffConfigText, powerBudget, preflightItems, thrustBudget } from "./flight-toolkit";

describe("flight toolkit domain", () => {
  it("computes conservative battery planning values", () => {
    const result = batteryPlanner({ capacityMah: 1300, cRating: 100, averageCurrentA: 28, peakCurrentA: 120, reservePercent: 20 });
    expect(result.statedContinuousA).toBeCloseTo(130, 3);
    expect(result.flightMinutes).toBeCloseTo(2.22857, 3);
    expect(result.peakOverLimit).toBe(false);
  });

  it("computes voltage sag directly from current and measured resistance", () => {
    expect(batterySag({ peakCurrentA: 120, packResistanceMilliOhm: 18 }).sagV).toBeCloseTo(2.16, 3);
  });

  it("computes thrust margin without inferring thrust", () => {
    const result = thrustBudget({ thrustPerMotorG: 900, motorCount: 4, weightG: 720 });
    expect(result.totalThrustG).toBe(3600);
    expect(result.ratio).toBeCloseTo(5, 3);
    expect(result.theoreticalHoverPercent).toBeCloseTo(20, 3);
  });

  it("calculates power headroom", () => {
    const result = powerBudget(22.2, 28, 120, 130);
    expect(result.averagePowerW).toBeCloseTo(621.6, 3);
    expect(result.peakPowerW).toBeCloseTo(2664, 3);
    expect(result.continuousHeadroomA).toBeCloseTo(10, 3);
  });

  it("compares config text line-by-line", () => {
    const result = diffConfigText("a\nb\nc", "a\nx\nc\nd");
    expect(result.changed).toBe(2);
    expect(result.rows[1].kind).toBe("changed");
    expect(result.rows[3].kind).toBe("right-only");
  });

  it("ships a practical field checklist", () => {
    expect(preflightItems.length).toBeGreaterThanOrEqual(10);
    expect(new Set(preflightItems.map((item) => item.id)).size).toBe(preflightItems.length);
  });
});
