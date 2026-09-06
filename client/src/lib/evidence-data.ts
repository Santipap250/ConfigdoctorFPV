/**
 * Seed motor/prop evidence. Every entry below is sourced from a manufacturer's
 * own published product page (not a reseller listing, and not an independent
 * bench test) and is labelled `provenance: "reference"` accordingly — it
 * documents what the manufacturer states, not a verified measured value.
 *
 * This set is intentionally small. Reseller listings for the same hardware were
 * found to disagree with each other (and, in places, with the manufacturer) on
 * weight and resistance figures during research for this feature — rather than
 * pick one unverifiable number, those items were left out entirely. Missing
 * evidence is handled conservatively throughout this feature: an unsourced or
 * disputed spec is omitted, never guessed.
 */
import { sanitizeEvidenceList, type HardwareEvidence } from "./evidence";

const rawSeedEvidence: HardwareEvidence[] = [
  {
    id: "motor-tmotor-f60prov-2207-5-kv1750",
    kind: "motor",
    manufacturer: "T-Motor",
    model: "F60 PRO V",
    version: "2207.5 / KV1750",
    statorSize: "2207.5",
    kv: 1750,
    weightG: 34.3,
    shaftDiameterMm: 4,
    configuration: "12N14P",
    maxPowerW: 1003,
    maxPowerDurationS: 10,
    ratedVoltage: "4-6S",
    matchingFrameInch: 5,
    provenance: "reference",
    provenanceRecord: {
      schemaVersion: "1.0",
      recordedAt: "2026-09-04",
      lastReviewedAt: "2026-09-06",
      reviewedBy: "OBIX evidence review",
      changeNote: "Initial manufacturer reference capture; no independent bench result asserted.",
    },
    source: {
      url: "https://store.tmotor.com/product/f60prov-fpv-motor.html",
      publisher: "T-Motor (manufacturer official store)",
      retrievedDate: "2026-09-04",
      note: "Manufacturer-published spec sheet; not an independent bench measurement.",
      snapshotHash: "45caedff6966bcc641c63888e2746cdb3f9a772f2eb89c20a01a40c679fce1a8",
      sourceVersion: "official page reviewed 2026-09-06",
      verifiedFields: ["model", "version", "statorSize", "kv", "weightG", "shaftDiameterMm", "configuration", "maxPowerW", "maxPowerDurationS", "ratedVoltage", "matchingFrameInch"],
    },
  },
  {
    id: "motor-tmotor-f60prov-2207-5-kv1950",
    kind: "motor",
    manufacturer: "T-Motor",
    model: "F60 PRO V",
    version: "2207.5 / KV1950",
    statorSize: "2207.5",
    kv: 1950,
    weightG: 33.9,
    shaftDiameterMm: 4,
    configuration: "12N14P",
    maxPowerW: 1216,
    maxPowerDurationS: 10,
    ratedVoltage: "4-6S",
    matchingFrameInch: 5,
    provenance: "reference",
    provenanceRecord: {
      schemaVersion: "1.0",
      recordedAt: "2026-09-04",
      lastReviewedAt: "2026-09-06",
      reviewedBy: "OBIX evidence review",
      changeNote: "Initial manufacturer reference capture; no independent bench result asserted.",
    },
    source: {
      url: "https://store.tmotor.com/product/f60prov-fpv-motor.html",
      publisher: "T-Motor (manufacturer official store)",
      retrievedDate: "2026-09-04",
      note: "Manufacturer-published spec sheet; not an independent bench measurement.",
      snapshotHash: "4b617e21dd6ccb6f86ef95c46b62e7c703be9572b0b0cb0af6a99d34ebae797d",
      sourceVersion: "official page reviewed 2026-09-06",
      verifiedFields: ["model", "version", "statorSize", "kv", "weightG", "shaftDiameterMm", "configuration", "maxPowerW", "maxPowerDurationS", "ratedVoltage", "matchingFrameInch"],
    },
  },
  {
    id: "prop-gemfan-hurricane-51466-v2",
    kind: "prop",
    manufacturer: "Gemfan",
    model: "Hurricane 51466",
    version: "V2",
    diameterInch: 5.1,
    pitchInch: 3.6,
    blades: 3,
    material: "Polycarbonate (PC)",
    weightG: 4.2,
    hubBoreMm: 5,
    adaptiveMotorStatorMin: 2207,
    adaptiveMotorStatorMax: 2306,
    provenance: "reference",
    provenanceRecord: {
      schemaVersion: "1.0",
      recordedAt: "2026-09-04",
      lastReviewedAt: "2026-09-06",
      reviewedBy: "OBIX evidence review",
      changeNote: "Initial manufacturer reference capture; no independent bench result asserted.",
    },
    source: {
      url: "https://www.gemfanhobby.com/hurricane-51466-v2-pc-3-blade.html",
      publisher: "Gemfan Hobby (manufacturer official site)",
      retrievedDate: "2026-09-04",
      note: "Manufacturer-published spec sheet; not an independent bench measurement.",
      snapshotHash: "464f56f8c93ba27fa6ad8a9b2e82599ac032e923f130a443e7d3e5062efac69f",
      sourceVersion: "official page reviewed 2026-09-06",
      verifiedFields: ["model", "version", "diameterInch", "pitchInch", "blades", "material", "weightG", "hubBoreMm", "adaptiveMotorStatorMin", "adaptiveMotorStatorMax"],
    },
  },
];

/** Sanitized on export: this is the last line of defense so a future edit to the
 * list above can never silently ship an entry with a missing/invalid citation. */
export const seedEvidence: HardwareEvidence[] = sanitizeEvidenceList(rawSeedEvidence);
