/** Flight Deck Atelier page: an asymmetric, graphite FPV mission workspace with real profile-driven calculations. */
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Activity, ArrowRight, BatteryCharging, Box, ChevronRight, ClipboardCheck, Command, Gauge, Info, Layers3, Play, Plus, Radar, RotateCcw, Search, ShieldCheck, SlidersHorizontal, Sparkles, Terminal, Wrench, X } from "lucide-react";
// Deployment smoke-test marker: this change is intentionally behavior-neutral.
import { BrandMark } from "@/components/BrandMark";
import { MetricCard } from "@/components/MetricCard";
import { StatusBadge } from "@/components/StatusBadge";
import { TelemetryChart } from "@/components/TelemetryChart";
import { WorkbenchShell, type WorkspaceView } from "@/components/WorkbenchShell";
import { ValidationPanel } from "@/components/ValidationPanel";
import { CompatibilityPanel } from "@/components/CompatibilityPanel";
import { ProfileVault } from "@/components/ProfileVault";
import type { ToolGroup } from "@/components/ToolCenter";
import { format } from "@/lib/format";
import { calculateMetrics, defaultProfile, generateCliDraft, type DroneProfile, type FlightStyle, validateProfile } from "@/lib/drone";
import { seedEvidence } from "@/lib/evidence-data";

// Tools and Config are not needed for the initial Home/Workbench experience,
// so they load on demand as separate chunks the first time a user navigates
// to them, rather than shipping in the initial bundle.
const ToolCenter = lazy(() => import("@/components/ToolCenter"));
const ConfigCenter = lazy(() => import("@/components/ConfigCenter"));

function ViewLoading() {
  return <div className="view-loading" role="status" aria-live="polite"><span className="view-loading__dot" />Loading…</div>;
}

const toolGroups: ToolGroup[] = [
  { group: "BUILD", tools: [{ name: "Drone Builder", detail: "Profile data model", active: true, icon: Box }, { name: "Weight Calculator", detail: "Profile mass field", active: true, icon: Gauge }, { name: "Battery Calculator", detail: "Load & duration", active: true, icon: BatteryCharging }] },
  { group: "TUNING", tools: [{ name: "PID Advisor", detail: "Architecture ready", active: false, icon: SlidersHorizontal }, { name: "Filter Advisor", detail: "Architecture ready", active: false, icon: Radar }, { name: "Rates Visualizer", detail: "Architecture ready", active: false, icon: Activity }] },
  { group: "ANALYSIS", tools: [{ name: "Thrust Analyzer", detail: "Measured data input", active: true, icon: Gauge }, { name: "Motor & Prop Evidence", detail: "Cited evidence tables", active: true, icon: Wrench }, { name: "Compatibility Check", detail: "Evidence-linked matching", active: true, icon: ShieldCheck }, { name: "Blackbox Analyzer", detail: "Import flow planned", active: false, icon: Layers3 }] },
  { group: "CONFIG", tools: [{ name: "Config Builder", detail: "CLI draft + checks", active: true, icon: Terminal }, { name: "Config Validator", detail: "Input integrity", active: true, icon: ShieldCheck }, { name: "Config Diff", detail: "Structural CLI comparison", active: true, icon: ClipboardCheck }] },
];

const navigationTargets: Record<string, WorkspaceView> = { "OPEN WORKBENCH": "workbench", "BUILD MY DRONE": "workbench", ANALYZE: "tools", "VIEW CONFIG": "cli", "OPEN PROFILE VAULT": "vault" };

