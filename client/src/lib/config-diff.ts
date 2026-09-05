/**
 * Config Diff domain logic.
 *
 * This is a purely structural diff over two blocks of Betaflight/iNav-style
 * CLI text (`set <key> = <value>` lines, plus everything else). It does not
 * know what any parameter means, does not validate values, and does not
 * assert firmware compatibility — it only reports what changed between two
 * texts the user supplied. That keeps it safe to ship without a firmware
 * parameter schema: the "evidence" here is the user's own two CLI dumps,
 * not a claim this app is making about hardware or firmware.
 */

export type ParsedCliLine =
  | { kind: "set"; key: string; value: string; raw: string }
  | { kind: "other"; raw: string };

const SET_LINE = /^set\s+([^\s=]+)\s*=?\s*(.*)$/i;

/**
 * Parse CLI text into structured lines. Recognizes `set <key> = <value>` and
 * `set <key> <value>` (case-insensitive `set`, flexible spacing around `=`).
 * Every other line (comments, blank lines, `save`, `name ...`, etc.) is kept
 * as an "other" line rather than dropped, so nothing supplied is silently
 * discarded — it just isn't treated as a key/value pair.
 *
 * If the same key appears more than once in one text, the last occurrence
 * wins for that text (matches how a firmware CLI would apply sequential
 * `set` commands).
 */
export function parseCliText(text: string): ParsedCliLine[] {
  return text.split(/\r?\n/).map((raw) => {
    const trimmed = raw.trim();
    const match = SET_LINE.exec(trimmed);
    if (match) {
      return { kind: "set", key: match[1], value: match[2].trim(), raw };
    }
    return { kind: "other", raw };
  });
}

function latestSetValues(lines: ParsedCliLine[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of lines) {
    if (line.kind === "set") map.set(line.key.toLowerCase(), line.value);
  }
  return map;
}

export type ConfigDiffEntryStatus = "added" | "removed" | "changed" | "unchanged";
export type ConfigDiffEntry = {
  key: string;
  status: ConfigDiffEntryStatus;
  beforeValue: string | null;
  afterValue: string | null;
};
export type OtherLineDiffEntry = { status: "added" | "removed"; line: string };

export type ConfigDiffResult = {
  /** One entry per distinct `set` key seen in either text, sorted by key. */
  entries: ConfigDiffEntry[];
  /** Non-`set` lines (comments, commands, metadata) present in one text but not the other. Blank lines are ignored. */
  otherLineDiff: OtherLineDiffEntry[];
  summary: { added: number; removed: number; changed: number; unchanged: number };
};

/**
 * Diff two CLI texts. Case in `set` keys is normalized for matching (real
 * firmware CLI keys are conventionally lowercase); values are compared
 * byte-for-byte after trimming, since a value's exact form can matter.
 */
export function diffCliConfigs(beforeText: string, afterText: string): ConfigDiffResult {
  const beforeLines = parseCliText(beforeText);
  const afterLines = parseCliText(afterText);

  const beforeMap = latestSetValues(beforeLines);
  const afterMap = latestSetValues(afterLines);

  const allKeys = Array.from(new Set(Array.from(beforeMap.keys()).concat(Array.from(afterMap.keys())))).sort();
  const entries: ConfigDiffEntry[] = allKeys.map((key) => {
    const hasBefore = beforeMap.has(key);
    const hasAfter = afterMap.has(key);
    const beforeValue = hasBefore ? beforeMap.get(key)! : null;
    const afterValue = hasAfter ? afterMap.get(key)! : null;
    let status: ConfigDiffEntryStatus;
    if (!hasBefore && hasAfter) status = "added";
    else if (hasBefore && !hasAfter) status = "removed";
    else if (beforeValue !== afterValue) status = "changed";
    else status = "unchanged";
    return { key, status, beforeValue, afterValue };
  });

  const beforeOther = new Set(beforeLines.filter((line) => line.kind === "other" && line.raw.trim()).map((line) => line.raw.trim()));
  const afterOther = new Set(afterLines.filter((line) => line.kind === "other" && line.raw.trim()).map((line) => line.raw.trim()));
  const otherLineDiff: OtherLineDiffEntry[] = [];
  Array.from(afterOther).forEach((line) => { if (!beforeOther.has(line)) otherLineDiff.push({ status: "added", line }); });
  Array.from(beforeOther).forEach((line) => { if (!afterOther.has(line)) otherLineDiff.push({ status: "removed", line }); });

  const summary = {
    added: entries.filter((entry) => entry.status === "added").length,
    removed: entries.filter((entry) => entry.status === "removed").length,
    changed: entries.filter((entry) => entry.status === "changed").length,
    unchanged: entries.filter((entry) => entry.status === "unchanged").length,
  };

  return { entries, otherLineDiff, summary };
}

export function hasAnyDiff(result: ConfigDiffResult): boolean {
  return result.summary.added + result.summary.removed + result.summary.changed > 0 || result.otherLineDiff.length > 0;
}
