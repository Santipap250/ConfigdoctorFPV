/** Flight Deck Atelier component: status is communicated with semantic colour and plain language. */
import type { ValidationLevel } from "@/lib/drone";

export function StatusBadge({ level, children }: { level: ValidationLevel | "neutral"; children: React.ReactNode }) {
  return <span className={`status-badge status-badge--${level}`}><span className="status-badge__dot" />{children}</span>;
}
