import { describe, expect, it } from "vitest";
import { calculateMetrics, defaultProfile, generateCliDraft, validateProfile } from "./drone";

describe("drone calculations", () => {
  it("calculates nominal pack voltage, continuous current and conservative flight time", () => {
    const metrics = calculateMetrics(defaultProfile);
    expect(metrics.voltageNominal).toBeCloseTo(22.2, 3);
    expect(metrics.batteryContinuousA).toBeCloseTo(130, 3);
    expect(metrics.estimatedFlightMinutes).toBeCloseTo(2.2285, 3);
  });

  it("flags peak current above stated battery capability", () => {
    const validation = validateProfile({ ...defaultProfile, expectedPeakCurrentA: 160 });
    expect(validation.some((item) => item.level === "critical")).toBe(true);
  });

  it("does not infer thrust when verified thrust data is absent", () => {
    const metrics = calculateMetrics(defaultProfile);
    expect(metrics.thrustToWeight).toBeNull();
  });

  it("removes line-break command injection from the generated name", () => {
    const cli = generateCliDraft({ ...defaultProfile, name: "Manta\nsave;" });
    expect(cli).toContain("name Manta save");
    expect(cli.match(/^save$/gm)).toHaveLength(1);
  });
});
