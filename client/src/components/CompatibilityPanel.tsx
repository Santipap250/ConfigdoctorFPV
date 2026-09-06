import { ExternalLink, Link2, ShieldCheck } from "lucide-react";
import { assessCompatibility, type CompatibilityAssessment } from "@/lib/compatibility";
import type { DroneProfile } from "@/lib/drone";
import { seedEvidence } from "@/lib/evidence-data";
import { StatusBadge } from "./StatusBadge";

function badgeLevel(level: CompatibilityAssessment["overall"]): "pass" | "warning" | "critical" {
  return level;
}

export function CompatibilityPanel({ profile }: { profile: DroneProfile }) {
  const assessment = assessCompatibility(profile, seedEvidence);

  return (
    <section className="compatibility-panel" id="compatibility-engine" aria-labelledby="compatibility-title">
      <header className="compatibility-panel__head">
        <div>
          <div className="eyebrow"><i /> ANALYSIS / EVIDENCE-BASED COMPATIBILITY</div>
          <h2 id="compatibility-title">Compatibility with <em>documented evidence.</em></h2>
          <p>OBIX evaluates only explicit manufacturer claims attached to the selected evidence records. It does not infer compatibility from popularity, averages, or missing data.</p>
        </div>
        <StatusBadge level={badgeLevel(assessment.overall)}>{assessment.summary}</StatusBadge>
      </header>

      <div className="compatibility-panel__meta">
        <span><Link2 size={14} /> {assessment.checks.filter((check) => check.level === "pass").length} verified checks</span>
        <span><ShieldCheck size={14} /> source-linked only</span>
      </div>

      <div className="compatibility-checks" role="list" aria-label="Compatibility checks">
        {assessment.checks.map((check) => (
          <article className={`compatibility-check compatibility-check--${check.level}`} role="listitem" key={check.id}>
            <i aria-hidden="true" />
            <div>
              <strong>{check.label}</strong>
              <small>{check.status}</small>
              <p>{check.detail}</p>
              {check.sourceUrl ? <a href={check.sourceUrl} target="_blank" rel="noreferrer noopener">VERIFY SOURCE <ExternalLink size={11} /></a> : null}
            </div>
          </article>
        ))}
      </div>

      <p className="compatibility-panel__disclaimer">This is an evidence match report, not an airworthiness certification. A VERIFIED MATCH means the entered profile agrees with the specific documented claims currently stored in OBIX; other electrical, mechanical, thermal, firmware, installation, and operating factors may still require separate verification.</p>
    </section>
  );
}

export default CompatibilityPanel;
