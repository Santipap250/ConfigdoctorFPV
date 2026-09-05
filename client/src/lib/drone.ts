/** Domain logic: deterministic FPV calculations only; no inferred motor, prop, or firmware compatibility claims. */
export type FlightStyle = "Freestyle" | "Cinematic" | "Long range" | "Racing";

export type DroneProfile = {
  name: string;
  frame: string;
  motor: string;
  motorKv: number;
  prop: string;
  batteryCells: number;
  capacityMah: number;
  batteryC: number;
  weightG: number;
  estimatedAverageCurrentA: number;
  expectedPeakCurrentA: number;
  measuredThrustPerMotorG: number;
  firmware: string;
  flightStyle: FlightStyle;
  motorEvidenceId?: string;
  propEvidenceId?: string;
};

export const defaultProfile: DroneProfile = {
  name: "MANTA 5 SE",
  frame: "5-inch carbon freestyle",
  motor: "2207",
  motorKv: 1750,
  prop: "5.1 × 3.6 × 3",
  batteryCells: 6,
  capacityMah: 1300,
  batteryC: 100,
  weightG: 720,
  estimatedAverageCurrentA: 28,
  expectedPeakCurrentA: 120,
  measuredThrustPerMotorG: 0,
  firmware: "Betaflight",
  flightStyle: "Freestyle",
};

export type ValidationLevel = "pass" | "warning" | "critical";
export type ValidationResult = { level: ValidationLevel; title: string; detail: string };

export function isFinitePositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

export function calculateMetrics(profile: DroneProfile) {
  const voltageNominal = profile.batteryCells * 3.7;
  const capacityAh = profile.capacityMah / 1000;
  const batteryContinuousA = capacityAh * profile.batteryC;
  const estimatedFlightMinutes =
    isFinitePositive(profile.estimatedAverageCurrentA) && isFinitePositive(capacityAh)
      ? (capacityAh * 0.8 * 60) / profile.estimatedAverageCurrentA
      : null;
  const estimatedPowerW =
    isFinitePositive(profile.expectedPeakCurrentA) && isFinitePositive(voltageNominal)
      ? voltageNominal * profile.expectedPeakCurrentA
      : null;
  const totalThrustG = isFinitePositive(profile.measuredThrustPerMotorG)
    ? profile.measuredThrustPerMotorG * 4
    : null;
  const thrustToWeight = totalThrustG && isFinitePositive(profile.weightG) ? totalThrustG / profile.weightG : null;

  return {
    voltageNominal,
    capacityAh,
    batteryContinuousA,
    estimatedFlightMinutes,
    estimatedPowerW,
    totalThrustG,
    thrustToWeight,
  };
}

export function validateProfile(profile: DroneProfile): ValidationResult[] {
  const metrics = calculateMetrics(profile);
  const results: ValidationResult[] = [];

  if (!profile.name.trim()) {
    results.push({ level: "critical", title: "Project name is required", detail: "Give this profile a name before exporting a configuration draft." });
  }
  if (!Number.isInteger(profile.batteryCells) || profile.batteryCells < 1 || profile.batteryCells > 12) {
    results.push({ level: "critical", title: "Battery cell count is invalid", detail: "Enter a whole battery cell count from 1 through 12." });
  }
  if (!isFinitePositive(profile.capacityMah)) {
    results.push({ level: "critical", title: "Battery capacity is required", detail: "Capacity is needed for the flight-time and continuous-current calculations." });
  }
  if (!isFinitePositive(profile.estimatedAverageCurrentA)) {
    results.push({ level: "warning", title: "No average current estimate", detail: "Flight time remains unavailable until you enter a measured or evidenced average current." });
  }
  if (!isFinitePositive(profile.expectedPeakCurrentA)) {
    results.push({ level: "warning", title: "No peak current estimate", detail: "The battery load comparison remains unavailable until peak current is entered." });
  }
  if (isFinitePositive(profile.expectedPeakCurrentA) && metrics.batteryContinuousA < profile.expectedPeakCurrentA) {
    results.push({
      level: "critical",
      title: "Entered peak current exceeds the stated continuous battery capability",
      detail: `Battery continuous capability calculates to ${metrics.batteryContinuousA.toFixed(1)} A; entered peak current is ${profile.expectedPeakCurrentA.toFixed(1)} A. Verify battery data and the current estimate.`,
    });
  }
  if (!isFinitePositive(profile.measuredThrustPerMotorG)) {
    results.push({ level: "warning", title: "No measured thrust data", detail: "Thrust-to-weight is intentionally not estimated. Enter a verified thrust-per-motor value to calculate it." });
  }
  if (metrics.thrustToWeight !== null && metrics.thrustToWeight < 2) {
    results.push({ level: "warning", title: "Low calculated thrust-to-weight", detail: `The supplied thrust data gives ${metrics.thrustToWeight.toFixed(2)}:1. Recheck the measurement and build weight before flight.` });
  }
  if (profile.firmware !== "Betaflight") {
    results.push({ level: "warning", title: "CLI draft is Betaflight-oriented", detail: "The generated command format has not been validated for the selected firmware. Review manually before applying it." });
  }
  if (results.length === 0) {
    results.push({ level: "pass", title: "Profile inputs are internally consistent", detail: "This checks entered values and calculations only; it does not certify airworthiness or component compatibility." });
  }
  return results;
}

function quoteCli(value: string) {
  return value.replace(/[\r\n;]/g, " ").replace(/[^a-zA-Z0-9 _\-.]/g, "").slice(0, 32).trim();
}

export function generateCliDraft(profile: DroneProfile) {
  const metrics = calculateMetrics(profile);
  const validations = validateProfile(profile);
  const status = validations.some((item) => item.level === "critical") ? "REVIEW REQUIRED" : "DRAFT READY FOR REVIEW";
  const lines = [
    "# OBIXCONFIGDOCTORFPV configuration draft",
    "# This file is generated from entered project values.",
    "# Verify every command against the firmware target before applying.",
    `# Status: ${status}`,
    "",
    `name ${quoteCli(profile.name) || "UNNAMED"}`,
    "",
    "# Build reference — non-command metadata",
    `# Frame: ${quoteCli(profile.frame) || "not supplied"}`,
    `# Motor: ${quoteCli(profile.motor) || "not supplied"} | ${profile.motorKv || 0} KV`,
    `# Prop: ${quoteCli(profile.prop) || "not supplied"}`,
    `# Battery: ${profile.batteryCells || 0}S ${profile.capacityMah || 0}mAh | nominal ${(metrics.voltageNominal || 0).toFixed(1)}V`,
    `# Flight style: ${profile.flightStyle}`,
    "",
    "save",
  ];
  return lines.join("\n");
}

export function summarizeProfile(profile: DroneProfile) {
  const metrics = calculateMetrics(profile);
  return [
    `${profile.name || "Unnamed build"}`,
    `${profile.frame || "Frame pending"} · ${profile.motor || "Motor pending"} · ${profile.motorKv || 0} KV`,
    `${profile.batteryCells || 0}S ${profile.capacityMah || 0} mAh · ${metrics.voltageNominal.toFixed(1)} V nominal`,
  ];
}
