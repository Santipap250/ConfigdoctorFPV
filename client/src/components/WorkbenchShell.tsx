/** Flight Deck Atelier component: shared instrument rail and mobile command bar for every product surface. */
import { Activity, Box, Command, Compass, Gauge, Menu, Settings2, Wrench, LibraryBig } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { InstallPrompt } from "./InstallPrompt";

export type WorkspaceView = "home" | "workbench" | "tools" | "cli" | "vault";

const navigation: { id: WorkspaceView; label: string; icon: typeof Compass }[] = [
  { id: "home", label: "Mission", icon: Compass },
  { id: "workbench", label: "Workbench", icon: Gauge },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "cli", label: "Config", icon: Command },
  { id: "vault", label: "Vault", icon: LibraryBig },
];

export function WorkbenchShell({ activeView, onNavigate, onOpenPalette, children }: { activeView: WorkspaceView; onNavigate: (view: WorkspaceView) => void; onOpenPalette: () => void; children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="instrument-rail" aria-label="Primary navigation">
        <div className="rail-brand"><BrandMark /></div>
        <nav className="rail-nav">
          {navigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onNavigate(id)} className={`rail-link ${activeView === id ? "is-active" : ""}`}><Icon size={18} /><span>{label}</span></button>)}
        </nav>
        <div className="rail-foot"><InstallPrompt /><span className="rail-health"><i />SYSTEM NOMINAL</span><button className="icon-button" aria-label="Settings" onClick={onOpenPalette}><Settings2 size={18} /></button></div>
      </aside>
      <header className="mobile-mission-strip"><BrandMark label={false} /><div className="mobile-strip-actions"><InstallPrompt /><button className="palette-trigger" onClick={onOpenPalette}><Menu size={18} /><span>COMMAND</span></button></div></header>
      <main className="work-surface">{children}</main>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigation.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => onNavigate(id)} className={activeView === id ? "is-active" : ""}><Icon size={19} /><span>{label}</span></button>)}
        <button onClick={onOpenPalette}><Box size={19} /><span>More</span></button>
      </nav>
      <button className="floating-command" onClick={onOpenPalette} aria-label="Open command palette"><Activity size={19} /></button>
    </div>
  );
}
