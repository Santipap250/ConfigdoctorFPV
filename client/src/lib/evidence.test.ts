import { describe, expect, it } from "vitest";
import {
  distinctManufacturers,
  filterEvidence,
  isEvidenceEntryValid,
  provenanceBadge,
  provenanceLabel,
  sanitizeEvidenceList,
  validateEvidenceEntry,
  type HardwareEvidence,
  type MotorEvidence,
  type PropEvidence,
} from "./evidence";
import { seedEvidence } from "./evidence-data";

const validSource = {
  url: "https://example-manufacturer.com/product/spec-sheet",
  publisher: "Example Manufacturer",
  retrievedDate: "2026-09-04",
};

const validProvenanceRecord = {
  schemaVersion: "1.0" as const,
  recordedAt: "2026-09-04",
  lastReviewedAt: "2026-09-06",
  reviewedBy: "OBIX evidence review",
  changeNote: "Initial cited reference capture.",
};

const validMotor: MotorEvidence = {
  id: "motor-1",
  kind: "motor",
  manufacturer: "Example Manufacturer",
  model: "EX2207",
  kv: 1750,
  provenance: "reference",
  provenanceRecord: validProvenanceRecord,
  source: validSource,
};

const validProp: PropEvidence = {
  id: "prop-1",
  kind: "prop",
  manufacturer: "Example Manufacturer",
  model: "EX5146",
  diameterInch: 5.1,
  pitchInch: 4.6,
  blades: 3,
  provenance: "reference",
  provenanceRecord: validProvenanceRecord,
  source: validSource,
};

describe("validateEvidenceEntry", () => {
  it("accepts a fully-cited motor entry", () => {
    expect(validateEvidenceEntry(validMotor)).toEqual([]);
    expect(isEvidenceEntryValid(validMotor)).toBe(true);
  });

  it("accepts a fully-cited prop entry", () => {
    expect(validateEvidenceEntry(validProp)).toEqual([]);
    expect(isEvidenceEntryValid(validProp)).toBe(true);
  });

  it("rejects an entry with no source url — no hardware fact without a citation", () => {
    const entry: MotorEvidence = { ...validMotor, source: { ...validSource, url: "" } };
    const issues = validateEvidenceEntry(entry);
    expect(issues.some((issue) => issue.field === "source.url")).toBe(true);
    expect(isEvidenceEntryValid(entry)).toBe(false);
  });

  it("rejects a non-http(s) source url", () => {
    const entry: MotorEvidence = { ...validMotor, source: { ...validSource, url: "not-a-url" } };
    expect(isEvidenceEntryValid(entry)).toBe(false);
  });

  it("rejects an entry with a missing publisher", () => {
    const entry: MotorEvidence = { ...validMotor, source: { ...validSource, publisher: "" } };
    const issues = validateEvidenceEntry(entry);
    expect(issues.some((issue) => issue.field === "source.publisher")).toBe(true);
  });

  it("rejects an entry with a malformed retrieval date", () => {
    const entry: MotorEvidence = { ...validMotor, source: { ...validSource, retrievedDate: "09/04/2026" } };
    const issues = validateEvidenceEntry(entry);
    expect(issues.some((issue) => issue.field === "source.retrievedDate")).toBe(true);
  });

  it("rejects a motor with non-positive KV", () => {
    const entry: MotorEvidence = { ...validMotor, kv: 0 };
    expect(isEvidenceEntryValid(entry)).toBe(false);
  });

  it("rejects a prop missing diameter, pitch, or blade count", () => {
    expect(isEvidenceEntryValid({ ...validProp, diameterInch: 0 })).toBe(false);
    expect(isEvidenceEntryValid({ ...validProp, pitchInch: 0 })).toBe(false);
    expect(isEvidenceEntryValid({ ...validProp, blades: 0 })).toBe(false);
  });

  it("rejects an unrecognized provenance value", () => {
    const entry = { ...validMotor, provenance: "guessed" } as unknown as MotorEvidence;
    expect(isEvidenceEntryValid(entry)).toBe(false);
  });

  it("rejects an entry without a versioned provenance record", () => {
    const entry = { ...validMotor, provenanceRecord: undefined } as unknown as MotorEvidence;
    const issues = validateEvidenceEntry(entry);
    expect(issues.some((issue) => issue.field === "provenanceRecord")).toBe(true);
    expect(isEvidenceEntryValid(entry)).toBe(false);
  });

  it("rejects an invalid provenance schema version", () => {
    const entry = { ...validMotor, provenanceRecord: { ...validProvenanceRecord, schemaVersion: "2.0" } } as unknown as MotorEvidence;
    expect(validateEvidenceEntry(entry).some((issue) => issue.field === "provenanceRecord.schemaVersion")).toBe(true);
  });

  it("rejects a provenance record without reviewer or change note", () => {
    const entry = { ...validMotor, provenanceRecord: { ...validProvenanceRecord, reviewedBy: "", changeNote: "" } };
    const fields = validateEvidenceEntry(entry).map((issue) => issue.field);
    expect(fields).toEqual(expect.arrayContaining(["provenanceRecord.reviewedBy", "provenanceRecord.changeNote"]));
  });

  it("rejects an entry missing manufacturer or model", () => {
    expect(isEvidenceEntryValid({ ...validMotor, manufacturer: "" })).toBe(false);
    expect(isEvidenceEntryValid({ ...validMotor, model: "  " })).toBe(false);
  });
});

