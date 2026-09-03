import { describe, expect, it } from "vitest";
import { batteryPlanner, batterySag, diffConfigText, missionReadiness, powerBudget, preflightItems, thrustBudget } from "./flight-toolkit";

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

  it("combines measurable signals into a conservative readiness score", () => {
    const result = missionReadiness({ voltageNominal: 22.2, batteryContinuousA: 130, averageCurrentA: 28, peakCurrentA: 120, packResistanceMilliOhm: 12, thrustPerMotorG: 900, motorCount: 4, weightG: 720, checksComplete: 5, checksTotal: 5 });
    expect(result.score).toBe(100);
    expect(result.verdict).toBe("READY FOR FIELD CHECK");
  });

  it("holds when measured thrust evidence is missing", () => {
    const result = missionReadiness({ voltageNominal: 22.2, batteryContinuousA: 130, averageCurrentA: 28, peakCurrentA: 120, packResistanceMilliOhm: 12, thrustPerMotorG: 0, motorCount: 4, weightG: 720, checksComplete: 10, checksTotal: 10 });
    expect(result.factors.thrust).toBe(0);
    expect(result.verdict).toBe("HOLD — INPUTS INCOMPLETE");
  });

  it("holds when the field checklist is incomplete", () => {
    const result = missionReadiness({ voltageNominal: 22.2, batteryContinuousA: 130, averageCurrentA: 28, peakCurrentA: 120, packResistanceMilliOhm: 12, thrustPerMotorG: 900, motorCount: 4, weightG: 720, checksComplete: 9, checksTotal: 10 });
    expect(result.verdict).toBe("HOLD — INPUTS INCOMPLETE");
  });

  it("does not award power headroom when peak current reaches the limit", () => {
    const result = missionReadiness({ voltageNominal: 22.2, batteryContinuousA: 130, averageCurrentA: 28, peakCurrentA: 130, packResistanceMilliOhm: 12, thrustPerMotorG: 900, motorCount: 4, weightG: 720, checksComplete: 10, checksTotal: 10 });
    expect(result.factors.power).toBe(0);
    expect(result.verdict).toBe("REVIEW BEFORE ARM");
  });

  it("returns an explainable reason for every readiness signal", () => {
    const result = missionReadiness({ voltageNominal: 22.2, batteryContinuousA: 130, averageCurrentA: 28, peakCurrentA: 120, packResistanceMilliOhm: 18, thrustPerMotorG: 0, motorCount: 4, weightG: 720, checksComplete: 0, checksTotal: 10 });
    expect(result.reasons).toHaveLength(4);
    expect(result.reasons.find((reason) => reason.id === "thrust")?.status).toBe("LOCKED");
    expect(result.reasons.every((reason) => reason.detail.length > 0 && reason.action.length > 0)).toBe(true);
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
