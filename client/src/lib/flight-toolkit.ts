/** Deterministic FPV utility calculations. Inputs are user supplied; no component compatibility is inferred. */

export type BatteryPlannerInput = {
  capacityMah: number;
  cRating: number;
  averageCurrentA: number;
  peakCurrentA: number;
  reservePercent: number;
};

export function batteryPlanner(input: BatteryPlannerInput) {
  const capacityAh = Math.max(0, input.capacityMah) / 1000;
  const statedContinuousA = capacityAh * Math.max(0, input.cRating);
  const reserve = Math.min(95, Math.max(0, input.reservePercent)) / 100;
  const usableCapacityAh = capacityAh * (1 - reserve);
  const flightMinutes = input.averageCurrentA > 0 ? (usableCapacityAh * 60) / input.averageCurrentA : null;
  const peakHeadroomA = statedContinuousA - Math.max(0, input.peakCurrentA);
  return { capacityAh, statedContinuousA, usableCapacityAh, flightMinutes, peakHeadroomA, peakOverLimit: peakHeadroomA < 0 };
}

export type SagInput = { peakCurrentA: number; packResistanceMilliOhm: number };

export function batterySag(input: SagInput) {
  const resistanceOhm = Math.max(0, input.packResistanceMilliOhm) / 1000;
  const sagV = Math.max(0, input.peakCurrentA) * resistanceOhm;
  return { resistanceOhm, sagV };
}

export type ThrustInput = { thrustPerMotorG: number; motorCount: number; weightG: number };

export function thrustBudget(input: ThrustInput) {
  const totalThrustG = Math.max(0, input.thrustPerMotorG) * Math.max(0, input.motorCount);
  const ratio = input.weightG > 0 ? totalThrustG / input.weightG : null;
  const theoreticalHoverPercent = ratio && ratio > 0 ? (1 / ratio) * 100 : null;
  const excessThrustG = totalThrustG - Math.max(0, input.weightG);
  return { totalThrustG, ratio, theoreticalHoverPercent, excessThrustG };
}

export function powerBudget(voltageV: number, averageCurrentA: number, peakCurrentA: number, batteryContinuousA: number) {
  const v = Math.max(0, voltageV);
  const avg = Math.max(0, averageCurrentA);
  const peak = Math.max(0, peakCurrentA);
  return {
    averagePowerW: v * avg,
    peakPowerW: v * peak,
    continuousHeadroomA: batteryContinuousA - peak,
    continuousLoadPercent: batteryContinuousA > 0 ? (peak / batteryContinuousA) * 100 : null,
  };
}

export type MissionReadinessInput = {
  voltageNominal: number;
  batteryContinuousA: number;
  averageCurrentA: number;
  peakCurrentA: number;
  packResistanceMilliOhm: number;
  thrustPerMotorG: number;
  motorCount: number;
  weightG: number;
  checksComplete: number;
  checksTotal: number;
};

export function missionReadiness(input: MissionReadinessInput) {
  const power = powerBudget(input.voltageNominal, input.averageCurrentA, input.peakCurrentA, input.batteryContinuousA);
  const sag = batterySag({ peakCurrentA: input.peakCurrentA, packResistanceMilliOhm: input.packResistanceMilliOhm });
  const thrust = thrustBudget({ thrustPerMotorG: input.thrustPerMotorG, motorCount: input.motorCount, weightG: input.weightG });
  const checksRatio = input.checksTotal > 0 ? Math.min(1, Math.max(0, input.checksComplete / input.checksTotal)) : 0;
  const factors = {
    power: power.continuousHeadroomA > 0 ? 25 : 0,
    sag: sag.sagV <= 2 ? 20 : sag.sagV <= 3 ? 10 : 0,
    thrust: thrust.totalThrustG > 0 && thrust.ratio !== null && thrust.ratio >= 2 ? 25 : thrust.totalThrustG > 0 && thrust.ratio !== null ? 12 : 0,
    checklist: Math.round(checksRatio * 30),
  };
  const score = Math.min(100, factors.power + factors.sag + factors.thrust + factors.checklist);
  const evidenceIncomplete = thrust.totalThrustG <= 0 || checksRatio < 1;
  const verdict = evidenceIncomplete ? "HOLD — INPUTS INCOMPLETE" : score >= 85 ? "READY FOR FIELD CHECK" : score >= 60 ? "REVIEW BEFORE ARM" : "HOLD — INPUTS INCOMPLETE";
  return { score, verdict, factors, power, sag, thrust };
}

export type ReadinessItem = { id: string; label: string; hint: string };

export const preflightItems: ReadinessItem[] = [
  { id: "frame", label: "Frame / hardware secure", hint: "Check screws, arms, stack, camera and antenna mounting." },
  { id: "props", label: "Props correct + damage free", hint: "Correct direction, orientation, condition and clearance." },
  { id: "motor", label: "Motors spin freely", hint: "No grinding, binding or abnormal resistance with power disconnected." },
  { id: "battery", label: "Battery physically healthy", hint: "No swelling, puncture, damaged leads or loose connector." },
  { id: "failsafe", label: "Failsafe verified", hint: "Verify the configured failsafe behavior in a controlled location." },
  { id: "rx", label: "Receiver link verified", hint: "Confirm correct model, channel mapping and link quality." },
  { id: "vtx", label: "VTX / video path checked", hint: "Confirm antenna, channel and legal power setting for your location." },
  { id: "storage", label: "Config backed up", hint: "Keep a known-good CLI dump or configuration snapshot." },
  { id: "batteryFit", label: "Battery secure", hint: "Use appropriate straps/pad and confirm no prop or motor contact." },
  { id: "area", label: "Flight area clear", hint: "Check people, property, RF environment, local rules and recovery access." },
];

export function diffConfigText(left: string, right: string) {
  const a = left.replace(/\r/g, "").split("\n");
  const b = right.replace(/\r/g, "").split("\n");
  const max = Math.max(a.length, b.length);
  const rows: Array<{ kind: "same" | "changed" | "left-only" | "right-only"; left: string; right: string; line: number }> = [];
  for (let i = 0; i < max; i += 1) {
    const leftLine = a[i] ?? "";
    const rightLine = b[i] ?? "";
    const kind = leftLine === rightLine ? "same" : i >= a.length ? "right-only" : i >= b.length ? "left-only" : "changed";
    rows.push({ kind, left: leftLine, right: rightLine, line: i + 1 });
  }
  const changed = rows.filter((row) => row.kind !== "same").length;
  return { rows, changed };
}
