import type { DroneProfile } from "./drone";
import { assessCompatibility, type CompatibilityCheck } from "./compatibility";
import type { HardwareEvidence } from "./evidence";

/**
 * Backward-compatible entry point for the Phase 2 evidence-link surface.
 * Phase 3 owns the actual compatibility logic so there is only one source of
 * truth for motor/prop matching and documented-range evaluation.
 */
export { type CompatibilityCheck } from "./compatibility";

export function assessProfileEvidence(profile: DroneProfile, entries: HardwareEvidence[]): CompatibilityCheck[] {
  return assessCompatibility(profile, entries).checks;
}
