import { useMemo, useState } from "react";
import { Archive, ArrowRight, Copy, Download, FileJson, HardDrive, Heart, Layers3, Plus, RefreshCw, ShieldCheck, Trash2, UploadCloud } from "lucide-react";
import type { DroneProfile } from "@/lib/drone";
import { defaultProfile } from "@/lib/drone";
import { createSavedProfile, duplicateSavedProfile, emptyProfileVault, exportProfileVault, importProfileVault, mergeProfileVault, readProfileVault, removeSavedProfile, saveActiveProfile, setActiveProfile, toggleFavorite, writeProfileVault, type ProfileVault } from "@/lib/profile-vault";

function downloadFile(name: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function fileSafeName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "obix-profile-vault";
}

function summarize(profile: DroneProfile) {
  return `${profile.frame} · ${profile.motor} ${profile.motorKv} KV · ${profile.batteryCells}S ${profile.capacityMah} mAh`;
}

export function ProfileVault({ profile, onLoad, onNotice }: { profile: DroneProfile; onLoad: (profile: DroneProfile) => void; onNotice: (message: string) => void }) {
  const [vault, setVault] = useState<ProfileVault>(() => readProfileVault());
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() => readProfileVault().activeId);
  const selected = vault.profiles.find((item) => item.id === selectedId) ?? vault.profiles.find((item) => item.id === vault.activeId) ?? vault.profiles[0] ?? null;
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vault.profiles.filter((item) => !q || `${item.name} ${summarize(item.profile)}`.toLowerCase().includes(q));
  }, [search, vault.profiles]);

  const persist = (next: ProfileVault) => {
    const written = writeProfileVault(next);
    setVault(written);
    return written;
  };

  const saveCurrent = () => {
    const next = persist(saveActiveProfile(vault, profile));
    setSelectedId(next.activeId);
    onNotice(`Saved ${profile.name || "Unnamed build"} to Profile Vault.`);
  };

  const createBlank = () => {
    const record = createSavedProfile({ ...defaultProfile, name: `NEW BUILD ${vault.profiles.length + 1}` });
    const next = persist({ ...vault, profiles: [record, ...vault.profiles], activeId: record.id });
    setSelectedId(record.id);
    onLoad(record.profile);
    onNotice("New build created. Edit it in the Workbench.");
  };

  const load = (id: string) => {
    const record = vault.profiles.find((item) => item.id === id);
    if (!record) return;
    const next = persist(setActiveProfile(vault, id));
    setVault(next);
    setSelectedId(id);
    onLoad(record.profile);
    onNotice(`Loaded ${record.name}.`);
  };

  const duplicate = (id: string) => {
    const next = persist(duplicateSavedProfile(vault, id));
    setSelectedId(next.activeId);
    const record = next.profiles.find((item) => item.id === next.activeId);
    if (record) onLoad(record.profile);
    onNotice("Profile duplicated as a new revision-safe build.");
  };

  const remove = (id: string) => {
    const record = vault.profiles.find((item) => item.id === id);
    if (!record || !window.confirm(`Delete ${record.name}? This removes the saved copy from this browser.`)) return;
    const next = persist(removeSavedProfile(vault, id));
    setSelectedId(next.activeId);
    onNotice(`Deleted ${record.name}.`);
  };

  const favorite = (id: string) => persist(toggleFavorite(vault, id));

  const exportAll = () => downloadFile(`${fileSafeName(profile.name)}-vault.json`, exportProfileVault(vault));

  const importFile = async (file: File) => {
    try {
      const text = await file.text();
      const incoming = importProfileVault(text);
      const next = persist(mergeProfileVault(vault, incoming));
      setSelectedId(next.activeId);
      onNotice(`Imported ${incoming.profiles.length} profile${incoming.profiles.length === 1 ? "" : "s"} without overwriting unrelated builds.`);
    } catch (error) {
      onNotice(error instanceof Error ? error.message : "The selected vault file could not be imported.");
    }
  };

  return <div className="vault-page page-enter">
    <header className="mission-header vault-hero">
      <div>
        <div className="eyebrow"><i />PHASE 4 / PROFILE VAULT</div>
        <h1>Builds <em>that stay</em>.</h1>
        <p>Keep multiple drone projects organized, recoverable and portable. Phase 4 stays local-first: no fake cloud account, no hidden upload, no network dependency.</p>
      </div>
      <div className="vault-hero__actions">
        <button className="button button--ghost" onClick={createBlank}><Plus size={16} /> NEW BUILD</button>
        <button className="button button--primary" onClick={saveCurrent}><Archive size={16} /> SAVE ACTIVE</button>
      </div>
    </header>

    <section className="vault-banner">
      <div className="vault-banner__signal"><span className="vault-pulse" /><strong>{vault.profiles.length}</strong><small>SAVED BUILDS</small></div>
      <div className="vault-banner__signal"><strong>{vault.profiles.filter((item) => item.favorite).length}</strong><small>FAVORITES</small></div>
      <div className="vault-banner__signal"><strong>{vault.activeId ? "READY" : "EMPTY"}</strong><small>ACTIVE POINTER</small></div>
      <div className="vault-banner__copy"><ShieldCheck size={17} /><span>Storage scope: this browser only. Export a JSON backup before changing devices.</span></div>
    </section>

    <section className="vault-toolbar">
      <label className="vault-search"><Layers3 size={17} /><input aria-label="Search saved profiles" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search builds, frame, motor, battery…" /><kbd>{vault.profiles.length}</kbd></label>
      <div className="vault-toolbar__actions">
        <label className="button button--ghost vault-file-button"><UploadCloud size={15} /> IMPORT JSON<input type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importFile(file); event.currentTarget.value = ""; }} /></label>
        <button className="button button--ghost" onClick={exportAll} disabled={!vault.profiles.length}><Download size={15} /> EXPORT VAULT</button>
      </div>
    </section>

    <div className="vault-grid">
      <section className="vault-list panel-surface">
        <div className="vault-section-head"><div><span>01</span><div><small>PROFILE INDEX</small><h2>Your build fleet</h2></div></div><RefreshCw size={16} /></div>
        {filtered.length ? <div className="vault-cards">{filtered.map((item) => <article key={item.id} className={`vault-card ${item.id === selected?.id ? "is-selected" : ""}`}>
          <button className="vault-card__select" onClick={() => setSelectedId(item.id)} aria-label={`Select ${item.name}`}>
            <span className="vault-card__index">{String(item.revision).padStart(2, "0")}</span><div className="vault-card__body"><div className="vault-card__title"><strong>{item.name}</strong>{item.id === vault.activeId ? <span className="vault-active">ACTIVE</span> : null}</div><p>{summarize(item.profile)}</p><small>UPDATED {new Date(item.updatedAt).toLocaleString()}</small></div>
          </button>
          <div className="vault-card__actions">
            <button onClick={() => favorite(item.id)} aria-label={item.favorite ? `Unfavorite ${item.name}` : `Favorite ${item.name}`} className={item.favorite ? "is-favorite" : ""}><Heart size={15} fill={item.favorite ? "currentColor" : "none"} /></button>
            <button onClick={() => duplicate(item.id)} aria-label={`Duplicate ${item.name}`}><Copy size={15} /></button>
            <button onClick={() => remove(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={15} /></button>
          </div>
        </article>)}</div> : <div className="vault-empty"><FileJson size={22} /><strong>No saved builds match.</strong><span>Create a build or clear the search.</span></div>}
      </section>

      <aside className="vault-inspector panel-surface">
        <div className="vault-section-head"><div><span>02</span><div><small>PROFILE INSPECTOR</small><h2>{selected ? selected.name : "No build selected"}</h2></div></div>{selected ? <span className="vault-revision">REV {selected.revision}</span> : null}</div>
        {selected ? <>
          <div className="vault-identity"><div className="vault-identity__art"><Archive size={25} /><span>LOCAL PROFILE</span></div><div><strong>{selected.profile.name}</strong><p>{selected.profile.flightStyle} · {selected.profile.firmware}</p></div></div>
          <div className="vault-spec-grid">
            <div><span>FRAME</span><strong>{selected.profile.frame}</strong></div><div><span>MOTOR</span><strong>{selected.profile.motor} / {selected.profile.motorKv}KV</strong></div><div><span>PROP</span><strong>{selected.profile.prop}</strong></div><div><span>BATTERY</span><strong>{selected.profile.batteryCells}S / {selected.profile.capacityMah}mAh</strong></div><div><span>WEIGHT</span><strong>{selected.profile.weightG}g</strong></div><div><span>PEAK</span><strong>{selected.profile.expectedPeakCurrentA}A</strong></div>
          </div>
          <div className="vault-inspector__note"><HardDrive size={16} /><div><strong>Recoverable snapshot</strong><span>Revision {selected.revision} · created {new Date(selected.createdAt).toLocaleDateString()}</span></div></div>
          <div className="vault-inspector__actions"><button className="button button--primary" onClick={() => load(selected.id)}>LOAD INTO WORKBENCH <ArrowRight size={15} /></button><button className="button button--ghost" onClick={() => downloadFile(`${fileSafeName(selected.name)}.json`, JSON.stringify(selected, null, 2))}><Download size={15} /> EXPORT PROFILE</button></div>
        </> : <div className="vault-empty"><Archive size={22} /><strong>The vault is ready.</strong><span>Save the current build to create your first recoverable profile.</span></div>}
      </aside>
    </div>

    <section className="vault-future">
      <div><small>NEXT SERVER CAPABILITY</small><h2>Cloud sync, without pretending it exists.</h2><p>The domain contract is already isolated around serializable DroneProfile records. An authenticated server can be added later without changing the local vault format or teaching the UI to trust silent network state.</p></div><span><ShieldCheck size={17} /> LOCAL-FIRST FOUNDATION</span>
    </section>
  </div>;
}
