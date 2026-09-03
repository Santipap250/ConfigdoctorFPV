/** Flight Deck Atelier component: visualizes only values derived from the active profile inputs. */
export function TelemetryChart({ currentA, voltageV }: { currentA: number; voltageV: number }) {
  const current = Math.max(0, Math.min(currentA || 0, 180));
  const voltage = Math.max(0, Math.min(voltageV || 0, 50));
  const currentPath = `M 0 84 C 28 ${84 - current * 0.18} 55 ${90 - current * 0.24} 80 ${74 - current * 0.21} S 142 ${84 - current * 0.17} 180 ${62 - current * 0.14}`;
  const voltagePath = `M 0 26 C 40 ${32 + (50 - voltage) * 0.4} 72 ${20 + (50 - voltage) * 0.5} 108 ${38 + (50 - voltage) * 0.34} S 152 ${48 + (50 - voltage) * 0.28} 180 ${38 + (50 - voltage) * 0.35}`;
  return (
    <div className="telemetry-chart" aria-label="Profile-derived voltage and current visualization">
      <div className="telemetry-chart__legend"><span><i className="legend-dot legend-dot--lime" />Peak current reference</span><span><i className="legend-dot legend-dot--cyan" />Nominal voltage reference</span></div>
      <svg viewBox="0 0 180 100" preserveAspectRatio="none" role="img" aria-label="Current and voltage curves derived from profile values">
        <path d="M0 20H180M0 50H180M0 80H180M30 0V100M60 0V100M90 0V100M120 0V100M150 0V100" className="telemetry-chart__grid" />
        <path d={voltagePath} className="telemetry-chart__line telemetry-chart__line--cyan" />
        <path d={currentPath} className="telemetry-chart__line telemetry-chart__line--lime" />
      </svg>
      <p>Visual relation only — not a flight log or predicted discharge curve.</p>
    </div>
  );
}
