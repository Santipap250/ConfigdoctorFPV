import { describe, expect, it } from "vitest";
import { checkParamValue, firmwareParamSchema, FIRMWARE_SCHEMA_SOURCE, FIRMWARE_SCHEMA_VERSION } from "./firmware-schema";

describe("checkParamValue", () => {
  it("returns 'unknown' for a key with no schema entry", () => {
    const result = checkParamValue("some_made_up_param", "42");
    expect(result).toEqual({ status: "unknown", spec: null });
  });

  it("matches keys case-insensitively", () => {
    const result = checkParamValue("DYN_NOTCH_COUNT", "3");
    expect(result.status).toBe("in-range");
    expect(result.spec?.key).toBe("dyn_notch_count");
  });

  it("reports a numeric value within range as in-range", () => {
    const result = checkParamValue("dyn_notch_count", "5");
    expect(result.status).toBe("in-range");
  });

  it("reports a numeric value below the minimum as out-of-range", () => {
    const result = checkParamValue("dyn_notch_min_hz", "10");
    expect(result.status).toBe("out-of-range");
  });

  it("reports a numeric value above the maximum as out-of-range", () => {
    const result = checkParamValue("dyn_notch_count", "9");
    expect(result.status).toBe("out-of-range");
  });

  it("accepts a numeric value at exactly the boundary", () => {
    expect(checkParamValue("dyn_notch_count", "0").status).toBe("in-range");
    expect(checkParamValue("dyn_notch_count", "7").status).toBe("in-range");
  });

  it("reports a non-numeric value for a numeric field as invalid-value", () => {
    const result = checkParamValue("p_roll", "not-a-number");
    expect(result.status).toBe("invalid-value");
  });

  it("reports a valid enum value as in-range, case-insensitively", () => {
    expect(checkParamValue("tpa_mode", "PD").status).toBe("in-range");
    expect(checkParamValue("tpa_mode", "pd").status).toBe("in-range");
  });

  it("reports an unrecognized enum value as invalid-value", () => {
    const result = checkParamValue("tpa_mode", "SOMETHING_ELSE");
    expect(result.status).toBe("invalid-value");
  });

  it("every schema entry's own default value passes its own check", () => {
    for (const spec of firmwareParamSchema) {
      const result = checkParamValue(spec.key, spec.default);
      expect(result.status, `${spec.key} default "${spec.default}" should be in-range`).toBe("in-range");
    }
  });

  it("every schema entry has a real citation", () => {
    expect(FIRMWARE_SCHEMA_SOURCE.url.startsWith("https://")).toBe(true);
    expect(FIRMWARE_SCHEMA_SOURCE.publisher.length).toBeGreaterThan(0);
    expect(FIRMWARE_SCHEMA_VERSION.length).toBeGreaterThan(0);
  });

  it("every schema entry has a unique key", () => {
    const keys = firmwareParamSchema.map((spec) => spec.key.toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
  });
});