describe("sanitizeEvidenceList", () => {
  it("keeps valid entries and drops invalid ones", () => {
    const uncited: MotorEvidence = { ...validMotor, id: "motor-uncited", source: { ...validSource, url: "" } };
    const result = sanitizeEvidenceList<HardwareEvidence>([validMotor, uncited, validProp]);
    expect(result.map((entry) => entry.id)).toEqual(["motor-1", "prop-1"]);
  });

  it("never lets an unsourced entry through even if everything else is filled in", () => {
    const looksComplete: MotorEvidence = { ...validMotor, id: "looks-complete", source: { url: "", publisher: "", retrievedDate: "" } };
    expect(sanitizeEvidenceList([looksComplete])).toEqual([]);
  });
});

describe("filterEvidence", () => {
  const entries: HardwareEvidence[] = [validMotor, validProp, { ...validMotor, id: "motor-2", manufacturer: "Other Co", provenance: "measured" }];

  it("filters by kind", () => {
    expect(filterEvidence(entries, { kind: "prop" })).toEqual([validProp]);
  });

  it("filters by provenance", () => {
    const result = filterEvidence(entries, { provenance: "measured" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("motor-2");
  });

  it("filters by manufacturer case-insensitively", () => {
    const result = filterEvidence(entries, { manufacturer: "other co" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("motor-2");
  });

  it("filters by free-text query across manufacturer/model/version", () => {
    const result = filterEvidence(entries, { query: "ex5146" });
    expect(result).toEqual([validProp]);
  });

  it("returns everything when no filter is set", () => {
    expect(filterEvidence(entries, {})).toEqual(entries);
  });
});

describe("distinctManufacturers", () => {
  it("returns a sorted, de-duplicated manufacturer list", () => {
    const entries: HardwareEvidence[] = [validMotor, validProp, { ...validMotor, id: "m2", manufacturer: "Acme" }];
    expect(distinctManufacturers(entries)).toEqual(["Acme", "Example Manufacturer"]);
  });
});

describe("provenance labels", () => {
  it("gives distinct badges and labels per provenance", () => {
    expect(provenanceBadge("measured")).toBe("MEASURED");
    expect(provenanceBadge("estimated")).toBe("ESTIMATED");
    expect(provenanceBadge("reference")).toBe("REFERENCE");
    expect(provenanceLabel("measured")).toMatch(/independent/i);
    expect(provenanceLabel("estimated")).toMatch(/unverified|inferred/i);
    expect(provenanceLabel("reference")).toMatch(/manufacturer/i);
  });
});

describe("seedEvidence (regression: shipped data must stay fully cited)", () => {
  it("contains at least one motor and one prop entry", () => {
    expect(seedEvidence.some((entry) => entry.kind === "motor")).toBe(true);
    expect(seedEvidence.some((entry) => entry.kind === "prop")).toBe(true);
  });

  it("every shipped entry passes validation (has a real source url, publisher, and date)", () => {
    for (const entry of seedEvidence) {
      expect(validateEvidenceEntry(entry)).toEqual([]);
    }
  });

  it("every shipped entry cites a checkable http(s) url", () => {
    for (const entry of seedEvidence) {
      expect(entry.source.url.startsWith("https://")).toBe(true);
    }
  });

  it("every shipped entry carries a reviewed provenance version", () => {
    for (const entry of seedEvidence) {
      expect(entry.provenanceRecord.schemaVersion).toBe("1.0");
      expect(entry.provenanceRecord.lastReviewedAt).toBe("2026-09-06");
      expect(entry.provenanceRecord.reviewedBy).toBeTruthy();
    }
  });
});
