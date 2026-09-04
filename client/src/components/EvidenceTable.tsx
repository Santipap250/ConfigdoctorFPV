/** Flight Deck Atelier component: motor/prop evidence with mandatory, checkable citations. */
import { useMemo, useState } from "react";
import { ExternalLink, FlaskConical, Gauge, ShieldAlert, Wrench } from "lucide-react";
import {
  distinctManufacturers,
  filterEvidence,
  provenanceBadge,
  provenanceLabel,
  type EvidenceProvenance,
  type HardwareEvidence,
} from "@/lib/evidence";
import { seedEvidence } from "@/lib/evidence-data";
import { StatusBadge } from "./StatusBadge";

const provenanceToLevel: Record<EvidenceProvenance, "pass" | "warning" | "neutral"> = {
  measured: "pass",
  reference: "neutral",
  estimated: "warning",
};

function specSummary(entry: HardwareEvidence): string {
  if (entry.kind === "motor") {
    const parts = [`${entry.kv} KV`];
    if (entry.statorSize) parts.push(entry.statorSize);
    if (entry.weightG) parts.push(`${entry.weightG} g`);
    return parts.join(" · ");
  }
  const parts = [`${entry.diameterInch}" × ${entry.pitchInch}"`, `${entry.blades}-blade`];
  if (entry.weightG) parts.push(`${entry.weightG} g`);
  return parts.join(" · ");
}

export function EvidenceTable() {
  const [kind, setKind] = useState<"all" | "motor" | "prop">("all");
  const [provenance, setProvenance] = useState<"all" | EvidenceProvenance>("all");
  const [manufacturer, setManufacturer] = useState("all");
  const [query, setQuery] = useState("");

  const manufacturers = useMemo(() => distinctManufacturers(seedEvidence), []);
  const results = useMemo(
    () =>
      filterEvidence(seedEvidence, {
        kind: kind === "all" ? undefined : kind,
        provenance: provenance === "all" ? undefined : provenance,
        manufacturer: manufacturer === "all" ? undefined : manufacturer,
        query,
      }),
    [kind, provenance, manufacturer, query],
  );

  return (
    <section className="evidence-table" id="evidence-tables" aria-labelledby="evidence-table-title">
      <header className="evidence-table__head">
        <div>
          <div className="eyebrow"><i /> ANALYSIS / MOTOR &amp; PROP EVIDENCE</div>
          <h2 id="evidence-table-title">Hardware data with a <em>checkable source.</em></h2>
          <p>Every row cites where its numbers came from. Entries without a verifiable source are never shown here — missing evidence is left out, not guessed.</p>
        </div>
        <div className="evidence-table__badge"><ShieldAlert size={15} /> {seedEvidence.length} CITED ENTR{seedEvidence.length === 1 ? "Y" : "IES"}</div>
      </header>

      <div className="evidence-filters">
        <label className="evidence-filter"><span>TYPE</span>
          <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)} aria-label="Filter by hardware type">
            <option value="all">All types</option>
            <option value="motor">Motors</option>
            <option value="prop">Propellers</option>
          </select>
        </label>
        <label className="evidence-filter"><span>PROVENANCE</span>
          <select value={provenance} onChange={(event) => setProvenance(event.target.value as typeof provenance)} aria-label="Filter by evidence provenance">
            <option value="all">All provenance</option>
            <option value="measured">Measured</option>
            <option value="reference">Reference</option>
            <option value="estimated">Estimated</option>
          </select>
        </label>
        <label className="evidence-filter"><span>MANUFACTURER</span>
          <select value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} aria-label="Filter by manufacturer">
            <option value="all">All manufacturers</option>
            {manufacturers.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <label className="evidence-filter evidence-filter--search"><span>SEARCH</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search manufacturer, model, version" aria-label="Search evidence entries" />
        </label>
      </div>

      {results.length === 0 ? (
        <div className="evidence-empty"><FlaskConical size={18} /><div><strong>No cited entries match this filter.</strong><p>Rather than estimate a value here, this table stays empty until a checkable source is added.</p></div></div>
      ) : (
        <div className="evidence-rows" role="table" aria-label="Motor and propeller evidence">
          {results.map((entry) => (
            <article className="evidence-row" role="row" key={entry.id}>
              <div className="evidence-row__icon" aria-hidden="true">{entry.kind === "motor" ? <Wrench size={16} /> : <Gauge size={16} />}</div>
              <div className="evidence-row__main">
                <div className="evidence-row__title"><strong>{entry.manufacturer} {entry.model}</strong>{entry.version ? <small>{entry.version}</small> : null}</div>
                <p>{specSummary(entry)}</p>
              </div>
              <div className="evidence-row__provenance">
                <StatusBadge level={provenanceToLevel[entry.provenance]}>{provenanceBadge(entry.provenance)}</StatusBadge>
                <small>{provenanceLabel(entry.provenance)}</small>
              </div>
              <div className="evidence-row__source">
                <a href={entry.source.url} target="_blank" rel="noreferrer noopener">
                  VERIFY SOURCE <ExternalLink size={12} />
                </a>
                <small>{entry.source.publisher} · checked {entry.source.retrievedDate}</small>
              </div>
            </article>
          ))}
        </div>
      )}
      <p className="evidence-disclaimer">Reference entries reflect a manufacturer's published specification, not an independent bench measurement — variance between an individual unit and its spec sheet is expected. This table does not certify component compatibility or airworthiness.</p>
    </section>
  );
}

export default EvidenceTable;
