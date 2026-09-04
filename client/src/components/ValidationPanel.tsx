import { StatusBadge } from "@/components/StatusBadge";
import type { validateProfile } from "@/lib/drone";

export function ValidationPanel({ validation, compact = false }: { validation: ReturnType<typeof validateProfile>; compact?: boolean }) {
  const critical = validation.filter((item) => item.level === "critical").length;
  const warnings = validation.filter((item) => item.level === "warning").length;
  return (
    <section className={`validation-panel ${compact ? "validation-panel--compact" : ""}`}>
      <div className="validation-panel__head">
        <div><span className="panel-index">{compact ? "CHECK" : "02"}</span><h2>{compact ? "Validation" : "Input validation"}</h2></div>
        <div className="validation-summary">
          {critical ? <StatusBadge level="critical">{critical} CRITICAL</StatusBadge> : null}
          {warnings ? <StatusBadge level="warning">{warnings} WARNING</StatusBadge> : null}
          {!critical && !warnings ? <StatusBadge level="pass">PASS</StatusBadge> : null}
        </div>
      </div>
      <div className="validation-list">
        {validation.map((item) => (
          <article key={`${item.level}-${item.title}`} className={`validation-item validation-item--${item.level}`}>
            <StatusBadge level={item.level}>{item.level.toUpperCase()}</StatusBadge>
            <div><h3>{item.title}</h3><p>{item.detail}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default ValidationPanel;
