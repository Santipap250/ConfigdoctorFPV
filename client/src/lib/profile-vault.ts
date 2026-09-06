import type { DroneProfile } from "./drone";

export const PROFILE_VAULT_SCHEMA = 1;
export const PROFILE_VAULT_STORAGE_KEY = "obix-profile-vault";

export type SavedDroneProfile = {
  id: string;
  name: string;
  profile: DroneProfile;
  createdAt: string;
  updatedAt: string;
  revision: number;
  favorite: boolean;
};

export type ProfileVault = {
  schema: number;
  activeId: string | null;
  profiles: SavedDroneProfile[];
};

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function emptyProfileVault(): ProfileVault {
  return { schema: PROFILE_VAULT_SCHEMA, activeId: null, profiles: [] };
}

export function normalizeProfileVault(input: unknown): ProfileVault {
  if (!input || typeof input !== "object") return emptyProfileVault();
  const raw = input as Partial<ProfileVault>;
  const profiles = Array.isArray(raw.profiles)
    ? raw.profiles.filter((item): item is SavedDroneProfile => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as Partial<SavedDroneProfile>;
        return typeof candidate.id === "string" && candidate.profile && typeof candidate.profile === "object";
      }).map((item) => ({
        id: item.id,
        name: typeof item.name === "string" ? item.name : item.profile.name || "Unnamed build",
        profile: clone(item.profile),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString(),
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : new Date().toISOString(),
        revision: Number.isInteger(item.revision) && item.revision > 0 ? item.revision : 1,
        favorite: Boolean(item.favorite),
      }))
    : [];
  const activeId = typeof raw.activeId === "string" && profiles.some((item) => item.id === raw.activeId) ? raw.activeId : profiles[0]?.id ?? null;
  return { schema: PROFILE_VAULT_SCHEMA, activeId, profiles };
}

export function readProfileVault(): ProfileVault {
  try {
    const raw = localStorage.getItem(PROFILE_VAULT_STORAGE_KEY);
    return normalizeProfileVault(raw ? JSON.parse(raw) : null);
  } catch {
    return emptyProfileVault();
  }
}

export function writeProfileVault(vault: ProfileVault): ProfileVault {
  const normalized = normalizeProfileVault(vault);
  localStorage.setItem(PROFILE_VAULT_STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function createSavedProfile(profile: DroneProfile, favorite = false): SavedDroneProfile {
  const now = new Date().toISOString();
  return { id: makeId(), name: profile.name.trim() || "Unnamed build", profile: clone(profile), createdAt: now, updatedAt: now, revision: 1, favorite };
}

export function upsertSavedProfile(vault: ProfileVault, record: SavedDroneProfile): ProfileVault {
  const next = clone(vault);
  const index = next.profiles.findIndex((item) => item.id === record.id);
  const normalizedRecord = { ...record, name: record.profile.name.trim() || record.name.trim() || "Unnamed build", profile: clone(record.profile), updatedAt: new Date().toISOString() };
  if (index === -1) next.profiles.unshift(normalizedRecord);
  else next.profiles[index] = { ...next.profiles[index], ...normalizedRecord, revision: next.profiles[index].revision + 1 };
  next.activeId = record.id;
  return normalizeProfileVault(next);
}

export function saveActiveProfile(vault: ProfileVault, profile: DroneProfile): ProfileVault {
  if (vault.activeId) {
    const existing = vault.profiles.find((item) => item.id === vault.activeId);
    if (existing) return upsertSavedProfile(vault, { ...existing, name: profile.name, profile, updatedAt: new Date().toISOString() });
  }
  const created = createSavedProfile(profile, vault.profiles.length === 0);
  return upsertSavedProfile(vault, created);
}

export function setActiveProfile(vault: ProfileVault, id: string): ProfileVault {
  if (!vault.profiles.some((item) => item.id === id)) return vault;
  return { ...vault, activeId: id };
}

export function duplicateSavedProfile(vault: ProfileVault, id: string): ProfileVault {
  const source = vault.profiles.find((item) => item.id === id);
  if (!source) return vault;
  const copy = createSavedProfile({ ...source.profile, name: `${source.profile.name} COPY` }, false);
  return upsertSavedProfile(vault, copy);
}

export function removeSavedProfile(vault: ProfileVault, id: string): ProfileVault {
  const next = { ...vault, profiles: vault.profiles.filter((item) => item.id !== id) };
  if (next.activeId === id) next.activeId = next.profiles[0]?.id ?? null;
  return normalizeProfileVault(next);
}

export function toggleFavorite(vault: ProfileVault, id: string): ProfileVault {
  return normalizeProfileVault({ ...vault, profiles: vault.profiles.map((item) => item.id === id ? { ...item, favorite: !item.favorite } : item) });
}

export function exportProfileVault(vault: ProfileVault): string {
  return JSON.stringify({ ...vault, schema: PROFILE_VAULT_SCHEMA, exportedAt: new Date().toISOString(), product: "OBIXCONFIGDOCTORFPV" }, null, 2);
}

export function importProfileVault(text: string): ProfileVault {
  const parsed: unknown = JSON.parse(text);
  const vault = normalizeProfileVault(parsed);
  if (!vault.profiles.length) throw new Error("The selected file does not contain any valid drone profiles.");
  return vault;
}

export function mergeProfileVault(current: ProfileVault, incoming: ProfileVault): ProfileVault {
  const next = clone(current);
  const byId = new Map(next.profiles.map((item) => [item.id, item]));
  incoming.profiles.forEach((item) => byId.set(item.id, item));
  const profiles = Array.from(byId.values()).sort((a, b) => {
    const af = a.favorite ? 1 : 0;
    const bf = b.favorite ? 1 : 0;
    return bf - af || +new Date(b.updatedAt) - +new Date(a.updatedAt);
  });
  const activeId = incoming.activeId && byId.has(incoming.activeId) ? incoming.activeId : next.activeId;
  return normalizeProfileVault({ schema: PROFILE_VAULT_SCHEMA, activeId, profiles });
}
