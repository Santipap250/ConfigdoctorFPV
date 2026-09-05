/**
 * Motor / propeller evidence domain.
 *
 * Hard rule: no hardware data point may exist in this system without a checkable
 * source citation. `validateEvidenceEntry` / `sanitizeEvidenceList` are the
 * enforcement mechanism — an entry with a missing or malformed source is treated
 * as invalid and is filtered out before it ever reaches the UI. This module does
 * not calculate, infer, or "fill in" any motor or prop specification itself.
 */

export type EvidenceProvenance = "measured" | "estimated" | "reference";

export const evidenceProvenanceOptions: EvidenceProvenance[] = ["measured", "estimated", "reference"];

/** Immutable audit metadata for the provenance claim attached to an entry. */
export type EvidenceProvenanceRecord = {
  schemaVersion: "1.0";
  recordedAt: string;
  lastReviewedAt: string;
  reviewedBy: string;
  changeNote: string;
};

/** A checkable citation for one evidence entry. Every field here is required — an
 * entry cannot claim a hardware fact without saying where it came from and when
 * it was checked. */
export type EvidenceSource = {
  /** Must be an http(s) URL a reviewer can open to verify the claim. */
  url: string;
  /** Who published the cited page — manufacturer name, reseller, or test author. */
  publisher: string;
  /** ISO date (YYYY-MM-DD) this citation was retrieved / last checked. */
  retrievedDate: string;
  /** Optional short context, e.g. "manufacturer product page", "bench test video". */
  note?: string;
};

type EvidenceBase = {
  id: string;
  manufacturer: string;
  model: string;
  /** Product revision/variant label, e.g. "V2", "Pro IV". Distinct hardware
   * revisions frequently carry different specs under the same model name, so this
   * is kept separate from `model` rather than folded in. */
  version?: string;
  provenance: EvidenceProvenance;
  provenanceRecord: EvidenceProvenanceRecord;
  source: EvidenceSource;
};

export type MotorEvidence = EvidenceBase & {
  kind: "motor";
  statorSize?: string;
  kv: number;
  weightG?: number;
  shaftDiameterMm?: number;
  configuration?: string;
  maxPowerW?: number;
  maxPowerDurationS?: number;
  ratedVoltage?: string;
};

export type PropEvidence = EvidenceBase & {
  kind: "prop";
  diameterInch: number;
  pitchInch: number;
  blades: number;
  material?: string;
  weightG?: number;
  hubBoreMm?: number;
};

export type HardwareEvidence = MotorEvidence | PropEvidence;

export type EvidenceIssue = { field: string; message: string };

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime());
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Validate one evidence entry. This is the single gate that decides whether a
 * hardware claim is allowed to be shown. Missing/invalid source citation is
 * always a validation failure, regardless of how complete the spec fields are.
 */
