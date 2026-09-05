import { describe, expect, it } from "vitest";
import { assessProfileEvidence } from "./evidence-links";
import { seedEvidence } from "./evidence-data";
import { defaultProfile } from "./drone";

describe("assessProfileEvidence", () => {
  it("reports unknown when no evidence is linked", () => {
    const checks = assessProfileEvidence(defaultProfile, seedEvidence);
    expect(checks.find((check) => check.id === "motor-evidence")?.status).toBe("UNKNOWN");
    expect(checks.find((check) => check.id === "prop-evidence")?.status).toBe("UNKNOWN");
  });

  it("matches an explicitly linked prop evidence record", () => {
    const profile = { ...defaultProfile, propEvidenceId: "prop-gemfan-hurricane-51466-v2" };
    expect(assessProfileEvidence(profile, seedEvidence).find((check) => check.id === "prop-evidence")?.status).toBe("MATCHED");
  });

  it("marks a linked motor evidence record as critical when the profile battery is outside the documented source range", () => {
    const profile = { ...defaultProfile, batteryCells: 4, motor: "F60 PRO V", motorKv: 1950, motorEvidenceId: "motor-tmotor-f60prov-2207-5-kv1950" };
    const batteryCheck = assessProfileEvidence(profile, seedEvidence).find((check) => check.id === "motor-battery");
    expect(batteryCheck?.level).toBe("critical");
    expect(batteryCheck?.status).toBe("OUTSIDE SOURCE RANGE");
  });
});
