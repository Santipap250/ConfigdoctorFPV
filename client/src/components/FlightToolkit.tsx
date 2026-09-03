import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, BatteryCharging, CheckCircle2, ClipboardCheck, Gauge, GitCompare, Power, ShieldCheck, Target, TriangleAlert, Zap } from "lucide-react";
import { batteryPlanner, batterySag, diffConfigText, missionReadiness, powerBudget, preflightItems, thrustBudget } from "@/lib/flight-toolkit";
import type { DroneProfile } from "@/lib/drone";

const num = (value: string) => Number(value) || 0;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type Props = { profile: DroneProfile; voltageNominal: number; batteryContinuousA: number };

type Tab = "readiness" | "power" | "sag" | "thrust" | "preflight" | "diff";

export function FlightToolkit({ profile, voltageNominal, batteryContinuousA }: Props) {
  const [tab, setTab] = useState<Tab>("readiness");
  return (
    <section className="flight-toolkit">
      <header className="flight-toolkit__head">
        <div>
          <div className="eyebrow"><i /> OBIX / FLIGHT TOOLKIT</div>
          <h2>High-value tools for <em>real flight prep.</em></h2>
          <p>Five deterministic utilities built around the active profile. They calculate from your inputs; they do not certify a build or invent missing test data.</p>
        </div>
        <div className="flight-toolkit__badge"><Zap size={15} /> LOCAL / NO ACCOUNT</div>
      </header>
      <nav className="toolkit-tabs" aria-label="Flight toolkit">
        <TabButton active={tab === "readiness"} icon={<Target size={16} />} label="MISSION READINESS" onClick={() => setTab("readiness")} />
        <TabButton active={tab === "power"} icon={<Power size={16} />} label="POWER BUDGET" onClick={() => setTab("power")} />
        <TabButton active={tab === "sag"} icon={<BatteryCharging size={16} />} label="SAG CHECK" onClick={() => setTab("sag")} />
        <TabButton active={tab === "thrust"} icon={<Gauge size={16} />} label="THRUST MARGIN" onClick={() => setTab("thrust")} />
        <TabButton active={tab === "preflight"} icon={<ClipboardCheck size={16} />} label="PRE-FLIGHT" onClick={() => setTab("preflight")} />
        <TabButton active={tab === "diff"} icon={<GitCompare size={16} />} label="CONFIG DIFF" onClick={() => setTab("diff")} />
      </nav>
      <div className="toolkit-panel">
        {tab === "readiness" && <MissionReadinessTool profile={profile} voltageNominal={voltageNominal} batteryContinuousA={batteryContinuousA} />}
        {tab === "power" && <PowerTool profile={profile} voltageNominal={voltageNominal} batteryContinuousA={batteryContinuousA} />}
        {tab === "sag" && <SagTool profile={profile} />}
        {tab === "thrust" && <ThrustTool profile={profile} />}
        {tab === "preflight" && <PreflightTool />}
        {tab === "diff" && <DiffTool />}
      </div>
    </section>
  );
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button className={`toolkit-tab ${active ? "is-active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function MissionReadinessTool({ profile, voltageNominal, batteryContinuousA }: Props) {
  const [resistance, setResistance] = useState(18);
  const [thrust, setThrust] = useState(profile.measuredThrustPerMotorG);
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("obix-preflight") || "{}"); } catch { return {}; }
  });
  const checksComplete = preflightItems.filter((item) => checked[item.id]).length;
  const result = missionReadiness({ voltageNominal, batteryContinuousA, averageCurrentA: profile.estimatedAverageCurrentA, peakCurrentA: profile.expectedPeakCurrentA, packResistanceMilliOhm: resistance, thrustPerMotorG: thrust, motorCount: 4, weightG: profile.weightG, checksComplete, checksTotal: preflightItems.length });
  const tone = result.score >= 85 ? "good" : result.score >= 60 ? "warn" : "bad";
  return <div className="readiness-tool">
    <div className="readiness-hero">
      <div><span className="panel-label">FLAGSHIP / FIELD DECISION</span><strong>{result.verdict}</strong><p>One conservative score from electrical headroom, measured sag, thrust evidence, and your persistent pre-flight checklist.</p></div>
      <div className={`readiness-score ${tone}`}><b>{result.score}</b><small>/100</small></div>
    </div>
    <div className="readiness-grid">
      <div className="readiness-inputs"><div className="panel-label">LIVE SIGNAL INPUTS</div><NumberField label="Pack resistance" value={resistance} unit="mΩ" onChange={setResistance} /><NumberField label="Static thrust / motor" value={thrust} unit="g" onChange={setThrust} /><div className="readiness-hint"><ShieldCheck size={15} /> Inputs stay local and missing thrust data never gets guessed.</div></div>
      <div className="readiness-breakdown"><div className="panel-label">READINESS BREAKDOWN</div><ReadinessBar label="Power headroom" value={result.factors.power} max={25} detail={`${result.power.continuousHeadroomA.toFixed(1)} A`} /><ReadinessBar label="Voltage sag" value={result.factors.sag} max={20} detail={`${result.sag.sagV.toFixed(2)} V`} /><ReadinessBar label="Thrust evidence" value={result.factors.thrust} max={25} detail={result.thrust.ratio === null ? "not supplied" : `${result.thrust.ratio.toFixed(2)} : 1`} /><ReadinessBar label="Field checklist" value={result.factors.checklist} max={30} detail={`${checksComplete}/${preflightItems.length}`} /></div>
    </div>
    <div className="readiness-footer"><span><Target size={15} /> Conservative by design</span><small>Green means the inputs are ready for a field check — not a certification of airworthiness.</small><button onClick={() => setChecked(Object.fromEntries(preflightItems.map((item) => [item.id, true])))}>Mark checklist complete <ArrowRight size={13} /></button></div>
  </div>;
}

function ReadinessBar({ label, value, max, detail }: { label: string; value: number; max: number; detail: string }) {
  return <div className="readiness-bar"><div><span>{label}</span><b>{detail}</b></div><div className="readiness-track"><i style={{ width: `${Math.round((value / max) * 100)}%` }} /></div></div>;
}

function PowerTool({ profile, voltageNominal, batteryContinuousA }: Props) {
  const [avg, setAvg] = useState(profile.estimatedAverageCurrentA);
  const [peak, setPeak] = useState(profile.expectedPeakCurrentA);
  const result = useMemo(() => powerBudget(voltageNominal, avg, peak, batteryContinuousA), [voltageNominal, avg, peak, batteryContinuousA]);
  return <ToolGrid>
    <ToolInputs title="Power envelope">
      <NumberField label="Average current" value={avg} unit="A" onChange={setAvg} />
      <NumberField label="Peak current" value={peak} unit="A" onChange={setPeak} />
      <NumberField label="Pack voltage" value={voltageNominal} unit="V" onChange={() => undefined} readOnly />
      <NumberField label="Battery continuous" value={batteryContinuousA} unit="A" onChange={() => undefined} readOnly />
    </ToolInputs>
    <ResultCard title="Load picture" icon={<Power size={17} />}>
      <Metric label="Average power" value={`${result.averagePowerW.toFixed(0)} W`} />
      <Metric label="Peak power" value={`${result.peakPowerW.toFixed(0)} W`} />
      <Metric label="Peak battery load" value={result.continuousLoadPercent === null ? "—" : `${result.continuousLoadPercent.toFixed(0)}%`} />
      <Metric label="Current headroom" value={`${result.continuousHeadroomA.toFixed(1)} A`} state={result.continuousHeadroomA < 0 ? "bad" : "good"} />
      <div className={`tool-callout ${result.continuousHeadroomA < 0 ? "bad" : "good"}`}><span>{result.continuousHeadroomA < 0 ? <TriangleAlert size={16} /> : <CheckCircle2 size={16} />}</span><div><strong>{result.continuousHeadroomA < 0 ? "Peak exceeds entered battery capability" : "Peak is inside entered battery capability"}</strong><small>This compares your entered peak current to capacity × C only. It is not a pack certification.</small></div></div>
    </ResultCard>
  </ToolGrid>;
}

function SagTool({ profile }: { profile: DroneProfile }) {
  const [peak, setPeak] = useState(profile.expectedPeakCurrentA);
  const [resistance, setResistance] = useState(18);
  const result = batterySag({ peakCurrentA: peak, packResistanceMilliOhm: resistance });
  return <ToolGrid>
    <ToolInputs title="Battery sag model">
      <NumberField label="Test current" value={peak} unit="A" onChange={setPeak} />
      <NumberField label="Pack resistance" value={resistance} unit="mΩ" onChange={setResistance} />
      <div className="input-help">Enter a measured pack resistance when possible. Do not treat a generic number as a real battery measurement.</div>
    </ToolInputs>
    <ResultCard title="Voltage sag" icon={<BatteryCharging size={17} />}>
      <div className="hero-result"><small>ESTIMATED SAG</small><strong>{result.sagV.toFixed(2)} V</strong><span>at {peak.toFixed(0)} A with {resistance.toFixed(1)} mΩ pack resistance</span></div>
      <div className="tool-callout"><span><ShieldCheck size={16} /></span><div><strong>Resistance matters more than the sticker</strong><small>Use a repeatable measurement method and compare packs under similar conditions.</small></div></div>
    </ResultCard>
  </ToolGrid>;
}

function ThrustTool({ profile }: { profile: DroneProfile }) {
  const [thrust, setThrust] = useState(profile.measuredThrustPerMotorG);
  const [motors, setMotors] = useState(4);
  const result = thrustBudget({ thrustPerMotorG: thrust, motorCount: motors, weightG: profile.weightG });
  return <ToolGrid>
    <ToolInputs title="Measured thrust">
      <NumberField label="Static thrust / motor" value={thrust} unit="g" onChange={setThrust} />
      <NumberField label="Motor count" value={motors} unit="motors" onChange={setMotors} />
      <NumberField label="All-up weight" value={profile.weightG} unit="g" onChange={() => undefined} readOnly />
    </ToolInputs>
    <ResultCard title="Thrust margin" icon={<Gauge size={17} />}>
      <Metric label="Total static thrust" value={`${result.totalThrustG.toFixed(0)} g`} />
      <Metric label="Thrust / weight" value={result.ratio === null ? "—" : `${result.ratio.toFixed(2)} : 1`} state={result.ratio !== null && result.ratio < 2 ? "warn" : "good"} />
      <Metric label="Excess static thrust" value={`${result.excessThrustG.toFixed(0)} g`} state={result.excessThrustG < 0 ? "bad" : "good"} />
      <Metric label="Theoretical hover point" value={result.theoreticalHoverPercent === null ? "—" : `${clamp(result.theoreticalHoverPercent, 0, 999).toFixed(0)}%`} />
      <div className="tool-callout"><span><Gauge size={16} /></span><div><strong>Use measured data, not guessed thrust</strong><small>Static bench thrust is not the same as real-flight performance. Check this against your actual test method.</small></div></div>
    </ResultCard>
  </ToolGrid>;
}

function PreflightTool() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("obix-preflight") || "{}"); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem("obix-preflight", JSON.stringify(checked)); }, [checked]);
  const done = preflightItems.filter((item) => checked[item.id]).length;
  const ready = done === preflightItems.length;
  return <div className="preflight-tool">
    <div className="preflight-score"><div><span>FIELD CHECK</span><strong>{done} / {preflightItems.length}</strong><small>{ready ? "All listed checks marked complete" : "Complete the checks before launch"}</small></div><div className={`preflight-ring ${ready ? "ready" : ""}`} style={{ "--progress": `${(done / preflightItems.length) * 360}deg` } as CSSProperties}><b>{Math.round((done / preflightItems.length) * 100)}%</b></div></div>
    <div className="preflight-list">{preflightItems.map((item, index) => <button key={item.id} className={`preflight-item ${checked[item.id] ? "is-done" : ""}`} onClick={() => setChecked((value) => ({ ...value, [item.id]: !value[item.id] }))}><span className="preflight-index">{String(index + 1).padStart(2, "0")}</span><span className="preflight-check">{checked[item.id] ? <CheckCircle2 size={18} /> : <span />}</span><div><strong>{item.label}</strong><small>{item.hint}</small></div></button>)}</div>
    <button className="tool-reset" onClick={() => setChecked({})}>RESET FIELD CHECK</button>
  </div>;
}

function DiffTool() {
  const [left, setLeft] = useState("# Known-good config\nset gyro_lpf1_static_hz = 0\nset dterm_lpf1_static_hz = 120\nset anti_gravity_gain = 80\nsave");
  const [right, setRight] = useState("# New config\nset gyro_lpf1_static_hz = 150\nset dterm_lpf1_static_hz = 120\nset anti_gravity_gain = 90\nsave");
  const result = useMemo(() => diffConfigText(left, right), [left, right]);
  return <div className="diff-tool">
    <div className="diff-editors"><label><span>REFERENCE CONFIG</span><textarea value={left} onChange={(e) => setLeft(e.target.value)} /></label><label><span>CANDIDATE CONFIG</span><textarea value={right} onChange={(e) => setRight(e.target.value)} /></label></div>
    <div className="diff-head"><div><span>LINE COMPARISON</span><strong>{result.changed} changed line{result.changed === 1 ? "" : "s"}</strong></div><small>Simple line-by-line comparison for quick inspection; it does not parse firmware semantics.</small></div>
    <div className="diff-rows">{result.rows.map((row) => <div className={`diff-row ${row.kind}`} key={`${row.line}-${row.left}-${row.right}`}><span>{String(row.line).padStart(3, "0")}</span><code>{row.left || " "}</code><span className="diff-marker">{row.kind === "same" ? "=" : row.kind === "changed" ? "±" : row.kind === "left-only" ? "−" : "+"}</span><code>{row.right || " "}</code></div>)}</div>
  </div>;
}

function ToolGrid({ children }: { children: ReactNode }) { return <div className="toolkit-grid">{children}</div>; }
function ToolInputs({ title, children }: { title: string; children: ReactNode }) { return <section className="tool-inputs"><div className="panel-label">{title.toUpperCase()}</div>{children}</section>; }
function ResultCard({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) { return <section className="tool-result"><div className="tool-result__head"><span>{icon}</span><strong>{title}</strong></div>{children}</section>; }
function Metric({ label, value, state = "neutral" }: { label: string; value: string; state?: "good" | "warn" | "bad" | "neutral" }) { return <div className={`tool-metric ${state}`}><span>{label}</span><strong>{value}</strong></div>; }
function NumberField({ label, value, unit, onChange, readOnly = false }: { label: string; value: number; unit: string; onChange: (value: number) => void; readOnly?: boolean }) { return <label className="tool-field"><span>{label}</span><div><input type="number" value={Number.isFinite(value) ? value : 0} readOnly={readOnly} onChange={(e) => onChange(num(e.target.value))} /><b>{unit}</b></div></label>; }
