import { describe, expect, it } from "vitest";
import { diffCliConfigs, hasAnyDiff, parseCliText } from "./config-diff";

describe("parseCliText", () => {
  it("parses 'set key = value' lines", () => {
    const [line] = parseCliText("set gyro_lpf1_static_hz = 500");
    expect(line).toEqual({ kind: "set", key: "gyro_lpf1_static_hz", value: "500", raw: "set gyro_lpf1_static_hz = 500" });
  });

  it("parses 'set key value' lines (no equals sign)", () => {
    const [line] = parseCliText("set gyro_lpf1_static_hz 500");
    expect(line).toMatchObject({ kind: "set", key: "gyro_lpf1_static_hz", value: "500" });
  });

  it("is case-insensitive on the 'set' keyword", () => {
    const [line] = parseCliText("SET gyro_lpf1_static_hz = 500");
    expect(line.kind).toBe("set");
  });

  it("tolerates irregular spacing around the equals sign", () => {
    const [line] = parseCliText("set   dterm_lpf1_static_hz=150");
    expect(line).toMatchObject({ kind: "set", key: "dterm_lpf1_static_hz", value: "150" });
  });

  it("treats comments, blank lines, and non-set commands as 'other'", () => {
    const lines = parseCliText("# a comment\n\nsave\nname MyQuad");
    expect(lines.map((line) => line.kind)).toEqual(["other", "other", "other", "other"]);
  });

  it("keeps the raw text of every line, including ones it doesn't parse as set", () => {
    const [line] = parseCliText("# hello world");
    expect(line.raw).toBe("# hello world");
  });
});

describe("diffCliConfigs", () => {
  it("reports no differences for identical texts", () => {
    const text = "set gyro_lpf1_static_hz = 500\nset dterm_lpf1_static_hz = 150";
    const result = diffCliConfigs(text, text);
    expect(result.summary).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 2 });
    expect(result.otherLineDiff).toEqual([]);
    expect(hasAnyDiff(result)).toBe(false);
  });

  it("detects an added key", () => {
    const before = "set gyro_lpf1_static_hz = 500";
    const after = "set gyro_lpf1_static_hz = 500\nset dterm_lpf1_static_hz = 150";
    const result = diffCliConfigs(before, after);
    expect(result.summary).toEqual({ added: 1, removed: 0, changed: 0, unchanged: 1 });
    const added = result.entries.find((entry) => entry.key === "dterm_lpf1_static_hz");
    expect(added).toEqual({ key: "dterm_lpf1_static_hz", status: "added", beforeValue: null, afterValue: "150" });
  });

  it("detects a removed key", () => {
    const before = "set gyro_lpf1_static_hz = 500\nset dterm_lpf1_static_hz = 150";
    const after = "set gyro_lpf1_static_hz = 500";
    const result = diffCliConfigs(before, after);
    expect(result.summary).toEqual({ added: 0, removed: 1, changed: 0, unchanged: 1 });
    const removed = result.entries.find((entry) => entry.key === "dterm_lpf1_static_hz");
    expect(removed).toEqual({ key: "dterm_lpf1_static_hz", status: "removed", beforeValue: "150", afterValue: null });
  });

  it("detects a changed value", () => {
    const before = "set gyro_lpf1_static_hz = 500";
    const after = "set gyro_lpf1_static_hz = 350";
    const result = diffCliConfigs(before, after);
    expect(result.summary).toEqual({ added: 0, removed: 0, changed: 1, unchanged: 0 });
    expect(result.entries[0]).toEqual({ key: "gyro_lpf1_static_hz", status: "changed", beforeValue: "500", afterValue: "350" });
  });

  it("last occurrence of a duplicated key wins within one text", () => {
    const before = "set gyro_lpf1_static_hz = 500\nset gyro_lpf1_static_hz = 600";
    const after = "set gyro_lpf1_static_hz = 600";
    const result = diffCliConfigs(before, after);
    expect(result.summary.unchanged).toBe(1);
    expect(result.summary.changed).toBe(0);
  });

  it("normalizes key case for matching", () => {
    const before = "set Gyro_Lpf1_Static_Hz = 500";
    const after = "set gyro_lpf1_static_hz = 500";
    const result = diffCliConfigs(before, after);
    expect(result.summary).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 1 });
  });

  it("diffs non-set lines (comments/commands) separately from set keys", () => {
    const before = "# build v1\nsave";
    const after = "# build v2\nsave";
    const result = diffCliConfigs(before, after);
    expect(result.otherLineDiff).toEqual(
      expect.arrayContaining([
        { status: "removed", line: "# build v1" },
        { status: "added", line: "# build v2" },
      ]),
    );
  });

  it("ignores blank lines in the other-line diff", () => {
    const result = diffCliConfigs("save\n\n\n", "save\n\n");
    expect(result.otherLineDiff).toEqual([]);
  });

  it("handles two empty texts", () => {
    const result = diffCliConfigs("", "");
    expect(result.summary).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 0 });
    expect(hasAnyDiff(result)).toBe(false);
  });

  it("handles one empty text against a populated one", () => {
    const result = diffCliConfigs("", "set gyro_lpf1_static_hz = 500");
    expect(result.summary).toEqual({ added: 1, removed: 0, changed: 0, unchanged: 0 });
    expect(hasAnyDiff(result)).toBe(true);
  });
});
