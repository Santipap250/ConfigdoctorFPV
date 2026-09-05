import { ChevronRight, Search, type LucideIcon } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { FlightToolkit } from "@/components/FlightToolkit";
import { MissionReadinessGuide } from "@/components/MissionReadinessGuide";
import { EvidenceTable } from "@/components/EvidenceTable";
import type { calculateMetrics, DroneProfile } from "@/lib/drone";

export type ToolEntry = { name: string; detail: string; active: boolean; icon: LucideIcon };
export type ToolGroup = { group: string; tools: ToolEntry[] };

export function ToolCenter({ groups, onOpen, profile, metrics }: { groups: ToolGroup[]; onOpen: (active: boolean, name: string) => void; profile: DroneProfile; metrics: ReturnType<typeof calculateMetrics> }) {
  return (
    <div className="tools-page page-enter">
      <header className="mission-header">
        <div>
          <div className="eyebrow"><i />SYSTEM / TOOL CENTER</div>
          <h1>Tools with a <em>clear scope.</em></h1>
          <p>Start with Mission Readiness: a conservative field decision combining power, sag, thrust evidence, and pre-flight checks. Then go deeper with focused utilities for the signals behind the score.</p>
        </div>
        <div className="tool-search"><Search size={17} /><input aria-label="Search tools" placeholder="Search tools" /></div>
      </header>
      <FlightToolkit profile={profile} voltageNominal={metrics.voltageNominal} batteryContinuousA={metrics.batteryContinuousA} />
      <EvidenceTable />
      <MissionReadinessGuide />
      <div className="tool-groups">
        {groups.map((section) => (
          <section key={section.group} className="tool-group">
            <div className="tool-group__head"><span>{section.group}</span><i /></div>
            <div className="tool-grid">
              {section.tools.map(({ name, detail, active, icon: Icon }) => (
                <button className={`tool-card ${active ? "tool-card--active" : ""}`} onClick={() => onOpen(active, name)} key={name}>
                  <span className="tool-card__icon"><Icon size={20} /></span>
                  <div><h2>{name}</h2><p>{detail}</p></div>
                  {active ? <StatusBadge level="pass">AVAILABLE</StatusBadge> : <StatusBadge level="neutral">PLANNED</StatusBadge>}
                  <ChevronRight className="tool-card__arrow" size={18} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

export default ToolCenter;
