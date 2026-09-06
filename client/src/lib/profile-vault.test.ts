import { describe, expect, it } from "vitest";
import { defaultProfile } from "./drone";
import { createSavedProfile, emptyProfileVault, exportProfileVault, importProfileVault, mergeProfileVault, removeSavedProfile, upsertSavedProfile } from "./profile-vault";

describe("profile vault", () => {
  it("round-trips a saved profile through JSON export/import", () => {
    const record = createSavedProfile(defaultProfile, true);
    const vault = upsertSavedProfile(emptyProfileVault(), record);
    const imported = importProfileVault(exportProfileVault(vault));
    expect(imported.profiles).toHaveLength(1);
    expect(imported.profiles[0].profile.batteryCells).toBe(defaultProfile.batteryCells);
    expect(imported.activeId).toBe(record.id);
  });

  it("removes the active profile and selects the next available profile", () => {
    const first = createSavedProfile(defaultProfile);
    const second = createSavedProfile({ ...defaultProfile, name: "Second build" });
    const vault = upsertSavedProfile(upsertSavedProfile(emptyProfileVault(), first), second);
    const active = { ...vault, activeId: first.id };
    const next = removeSavedProfile(active, first.id);
    expect(next.profiles).toHaveLength(1);
    expect(next.activeId).toBe(second.id);
  });

  it("merges imports without dropping current profiles", () => {
    const a = createSavedProfile(defaultProfile);
    const b = createSavedProfile({ ...defaultProfile, name: "B" });
    const merged = mergeProfileVault(upsertSavedProfile(emptyProfileVault(), a), upsertSavedProfile(emptyProfileVault(), b));
    expect(merged.profiles.map((item) => item.id)).toEqual(expect.arrayContaining([a.id, b.id]));
  });
});
