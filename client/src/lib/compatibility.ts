import type { DroneProfile } from "./drone";
import type { HardwareEvidence, MotorEvidence, PropEvidence } from "./evidence";

export type CompatibilityLevel = "pass" | "warning" | "critical";
export type CompatibilityStatus = "VERIFIED MATCH" | "UNKNOWN" | "OUTSIDE SOURCE RANGE" | "REVIEW" | "INVALID LINK";

export type CompatibilityCheck = {
  id: string;
  label: string;
  level: CompatibilityLevel;
  status: CompatibilityStatus;
  detail: string;
  evidenceId?: string;
  sourceUrl?: string;
};

export type CompatibilityAssessment = {
  overall: CompatibilityLevel;
  summary: "DOCUMENTED MATCH" | "PARTIAL / REVIEW" | "NOT DOCUMENTED / OUTSIDE RANGE";
  checks: CompatibilityCheck[];
  linkedMotor?: MotorEvidence;
  linkedProp?: PropEvidence;
};

export type MotorBatteryConstraint = { minCells: number; maxCells: number; sourceStatement: string };
export type MotorFrameConstraint = { frameInch: number; sourceStatement: string };
export type PropMotorConstraint = { minStator: number; maxStator: number; sourceStatement: string };

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseBatteryCells(ratedVoltage: string | undefined): MotorBatteryConstraint | null {
  if (!ratedVoltage) return null;
  const range = ratedVoltage.match(/(\d+)\s*[–-]\s*(\d+)S/i);
  if (range) return { minCells: Number(range[1]), maxCells: Number(range[2]), sourceStatement: ratedVoltage };
  const single = ratedVoltage.match(/(\d+)S/i);
  return single ? { minCells: Number(single[1]), maxCells: Number(single[1]), sourceStatement: ratedVoltage } : null;
}

function parseFrameInch(frame: string): number | null {
  const match = frame.match(/(\d+(?:\.\d+)?)\s*[- ]?inch/i);
  return match ? Number(match[1]) : null;
}

function parseStatorNumber(value: string | undefined): number | null {
  if (!value) return null;
  const digits = value.match(/\d+(?:\.\d+)?/);
  return digits ? Number(digits[0]) : null;
}

function parseProp(value: string): { diameter: number; pitch: number; blades: number } | null {
  const match = value.match(/(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+)/i);
  if (!match) return null;
  return { diameter: Number(match[1]), pitch: Number(match[2]), blades: Number(match[3]) };
}

function findLinkedMotor(profile: DroneProfile, entries: HardwareEvidence[]): MotorEvidence | undefined {
  if (!profile.motorEvidenceId) return undefined;
  return entries.find((entry): entry is MotorEvidence => entry.id === profile.motorEvidenceId && entry.kind === "motor");
}

function findLinkedProp(profile: DroneProfile, entries: HardwareEvidence[]): PropEvidence | undefined {
  if (!profile.propEvidenceId) return undefined;
  return entries.find((entry): entry is PropEvidence => entry.id === profile.propEvidenceId && entry.kind === "prop");
}

