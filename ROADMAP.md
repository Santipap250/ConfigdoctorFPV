# Roadmap

## Delivered foundation

The v1.1 release adds the Flight Toolkit: power budget, battery sag model, thrust margin, persistent pre-flight checklist, and line-by-line config diff. These utilities remain input-driven and explicitly avoid unverified hardware/firmware compatibility claims.

The initial release ships the profile schema, local persistence, transparent battery/load calculations, configuration validation, CLI draft export, responsive workbench surfaces, keyboard command palette, and unit tests for central domain logic.

The production-hardening pass adds a frozen pnpm workspace configuration, GitHub Actions checks for every push and pull request, Playwright smoke coverage for the primary user flows, accessible inline field validation, and explicit entered/estimated/measured data provenance labels.

## Next domains

| Priority | Domain | Preconditions |
|---|---|---|
| — | ~~Importable motor and prop evidence tables~~ — delivered (Tools view: Motor & Prop Evidence). Three manufacturer-sourced entries; every row requires a checkable citation or it is filtered out. | — |
| — | ~~Config diff~~ — delivered as a structural CLI text diff (Config view). Firmware-specific *validation* of diffed parameters is intentionally out of scope until the item below is unblocked. | — |
| — | ~~Firmware-specific config validation~~ — delivered as an optional, off-by-default check in the Config Diff tool against a curated Betaflight 2025.12 parameter schema (~70 parameters, sourced from Betaflight's own official CLI reference). Explicitly version-scoped: a key outside the schema is always reported "not validated," never guessed; a flagged value is reported only as outside *that version's* documented range, never as unsafe. Extending to other firmware versions needs the same sourcing work repeated per version. | — |
| — | ~~Evidence-based compatibility engine~~ — delivered in the Workbench: explicit motor/prop evidence linkage, source-declared battery/frame/motor-class constraints, deterministic match/review/outside-range states, and regression coverage. | — |
| P1 | Saved drone accounts and cloud synchronization | Server, authentication, ownership model and data migration policy |
| P2 | Blackbox / log analysis | Secure upload flow, parser isolation and transparent calculation methodology |
| P2 | PID and filter advice | Validated analysis model, supported firmware versions and limits disclosure |
| P3 | PWA, community presets and sharing | Account permissions, moderation and versioned preset format |

Each analyser must be implemented as a testable domain module with source provenance. No planned tool should be relabelled as available merely for interface completeness.
