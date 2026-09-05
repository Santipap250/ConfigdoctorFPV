/** Flight Deck Atelier component: structural, evidence-free CLI text diff. Compares two blocks of CLI text the user supplies; it does not interpret what any parameter means. */
import { useMemo, useState } from "react";
import { ArrowLeftRight, Copy, FileWarning, GitCompare } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { diffCliConfigs, hasAnyDiff, type ConfigDiffEntryStatus } from "@/lib/config-diff";

const statusToLevel: Record<ConfigDiffEntryStatus, "pass" | "warning" | "critical" | "neutral"> = {
  added: "pass",
  removed: "critical",
  changed: "warning",
  unchanged: "neutral",
};

const statusLabel: Record<ConfigDiffEntryStatus, string> = {
  added: "ADDED",
  removed: "REMOVED",
  changed: "CHANGED",
  unchanged: "UNCHANGED",
};

export function ConfigDiffTool({ currentDraft }: { currentDraft: string }) {
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");
  const [showUnchanged, setShowUnchanged] = useState(false);

  const result = useMemo(() => diffCliConfigs(before, after), [before, after]);
  const visibleEntries = useMemo(() => (showUnchanged ? result.entries : result.entries.filter((entry) => entry.status !== "unchanged")), [result, showUnchanged]);
  const diffed = hasAnyDiff(result);

  const copySummary = async () => {
    const lines = result.entries
      .filter((entry) => entry.status !== "unchanged")
      .map((entry) => `${statusLabel[entry.status]}: ${entry.key} ${entry.beforeValue ?? "—"} -> ${entry.afterValue ?? "—"}`);
    const text = lines.length ? lines.join("\n") : "No differences.";
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard unavailable; ignore */ }
  };

  return (
    <section className="config-diff" id="config-diff-tool" aria-labelledby="config-diff-title">
      <header className="config-diff__head">
        <div>
          <div className="eyebrow"><i />CONFIG / DIFF TOOL</div>
          <h2 id="config-diff-title">Compare two CLI drafts.</h2>
          <p>Paste two blocks of CLI text — your own flight-controller dumps, or drafts exported from this app — to see exactly what changed. This is a structural line diff only: it does not know what any parameter does and does not validate values.</p>
        </div>
        {diffed ? <StatusBadge level="warning">{result.summary.added + result.summary.removed + result.summary.changed} DIFFERENCE{result.summary.added + result.summary.removed + result.summary.changed === 1 ? "" : "S"}</StatusBadge> : <StatusBadge level="pass">NO DIFFERENCE</StatusBadge>}
      </header>

      <div className="config-diff__panes">
        <div className="config-diff__pane">
          <div className="config-diff__pane-head"><span>BEFORE</span><button type="button" className="text-action" onClick={() => setBefore(currentDraft)}>USE CURRENT DRAFT</button></div>
          <textarea aria-label="Before CLI text" spellCheck={false} placeholder="Paste an earlier CLI dump or draft here" value={before} onChange={(event) => setBefore(event.target.value)} />
        </div>
        <button type="button" className="config-diff__swap" aria-label="Swap before and after" onClick={() => { setBefore(after); setAfter(before); }}><ArrowLeftRight size={16} /></button>
        <div className="config-diff__pane">
          <div className="config-diff__pane-head"><span>AFTER</span><button type="button" className="text-action" onClick={() => setAfter(currentDraft)}>USE CURRENT DRAFT</button></div>
          <textarea aria-label="After CLI text" spellCheck={false} placeholder="Paste the newer CLI dump or draft here" value={after} onChange={(event) => setAfter(event.target.value)} />
        </div>
      </div>

      {!before && !after ? (
        <div className="config-diff__empty"><GitCompare size={18} /><div><strong>Paste CLI text on both sides to compare.</strong><p>Nothing is diffed until both fields have content — this tool never guesses at a baseline.</p></div></div>
      ) : (
        <>
          <div className="config-diff__toolbar">
            <div className="config-diff__summary">
              <StatusBadge level="pass">{result.summary.added} ADDED</StatusBadge>
              <StatusBadge level="critical">{result.summary.removed} REMOVED</StatusBadge>
              <StatusBadge level="warning">{result.summary.changed} CHANGED</StatusBadge>
              <StatusBadge level="neutral">{result.summary.unchanged} UNCHANGED</StatusBadge>
            </div>
            <div className="config-diff__actions">
              <label className="config-diff__toggle"><input type="checkbox" checked={showUnchanged} onChange={(event) => setShowUnchanged(event.target.checked)} /> Show unchanged</label>
              <button type="button" className="console-action" onClick={copySummary}><Copy size={14} />COPY DIFF</button>
            </div>
          </div>

          {visibleEntries.length === 0 && result.otherLineDiff.length === 0 ? (
            <div className="config-diff__empty"><GitCompare size={18} /><div><strong>No differences found.</strong><p>Every `set` key matches between the two texts.</p></div></div>
          ) : (
            <div className="config-diff__rows" role="table" aria-label="Config parameter differences">
              {visibleEntries.map((entry) => (
                <article className={`config-diff__row config-diff__row--${entry.status}`} role="row" key={entry.key}>
                  <StatusBadge level={statusToLevel[entry.status]}>{statusLabel[entry.status]}</StatusBadge>
                  <code className="config-diff__key">{entry.key}</code>
                  <div className="config-diff__values">
                    <span className="config-diff__before">{entry.beforeValue ?? "—"}</span>
                    <ArrowLeftRight size={13} />
                    <span className="config-diff__after">{entry.afterValue ?? "—"}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          {result.otherLineDiff.length > 0 ? (
            <div className="config-diff__other">
              <div className="panel-label"><FileWarning size={14} /> OTHER LINE CHANGES (comments / commands)</div>
              {result.otherLineDiff.map((entry, index) => (
                <p key={`${entry.status}-${index}`} className={`config-diff__other-line config-diff__other-line--${entry.status}`}>
                  <StatusBadge level={entry.status === "added" ? "pass" : "critical"}>{entry.status === "added" ? "ADDED" : "REMOVED"}</StatusBadge>
                  <code>{entry.line}</code>
                </p>
              ))}
            </div>
          ) : null}
        </>
      )}
      <p className="evidence-disclaimer">This tool compares text only. It does not know what any parameter does, does not validate values or ranges, and is not a substitute for reviewing changes against your firmware's own documentation before applying them.</p>
    </section>
  );
}

export default ConfigDiffTool;