const motorEvidenceOptions = ["", ...seedEvidence.filter((entry) => entry.kind === "motor").map((entry) => entry.id)];
const propEvidenceOptions = ["", ...seedEvidence.filter((entry) => entry.kind === "prop").map((entry) => entry.id)];

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [activeView, setActiveView] = useState<WorkspaceView>("home");
  const [profile, setProfile] = useState<DroneProfile>(() => {
    const stored = localStorage.getItem("obix-active-profile");
    if (!stored) return defaultProfile;
    try { return { ...defaultProfile, ...JSON.parse(stored) }; } catch { return defaultProfile; }
  });
  const [isPaletteOpen, setPaletteOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const metrics = useMemo(() => calculateMetrics(profile), [profile]);
  const validation = useMemo(() => validateProfile(profile), [profile]);
  const cli = useMemo(() => generateCliDraft(profile), [profile]);
  const criticalCount = validation.filter((item) => item.level === "critical").length;
  const warningCount = validation.filter((item) => item.level === "warning").length;

  useEffect(() => { localStorage.setItem("obix-active-profile", JSON.stringify(profile)); }, [profile]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setPaletteOpen(true); } };
    window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener);
  }, []);

  const update = <K extends keyof DroneProfile>(key: K, value: DroneProfile[K]) => setProfile((current) => ({ ...current, [key]: value }));
  const useAction = (label: string) => { const view = navigationTargets[label]; if (view) setActiveView(view); };
  const openTool = (active: boolean, name: string) => {
    if (active) {
      if (name.includes("Diff")) {
        setActiveView("cli");
        window.requestAnimationFrame(() => document.getElementById("config-diff-tool")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        return;
      }
      if (name.includes("Config")) { setActiveView("cli"); return; }
      if (name.includes("Evidence")) {
        setActiveView("tools");
        window.requestAnimationFrame(() => document.getElementById("evidence-tables")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        return;
      }
      if (name.includes("Compatibility")) {
        setActiveView("workbench");
        window.requestAnimationFrame(() => document.getElementById("compatibility-engine")?.scrollIntoView({ behavior: "smooth", block: "start" }));
        return;
      }
      setActiveView("workbench");
      return;
    }
    setNotice(`${name} is represented in the product architecture but has no calculation module yet.`);
  };
  const copyCli = async () => { try { await navigator.clipboard.writeText(cli); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setNotice("Clipboard access was unavailable. Select the CLI text and copy it manually."); } };
  const resetProfile = () => { setProfile(defaultProfile); setNotice("The active project was restored to the supplied reference values."); };

  return (
    <WorkbenchShell activeView={activeView} onNavigate={setActiveView} onOpenPalette={() => setPaletteOpen(true)}>
      {notice ? <div className="notice-banner"><Info size={16} /><span>{notice}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notice"><X size={15} /></button></div> : null}
      {activeView === "home" ? <MissionHome onAction={useAction} onNavigate={setActiveView} profile={profile} validation={validation} /> : null}
      {activeView === "workbench" ? <ProfileWorkbench profile={profile} update={update} metrics={metrics} validation={validation} onReset={resetProfile} onViewConfig={() => setActiveView("cli")} /> : null}
      {activeView === "tools" ? <Suspense fallback={<ViewLoading />}><ToolCenter groups={toolGroups} onOpen={openTool} profile={profile} metrics={metrics} /></Suspense> : null}
      {activeView === "cli" ? <Suspense fallback={<ViewLoading />}><ConfigCenter profile={profile} metrics={metrics} validation={validation} cli={cli} copied={copied} onCopy={copyCli} onDownload={() => downloadText(`${profile.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "obix-config"}.txt`, cli)} onWorkbench={() => setActiveView("workbench")} /></Suspense> : null}
      {activeView === "vault" ? <ProfileVault profile={profile} onLoad={(next) => { setProfile(next); setActiveView("workbench"); }} onNotice={setNotice} /> : null}
      {isPaletteOpen ? <CommandPalette onClose={() => setPaletteOpen(false)} onAction={(view) => { setActiveView(view); setPaletteOpen(false); }} /> : null}
    </WorkbenchShell>
  );
}

function MissionHome({ onAction, onNavigate, profile, validation }: { onAction: (label: string) => void; onNavigate: (view: WorkspaceView) => void; profile: DroneProfile; validation: ReturnType<typeof validateProfile> }) {
  const critical = validation.filter((item) => item.level === "critical").length;
  const metrics = calculateMetrics(profile);
  return <div className="mission-page page-enter home-revision">
    <section className="mission-hero hero-cockpit">
      <img className="mission-hero__art" src="/assets/obix-hero-flight-deck.webp" alt="Carbon FPV drone over an engineering telemetry surface" />
      <div className="mission-hero__scrim" /><div className="hero-telemetry" aria-hidden="true"><span className="hero-telemetry__ring hero-telemetry__ring--outer" /><span className="hero-telemetry__ring hero-telemetry__ring--inner" /><i className="hero-telemetry__crosshair" /><b className="hero-telemetry__readout">LIVE / 01</b></div>
      <div className="mission-hero__topline reveal-item reveal-item--1"><BrandMark /><div className="hero-system-state"><StatusBadge level={critical ? "critical" : "pass"}>{critical ? "INPUT REVIEW" : "INPUTS NOMINAL"}</StatusBadge><span>LOCAL PROFILE / 01</span></div></div>
      <div className="mission-hero__content reveal-item reveal-item--2">
        <div className="eyebrow"><i />MISSION CONTROL / ACTIVE BUILD</div>
        <h1>Calculate.<br /><em>Validate.</em> Configure.</h1>
        <p>Edit the active build, calculate supplied battery values, flag internal conflicts, and keep this profile local to your browser.</p>
        <div className="hero-actions"><button className="button button--primary" onClick={() => onAction("OPEN WORKBENCH")}>EDIT ACTIVE PROFILE <ArrowRight size={16} /></button><button className="button button--ghost" onClick={() => onAction("VIEW CONFIG")}>REVIEW CLI DRAFT</button></div>
      </div>
      <div className="mission-hero__instruments reveal-item reveal-item--3"><div><span>ACTIVE PROJECT</span><strong>{profile.name}</strong><small>{profile.frame}</small></div><div><span>PACK REFERENCE</span><strong>{profile.batteryCells}S / {format(metrics.voltageNominal, 1)} V</strong><small>{profile.capacityMah} mAh · {profile.batteryC} C entered</small></div><div><span>VALIDATION STATE</span><strong>{critical ? `${critical} FLAG${critical > 1 ? "S" : ""}` : "NOMINAL"}</strong><small>{critical ? "Correct values before export" : "Internal relation check clear"}</small></div></div>
    </section>
    <div className="mission-status-line reveal-item reveal-item--4" aria-label="Active workspace status"><span><i />WORKSPACE READY</span><span>PROFILE / {profile.name}</span><span>FIRMWARE / {profile.firmware}</span><span>STORAGE / BROWSER LOCAL</span><div className="mission-status-line__actions"><button onClick={() => onNavigate("workbench")}>OPEN PROFILE DATA <ArrowRight size={13} /></button><button onClick={() => onNavigate("vault")}>PROFILE VAULT <ArrowRight size={13} /></button></div></div>
    <section className="quickstrip reveal-item reveal-item--5">
      <div className="section-kicker"><span>01</span><div><small>QUICK START</small><strong>Run a verified operation</strong></div></div>
      <div className="quickstrip__actions">
        {[{ label: "BUILD MY DRONE", icon: Plus, note: "Profile / edit" }, { label: "OPEN WORKBENCH", icon: Gauge, note: "Calc / live" }, { label: "ANALYZE", icon: Radar, note: "Module / view" }, { label: "VIEW CONFIG", icon: Terminal, note: "Draft / export" }].map(({ label, icon: Icon, note }) => <button key={label} onClick={() => onAction(label)} className="quick-action"><span><Icon size={18} /></span><strong>{label}</strong><small>{note}</small><ChevronRight size={16} /></button>)}
      </div>
    </section>
    <section className="mission-grid reveal-item reveal-item--6">
      <article className="project-brief"><div className="panel-label">ACTIVE BUILD / PROFILE 01</div><div className="project-brief__top"><div><h2>{profile.name}</h2><p>{profile.frame} · {profile.flightStyle}</p></div><button className="text-action" onClick={() => onNavigate("workbench")}>EDIT <ArrowRight size={14} /></button></div><div className="project-brief__specs"><span>{profile.motor} <b>{profile.motorKv} KV</b></span><span>{profile.prop}</span><span>{profile.batteryCells}S {profile.capacityMah} mAh</span></div><div className="project-brief__rule"><i />PROFILE-SCOPED DATA · STORED LOCALLY</div></article>
      <article className="analyzer-slab"><img src="/assets/obix-analyzer-signal.webp" alt="Abstract FPV telemetry waveform" /><div><div className="panel-label">INPUT INTEGRITY</div><h3>{critical ? "Review before export" : "Validation clear"}</h3><p>{critical ? "Critical input conflicts require correction before the CLI draft should be used." : "No critical internal conflict. Component compatibility remains unverified."}</p><button className="text-action" onClick={() => onNavigate("cli")}>OPEN VALIDATOR <ArrowRight size={14} /></button></div></article>
    </section>
  </div>;
}

function ProfileWorkbench({ profile, update, metrics, validation, onReset, onViewConfig }: { profile: DroneProfile; update: <K extends keyof DroneProfile>(key: K, value: DroneProfile[K]) => void; metrics: ReturnType<typeof calculateMetrics>; validation: ReturnType<typeof validateProfile>; onReset: () => void; onViewConfig: () => void }) {
  const showRatio = metrics.thrustToWeight !== null;
  const errorFor = (title: string) => validation.find((item) => item.title === title)?.title;
  return <div className="workbench-page page-enter">
    <header className="mission-header"><div><div className="eyebrow"><i />PROJECT / ACTIVE PROFILE</div><h1>FPV <em>Workbench</em></h1><p>Values are kept in this browser until you export or replace them.</p></div><div className="mission-header__actions"><button className="button button--ghost" onClick={onReset}><RotateCcw size={16} /> RESTORE</button><button className="button button--primary" onClick={onViewConfig}>REVIEW CONFIG <ArrowRight size={16} /></button></div></header>
    <div className="workbench-grid">
      <section className="input-rack"><div className="panel-heading"><div><span className="panel-index">01</span><h2>Drone profile</h2></div><StatusBadge level="neutral">LOCAL WORKSPACE</StatusBadge></div><p className="panel-intro">Enter only values you know or can support. The result panels explicitly withhold calculations when evidence is missing.</p>
        <div className="form-grid">
          <Field label="PROJECT NAME" value={profile.name} error={errorFor("Project name is required")} onChange={(value) => update("name", value)} />
          <SelectField label="FLIGHT STYLE" value={profile.flightStyle} onChange={(value) => update("flightStyle", value as FlightStyle)} options={["Freestyle", "Cinematic", "Long range", "Racing"]} />
          <Field label="FRAME" value={profile.frame} onChange={(value) => update("frame", value)} />
          <Field label="MOTOR" value={profile.motor} onChange={(value) => update("motor", value)} />
          <SelectField label="MOTOR EVIDENCE" value={profile.motorEvidenceId ?? ""} onChange={(value) => update("motorEvidenceId", value || undefined)} options={motorEvidenceOptions} optionLabels={motorEvidenceOptions.map((id) => id ? seedEvidence.find((entry) => entry.id === id)?.version ?? id : "None linked")} />
          <NumberField label="MOTOR KV" value={profile.motorKv} unit="KV" onChange={(value) => update("motorKv", value)} />
          <Field label="PROP" value={profile.prop} onChange={(value) => update("prop", value)} />
          <SelectField label="PROP EVIDENCE" value={profile.propEvidenceId ?? ""} onChange={(value) => update("propEvidenceId", value || undefined)} options={propEvidenceOptions} optionLabels={propEvidenceOptions.map((id) => id ? seedEvidence.find((entry) => entry.id === id)?.version ?? id : "None linked")} />
          <NumberField label="BATTERY" value={profile.batteryCells} unit="S" step="1" error={errorFor("Battery cell count is invalid")} onChange={(value) => update("batteryCells", value)} />
          <NumberField label="CAPACITY" value={profile.capacityMah} unit="mAh" source="ENTERED" error={errorFor("Battery capacity is required")} onChange={(value) => update("capacityMah", value)} />
          <NumberField label="C RATING" value={profile.batteryC} unit="C" onChange={(value) => update("batteryC", value)} />
          <NumberField label="ALL-UP WEIGHT" value={profile.weightG} unit="g" onChange={(value) => update("weightG", value)} />
          <NumberField label="AVG. CURRENT" value={profile.estimatedAverageCurrentA} unit="A" source="ENTERED / ESTIMATE" error={errorFor("No average current estimate")} onChange={(value) => update("estimatedAverageCurrentA", value)} />
          <NumberField label="PEAK CURRENT" value={profile.expectedPeakCurrentA} unit="A" source="ENTERED / ESTIMATE" error={errorFor("No peak current estimate")} onChange={(value) => update("expectedPeakCurrentA", value)} />
          <NumberField label="MEASURED THRUST / MOTOR" value={profile.measuredThrustPerMotorG} unit="g" source="MEASURED ONLY" error={errorFor("No measured thrust data")} onChange={(value) => update("measuredThrustPerMotorG", value)} />
          <SelectField label="FIRMWARE TARGET" value={profile.firmware} onChange={(value) => update("firmware", value)} options={["Betaflight", "INAV", "Other"]} />
        </div>
      </section>
      <aside className="result-deck"><div className="result-deck__image"><img src="/assets/obix-workbench-visual.webp" alt="FPV drone on a calibration platform" /><div><span>PROJECT SIGNAL</span><strong>LIVE INPUTS</strong></div></div><div className="metric-grid"><MetricCard icon={BatteryCharging} label="NOMINAL PACK" value={format(metrics.voltageNominal, 1)} unit="V" note={`${profile.batteryCells || 0} cells × 3.7 V`} accent /><MetricCard icon={Gauge} label="CONTINUOUS LIMIT" value={format(metrics.batteryContinuousA, 0)} unit="A" note={`${format(metrics.capacityAh, 2)} Ah × ${profile.batteryC || 0} C`} /><MetricCard icon={Activity} label="PEAK POWER" value={format(metrics.estimatedPowerW, 0)} unit="W" note="nominal V × entered peak A" /><MetricCard icon={Play} label="FLIGHT TIME" value={format(metrics.estimatedFlightMinutes, 1)} unit="min" note="80% capacity ÷ avg. current" /></div><div className="ratio-panel"><div><span className="panel-label">THRUST / WEIGHT</span><strong>{showRatio ? `${format(metrics.thrustToWeight, 2)}:1` : "INPUT REQUIRED"}</strong><p>{showRatio ? `${format(metrics.totalThrustG, 0)} g total measured thrust ÷ ${profile.weightG || 0} g all-up weight.` : "Enter verified thrust per motor; OBIX does not guess this value."}</p></div><Gauge size={25} /></div><TelemetryChart currentA={profile.expectedPeakCurrentA} voltageV={metrics.voltageNominal} /></aside>
    </div>
    <ValidationPanel validation={validation} />
    <CompatibilityPanel profile={profile} />
  </div>;
}

function Field({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) { return <label className="field"><span>{label}</span><input aria-label={label} aria-invalid={Boolean(error)} value={value} onChange={(event) => onChange(event.target.value)} />{error ? <small className="field-error">{error}</small> : null}</label>; }
function NumberField({ label, value, unit, onChange, step = "any", error, source }: { label: string; value: number; unit: string; onChange: (value: number) => void; step?: string; error?: string; source?: string }) { return <label className="field"><span>{label}{source ? <small className="field-source">{source}</small> : null}</span><div className="input-with-unit"><input aria-label={label} aria-invalid={Boolean(error)} type="number" min="0" step={step} value={value || ""} onChange={(event) => onChange(Number(event.target.value))} /><b>{unit}</b></div>{error ? <small className="field-error">{error}</small> : null}</label>; }
function SelectField({ label, value, options, optionLabels, onChange }: { label: string; value: string; options: string[]; optionLabels?: string[]; onChange: (value: string) => void }) { return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option, index) => <option key={option} value={option}>{optionLabels?.[index] ?? option}</option>)}</select></label>; }

