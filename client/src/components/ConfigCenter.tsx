import { Check, ChevronRight, Copy, Download } from "lucide-react";
import { ValidationPanel } from "@/components/ValidationPanel";
import { format } from "@/lib/format";
import { summarizeProfile, type calculateMetrics, type DroneProfile, type validateProfile } from "@/lib/drone";

export function ConfigCenter({ profile, metrics, validation, cli, copied, onCopy, onDownload, onWorkbench }: { profile: DroneProfile; metrics: ReturnType<typeof calculateMetrics>; validation: ReturnType<typeof validateProfile>; cli: string; copied: boolean; onCopy: () => void; onDownload: () => void; onWorkbench: () => void }) {
  const critical = validation.filter((item) => item.level === "critical").length;
  return (
    <div className="config-page page-enter">
      <header className="mission-header">
        <div><div className="eyebrow"><i />CONFIG BUILDER / STEP 08</div><h1>Review. <em>Validate.</em> Export.</h1><p>A transparent CLI draft generated from the active profile; it is not a firmware compatibility guarantee.</p></div>
        <button className="button button--ghost" onClick={onWorkbench}><ChevronRight className="rotate-180" size={16} /> EDIT PROFILE</button>
      </header>
      <section className="config-progress"><span className="is-complete">01 PROFILE</span><span className="is-complete">02 BATTERY</span><span className="is-complete">03 BUILD</span><span className="is-active">04 REVIEW</span></section>
      <div className="config-grid">
        <section className="cli-console">
          <div className="console-top">
            <div><span className="console-lamp console-lamp--red" /><span className="console-lamp console-lamp--amber" /><span className="console-lamp console-lamp--lime" /></div>
            <span>OBIX / GENERATED-DRAFT.TXT</span>
            <div>
              <button className="console-action" onClick={onCopy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "COPIED" : "COPY CLI"}</button>
              <button className="console-action" onClick={onDownload}><Download size={15} />DOWNLOAD</button>
            </div>
          </div>
          <pre>{cli.split("\n").map((line, index) => <code key={`${line}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{line || " "}{"\n"}</code>)}</pre>
          <div className="console-foot"><span>Target: {profile.firmware}</span><span>Nominal: {format(metrics.voltageNominal, 1)} V</span><span>State: {critical ? "REVIEW REQUIRED" : "DRAFT READY"}</span></div>
        </section>
        <aside className="config-sidebar">
          <div className="profile-snapshot"><div className="panel-label">BUILD SNAPSHOT</div>{summarizeProfile(profile).map((item) => <p key={item}>{item}</p>)}</div>
          <ValidationPanel validation={validation} compact />
        </aside>
      </div>
    </div>
  );
}

export default ConfigCenter;