export function validateEvidenceEntry(entry: HardwareEvidence): EvidenceIssue[] {
  const issues: EvidenceIssue[] = [];

  if (!entry.id.trim()) issues.push({ field: "id", message: "An id is required." });
  if (!entry.manufacturer.trim()) issues.push({ field: "manufacturer", message: "Manufacturer is required." });
  if (!entry.model.trim()) issues.push({ field: "model", message: "Model is required." });
  if (!evidenceProvenanceOptions.includes(entry.provenance)) {
    issues.push({ field: "provenance", message: "Provenance must be measured, estimated, or reference." });
  }

  if (!entry.provenanceRecord) {
    issues.push({ field: "provenanceRecord", message: "A versioned provenance record is required." });
  } else {
    if (entry.provenanceRecord.schemaVersion !== "1.0") {
      issues.push({ field: "provenanceRecord.schemaVersion", message: "Unsupported provenance schema version." });
    }
    if (!isIsoDate(entry.provenanceRecord.recordedAt)) {
      issues.push({ field: "provenanceRecord.recordedAt", message: "A recorded date in YYYY-MM-DD format is required." });
    }
    if (!isIsoDate(entry.provenanceRecord.lastReviewedAt)) {
      issues.push({ field: "provenanceRecord.lastReviewedAt", message: "A review date in YYYY-MM-DD format is required." });
    }
    if (!isNonEmpty(entry.provenanceRecord.reviewedBy)) {
      issues.push({ field: "provenanceRecord.reviewedBy", message: "The reviewer identity is required." });
    }
    if (!isNonEmpty(entry.provenanceRecord.changeNote)) {
      issues.push({ field: "provenanceRecord.changeNote", message: "A provenance change note is required." });
    }
  }

  if (!entry.source) {
    issues.push({ field: "source", message: "A source citation is required for every hardware entry." });
  } else {
    if (!entry.source.url || !isHttpUrl(entry.source.url)) {
      issues.push({ field: "source.url", message: "A checkable http(s) source URL is required. No entry may be added without one." });
    }
    if (!entry.source.publisher || !entry.source.publisher.trim()) {
      issues.push({ field: "source.publisher", message: "The source publisher is required." });
    }
    if (!entry.source.retrievedDate || !isIsoDate(entry.source.retrievedDate)) {
      issues.push({ field: "source.retrievedDate", message: "A retrieval date in YYYY-MM-DD format is required." });
    }
  }

  if (entry.kind === "motor") {
    if (!isFinitePositive(entry.kv)) issues.push({ field: "kv", message: "KV must be a positive number." });
    if (entry.weightG !== undefined && !isFinitePositive(entry.weightG)) issues.push({ field: "weightG", message: "Weight must be a positive number when supplied." });
  } else if (entry.kind === "prop") {
    if (!isFinitePositive(entry.diameterInch)) issues.push({ field: "diameterInch", message: "Diameter must be a positive number." });
    if (!isFinitePositive(entry.pitchInch)) issues.push({ field: "pitchInch", message: "Pitch must be a positive number." });
    if (!isFinitePositive(entry.blades)) issues.push({ field: "blades", message: "Blade count must be a positive number." });
  } else {
    issues.push({ field: "kind", message: "kind must be 'motor' or 'prop'." });
  }

  return issues;
}

export function isEvidenceEntryValid(entry: HardwareEvidence): boolean {
  return validateEvidenceEntry(entry).length === 0;
}

/**
 * Conservative gate for any list of evidence about to be surfaced: entries that
 * fail validation (most commonly, a missing source citation) are dropped rather
 * than shown with a guessed-in or blank citation. This runs even on data authored
 * inside this codebase, so a future bad edit can never silently ship an unsourced
 * hardware claim.
 */
export function sanitizeEvidenceList<T extends HardwareEvidence>(entries: T[]): T[] {
  return entries.filter(isEvidenceEntryValid);
}

export type EvidenceFilter = {
  kind?: "motor" | "prop";
  provenance?: EvidenceProvenance;
  manufacturer?: string;
  query?: string;
};

export function filterEvidence(entries: HardwareEvidence[], filter: EvidenceFilter): HardwareEvidence[] {
  return entries.filter((entry) => {
    if (filter.kind && entry.kind !== filter.kind) return false;
    if (filter.provenance && entry.provenance !== filter.provenance) return false;
    if (filter.manufacturer && entry.manufacturer.toLowerCase() !== filter.manufacturer.toLowerCase()) return false;
    if (filter.query && filter.query.trim()) {
      const needle = filter.query.trim().toLowerCase();
      const haystack = `${entry.manufacturer} ${entry.model} ${entry.version ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function distinctManufacturers(entries: HardwareEvidence[]): string[] {
  return Array.from(new Set(entries.map((entry) => entry.manufacturer))).sort((a, b) => a.localeCompare(b));
}

export function provenanceLabel(provenance: EvidenceProvenance): string {
  if (provenance === "measured") return "MEASURED — independent bench/flight test";
  if (provenance === "reference") return "REFERENCE — manufacturer-published spec";
  return "ESTIMATED — unverified or inferred value";
}

/** Short badge text; full meaning stays in provenanceLabel for the detail view. */
export function provenanceBadge(provenance: EvidenceProvenance): string {
  if (provenance === "measured") return "MEASURED";
  if (provenance === "reference") return "REFERENCE";
  return "ESTIMATED";
}