function CommandPalette({ onClose, onAction }: { onClose: () => void; onAction: (view: WorkspaceView) => void }) {
  const entries: { label: string; description: string; view: WorkspaceView; icon: typeof Gauge }[] = [
    { label: "Open Workbench", description: "Edit active drone profile", view: "workbench", icon: Gauge },
    { label: "Explore Tools", description: "Available and planned modules", view: "tools", icon: Wrench },
    { label: "Review Config", description: "Validate and export CLI draft", view: "cli", icon: Terminal },
    { label: "Mission Control", description: "Return to launch view", view: "home", icon: Sparkles },
    { label: "Profile Vault", description: "Save, duplicate, import and export drone builds", view: "vault", icon: Box },
  ];
  const [query, setQuery] = useState("");
  const filtered = entries.filter((entry) => `${entry.label} ${entry.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => { const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("keydown", handler); return () => window.removeEventListener("keydown", handler); }, [onClose]);
  return <div className="command-overlay" role="dialog" aria-modal="true" aria-label="Command palette" onMouseDown={onClose}><section className="command-palette" onMouseDown={(event) => event.stopPropagation()}><div className="command-palette__search"><Search size={18} /><input autoFocus placeholder="Search a command" value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>ESC</kbd></div><div className="command-palette__label">QUICK ACTIONS</div>{filtered.length ? filtered.map(({ label, description, view, icon: Icon }) => <button key={view} onClick={() => onAction(view)}><span><Icon size={17} /></span><div><strong>{label}</strong><small>{description}</small></div><Command size={15} /></button>) : <div className="command-empty">No matching command.</div>}<footer><span>Navigate with keyboard</span><span><kbd>⌘</kbd><kbd>K</kbd></span></footer></section></div>;
}
