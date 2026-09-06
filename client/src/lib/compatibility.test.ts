import { describe, expect, it } from "vitest";
import { assessCompatibility } from "./compatibility";
import { defaultProfile } from "./drone";
import { seedEvidence } from "./evidence-data";

describe("assessCompatibility", () => {
  it("stays conservative when no evidence is linked", () => {
    const result = assessCompatibility(defaultProfile, seedEvidence);
    expect(result.overall).toBe("warning");
    expect(result.checks.find((check) => check.id === "motor-link")?.status).toBe("UNKNOWN");
    expect(result.checks.find((check) => check.id === "prop-link")?.status).toBe("UNKNOWN");
  });

  it("reports a documented match for linked 6S T-Motor 1750KV and matching frame", () => {
    const profile = {
      ...defaultProfile,
      motor: "2207",
      motorKv: 1750,
      batteryCells: 6,
      frame: "5-inch carbon freestyle",
      prop: "5.1 × 3.6 × 3",
      motorEvidenceId: "motor-tmotor-f60prov-2207-5-kv1750",
      propEvidenceId: "prop-gemfan-hurricane-51466-v2",
    };
    const result = assessCompatibility(profile, seedEvidence);
    expect(result.overall).toBe("pass");
    expect(result.summary).toBe("DOCUMENTED MATCH");
    expect(result.checks.filter((check) => check.level === "pass")).toHaveLength(5);
  });

  it("flags a 7S profile outside the motor source range", () => {
    const profile = {
      ...defaultProfile,
      motor: "2207",
      motorKv: 1950,
      batteryCells: 7,
      frame: "5-inch carbon freestyle",
      motorEvidenceId: "motor-tmotor-f60prov-2207-5-kv1950",
    };
    const result = assessCompatibility(profile, seedEvidence);
    const battery = result.checks.find((check) => check.id === "motor-battery");
    expect(battery?.level).toBe("critical");
    expect(battery?.status).toBe("OUTSIDE SOURCE RANGE");
  });

  it("does not treat an unlinked prop label as a verified compatibility claim", () => {
    const profile = { ...defaultProfile, motorEvidenceId: "motor-tmotor-f60prov-2207-5-kv1750" };
    const result = assessCompatibility(profile, seedEvidence);
    expect(result.checks.find((check) => check.id === "prop-link")?.status).toBe("UNKNOWN");
  });

  it("flags a frame outside the motor's explicit source claim", () => {
    const profile = {
      ...defaultProfile,
      motor: "2207",
      motorKv: 1750,
      batteryCells: 6,
      frame: "7-inch long range",
      motorEvidenceId: "motor-tmotor-f60prov-2207-5-kv1750",
    };
    const result = assessCompatibility(profile, seedEvidence);
    expect(result.checks.find((check) => check.id === "motor-frame")?.status).toBe("OUTSIDE SOURCE RANGE");
  });
});
