/** Flight Deck Atelier component: compact instrument readout with explicit units and provenance. */
import type { LucideIcon } from "lucide-react";
import { AnimatedNumber } from "./AnimatedNumber";

export function MetricCard({ icon: Icon, label, value, unit, note, accent = false }: { icon: LucideIcon; label: string; value: string; unit?: string; note: string; accent?: boolean }) {
  return (
    <article className={`metric-card ${accent ? "metric-card--accent" : ""}`}>
      <div className="metric-card__head"><span>{label}</span><Icon size={15} aria-hidden="true" /></div>
      <div className="metric-card__value"><AnimatedNumber value={value} /><small>{unit}</small></div>
      <p>{note}</p>
    </article>
  );
}