export function assessCompatibility(profile: DroneProfile, entries: HardwareEvidence[]): CompatibilityAssessment {
  const checks: CompatibilityCheck[] = [];
  const motor = findLinkedMotor(profile, entries);
  const prop = findLinkedProp(profile, entries);

  if (!profile.motorEvidenceId) {
    checks.push({ id: "motor-link", label: "Motor evidence", level: "warning", status: "UNKNOWN", detail: "No motor evidence is explicitly linked. OBIX will not infer motor compatibility from a name or KV alone." });
  } else if (!motor) {
    checks.push({ id: "motor-link", label: "Motor evidence", level: "critical", status: "INVALID LINK", detail: "The selected motor evidence record is not present in the sanitized evidence set." });
  } else {
    const profileMotor = normalizeToken(profile.motor);
    const evidenceMotor = normalizeToken(motor.statorSize ?? motor.model);
    const statorMatch = profileMotor === evidenceMotor || evidenceMotor.startsWith(profileMotor) || profileMotor.startsWith(evidenceMotor);
    const modelMatch = normalizeToken(motor.model).includes(profileMotor) || profileMotor.includes(normalizeToken(motor.model));
    const kvMatch = motor.kv === profile.motorKv;
    const identityPass = kvMatch && (statorMatch || modelMatch);
    checks.push({
      id: "motor-link",
      label: "Motor evidence",
      level: identityPass ? "pass" : "warning",
      status: identityPass ? "VERIFIED MATCH" : "REVIEW",
      evidenceId: motor.id,
      sourceUrl: motor.source.url,
      detail: identityPass
        ? `${motor.model} ${motor.version ?? ""} matches the profile motor identity and KV against the linked evidence record.`
        : `Linked motor evidence is ${motor.model} ${motor.kv} KV, while the profile uses ${profile.motor} / ${profile.motorKv} KV. Review the linkage before relying on it.`,
    });

    const battery = parseBatteryCells(motor.ratedVoltage);
    if (!battery) {
      checks.push({ id: "motor-battery", label: "Motor / battery range", level: "warning", status: "UNKNOWN", evidenceId: motor.id, sourceUrl: motor.source.url, detail: "The linked motor evidence does not contain a structured battery-cell range, so OBIX will not infer one." });
    } else if (profile.batteryCells < battery.minCells || profile.batteryCells > battery.maxCells) {
      checks.push({ id: "motor-battery", label: "Motor / battery range", level: "critical", status: "OUTSIDE SOURCE RANGE", evidenceId: motor.id, sourceUrl: motor.source.url, detail: `The source states ${battery.sourceStatement}; the profile is ${profile.batteryCells}S. This is a documented-range mismatch, not a safety certification.` });
    } else {
      checks.push({ id: "motor-battery", label: "Motor / battery range", level: "pass", status: "VERIFIED MATCH", evidenceId: motor.id, sourceUrl: motor.source.url, detail: `The profile battery is ${profile.batteryCells}S and falls within the source-declared ${battery.minCells}–${battery.maxCells}S range.` });
    }

    const matchingFrame = motor.matchingFrameInch;
    const profileFrame = parseFrameInch(profile.frame);
    if (matchingFrame === undefined || profileFrame === null) {
      checks.push({ id: "motor-frame", label: "Motor / frame evidence", level: "warning", status: "UNKNOWN", evidenceId: motor.id, sourceUrl: motor.source.url, detail: "No explicit structured frame-size compatibility claim can be evaluated from the linked evidence and current frame field." });
    } else if (Math.abs(profileFrame - matchingFrame) > 0.001) {
      checks.push({ id: "motor-frame", label: "Motor / frame evidence", level: "critical", status: "OUTSIDE SOURCE RANGE", evidenceId: motor.id, sourceUrl: motor.source.url, detail: `The source declares a ${matchingFrame}-inch matching frame; the profile is ${profileFrame}-inch. Review the hardware selection.` });
    } else {
      checks.push({ id: "motor-frame", label: "Motor / frame evidence", level: "pass", status: "VERIFIED MATCH", evidenceId: motor.id, sourceUrl: motor.source.url, detail: `The profile frame size matches the source-declared ${matchingFrame}-inch matching frame.` });
    }
  }

  if (!profile.propEvidenceId) {
    checks.push({ id: "prop-link", label: "Prop evidence", level: "warning", status: "UNKNOWN", detail: "No prop evidence is explicitly linked. OBIX will not infer prop compatibility from a text label alone." });
  } else if (!prop) {
    checks.push({ id: "prop-link", label: "Prop evidence", level: "critical", status: "INVALID LINK", detail: "The selected prop evidence record is not present in the sanitized evidence set." });
  } else {
    const target = parseProp(profile.prop);
    const matched = Boolean(target && Math.abs(target.diameter - prop.diameterInch) < 0.001 && Math.abs(target.pitch - prop.pitchInch) < 0.001 && target.blades === prop.blades);
    checks.push({ id: "prop-link", label: "Prop evidence", level: matched ? "pass" : "warning", status: matched ? "VERIFIED MATCH" : "REVIEW", evidenceId: prop.id, sourceUrl: prop.source.url, detail: matched ? `${prop.model} ${prop.version ?? ""} matches the profile diameter, pitch and blade count.` : `The linked prop record does not fully match the profile geometry string. Review the prop selection.` });

    if (motor && prop.adaptiveMotorStatorMin !== undefined && prop.adaptiveMotorStatorMax !== undefined) {
      const motorStator = parseStatorNumber(motor.statorSize);
      if (motorStator === null) {
        checks.push({ id: "prop-motor", label: "Prop / motor class", level: "warning", status: "UNKNOWN", evidenceId: prop.id, sourceUrl: prop.source.url, detail: "The linked motor stator size could not be parsed into the source-defined class range." });
      } else if (motorStator < prop.adaptiveMotorStatorMin || motorStator > prop.adaptiveMotorStatorMax) {
        checks.push({ id: "prop-motor", label: "Prop / motor class", level: "critical", status: "OUTSIDE SOURCE RANGE", evidenceId: prop.id, sourceUrl: prop.source.url, detail: `The prop source states ${prop.adaptiveMotorStatorMin}–${prop.adaptiveMotorStatorMax} motor class; the linked motor is ${motorStator}. Review the source linkage.` });
      } else {
        checks.push({ id: "prop-motor", label: "Prop / motor class", level: "pass", status: "VERIFIED MATCH", evidenceId: prop.id, sourceUrl: prop.source.url, detail: `The linked motor stator class ${motorStator} falls within the source-declared ${prop.adaptiveMotorStatorMin}–${prop.adaptiveMotorStatorMax} class.` });
      }
    }
  }

  const hasCritical = checks.some((check) => check.level === "critical");
  const hasWarning = checks.some((check) => check.level === "warning");
  const overall: CompatibilityLevel = hasCritical ? "critical" : hasWarning ? "warning" : "pass";
  return {
    overall,
    summary: overall === "critical" ? "NOT DOCUMENTED / OUTSIDE RANGE" : overall === "warning" ? "PARTIAL / REVIEW" : "DOCUMENTED MATCH",
    checks,
    linkedMotor: motor,
    linkedProp: prop,
  };
}
