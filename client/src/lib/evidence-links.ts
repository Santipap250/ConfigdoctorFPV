import type { DroneProfile } from "./drone";
import type { HardwareEvidence, MotorEvidence, PropEvidence } from "./evidence";

export type CompatibilityLevel = "pass" | "warning" | "critical";
export type CompatibilityCheck = {
  id: string;
  label: string;
  level: CompatibilityLevel;
  status: string;
  detail: string;
  evidenceId?: string;
};

function parseBatteryCells(ratedVoltage: string | undefined): { min: number; max: number } | null {
  if (!ratedVoltage) return null;
  const matches = ratedVoltage.match(/(\d+)\s*-\s*(\d+)S/i);
  if (matches) return { min: Number(matches[1]), max: Number(matches[2]) };
  const single = ratedVoltage.match(/(\d+)S/i);
  return single ? { min: Number(single[1]), max: Number(single[1]) } : null;
}

function parseProp(value: string): { diameter: number; pitch: number; blades: number } | null {
  const match = value.match(/(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+(?:\.\d+)?)\s*[×x*]\s*(\d+)/i);
  if (!match) return null;
  return { diameter: Number(match[1]), pitch: Number(match[2]), blades: Number(match[3]) };
}

export function assessProfileEvidence(profile: DroneProfile, entries: HardwareEvidence[]): CompatibilityCheck[] {
  const checks: CompatibilityCheck[] = [];
  const motor = profile.motorEvidenceId ? entries.find((entry): entry is MotorEvidence => entry.id === profile.motorEvidenceId && entry.kind === "motor") : undefined;
  const prop = profile.propEvidenceId ? entries.find((entry): entry is PropEvidence => entry.id === profile.propEvidenceId && entry.kind === "prop") : undefined;

  if (!profile.motorEvidenceId) {
    checks.push({ id: "motor-evidence", label: "Motor evidence", level: "warning", status: "UNKNOWN", detail: "No verified motor evidence is linked to this profile. OBIX will not infer compatibility." });
  } else if (!motor) {
    checks.push({ id: "motor-evidence", label: "Motor evidence", level: "critical", status: "INVALID LINK", detail: "The selected motor evidence record is not available in the current evidence set." });
  } else {
    const kvMatch = motor.kv === profile.motorKv;
    const profileMotorToken = profile.motor.trim().toLowerCase();
    const evidenceStatorToken = motor.statorSize?.trim().toLowerCase() ?? "";
    const statorMatch = Boolean(profileMotorToken && evidenceStatorToken && (profileMotorToken === evidenceStatorToken || evidenceStatorToken.startsWith(profileMotorToken) || profileMotorToken.startsWith(evidenceStatorToken)));
    const modelMatch = Boolean(profileMotorToken && (motor.model.toLowerCase().includes(profileMotorToken) || profileMotorToken.includes(motor.model.toLowerCase())));
    const identityMatch = modelMatch || statorMatch;
    const battery = parseBatteryCells(motor.ratedVoltage);
    checks.push({
      id: "motor-evidence", label: "Motor evidence", evidenceId: motor.id,
      level: kvMatch && identityMatch ? "pass" : "warning",
      status: kvMatch && identityMatch ? "MATCHED" : "REVIEW",
      detail: `${motor.model} · ${motor.kv} KV is linked${battery ? `; source voltage reference ${battery.min === battery.max ? `${battery.min}S` : `${battery.min}–${battery.max}S`}` : ""}. ${kvMatch && modelMatch ? "Profile motor identity/KV agree with the evidence record." : "Profile motor identity or KV differs from the selected evidence record."}`,
    });
    if (battery && (profile.batteryCells < battery.min || profile.batteryCells > battery.max)) {
      checks.push({ id: "motor-battery", label: "Motor / battery evidence", level: "critical", status: "OUTSIDE SOURCE RANGE", evidenceId: motor.id, detail: `The linked source lists ${battery.min === battery.max ? `${battery.min}S` : `${battery.min}–${battery.max}S`}; the profile is ${profile.batteryCells}S. This is an evidence mismatch, not a compatibility guess.` });
    } else if (!battery) {
      checks.push({ id: "motor-battery", label: "Motor / battery evidence", level: "warning", status: "UNKNOWN", evidenceId: motor.id, detail: "The linked motor evidence does not contain a parseable battery voltage range." });
    }
  }

  if (!profile.propEvidenceId) {
    checks.push({ id: "prop-evidence", label: "Prop evidence", level: "warning", status: "UNKNOWN", detail: "No verified prop evidence is linked to this profile." });
  } else if (!prop) {
    checks.push({ id: "prop-evidence", label: "Prop evidence", level: "critical", status: "INVALID LINK", detail: "The selected prop evidence record is not available in the current evidence set." });
  } else {
    const target = parseProp(profile.prop);
    const matched = target && Math.abs(target.diameter - prop.diameterInch) < 0.001 && Math.abs(target.pitch - prop.pitchInch) < 0.001 && target.blades === prop.blades;
    checks.push({ id: "prop-evidence", label: "Prop evidence", evidenceId: prop.id, level: matched ? "pass" : "warning", status: matched ? "MATCHED" : "REVIEW", detail: matched ? `${prop.model} ${prop.version ?? ""} matches the profile prop geometry.` : `${prop.model} ${prop.version ?? ""} is linked, but the profile prop string does not fully match its diameter/pitch/blade data.` });
  }

  return checks;
}
