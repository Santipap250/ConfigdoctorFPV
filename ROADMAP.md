# Roadmap

## Delivered foundation

The v1.1 release adds the Flight Toolkit: power budget, battery sag model, thrust margin, persistent pre-flight checklist, and line-by-line config diff. These utilities remain input-driven and explicitly avoid unverified hardware/firmware compatibility claims.

The initial release ships the profile schema, local persistence, transparent battery/load calculations, configuration validation, CLI draft export, responsive workbench surfaces, keyboard command palette, and unit tests for central domain logic.

## Next domains

| Priority | Domain | Preconditions |
|---|---|---|
| P1 | Importable motor and prop evidence tables | Versioned source data and citation/provenance rules |
| P1 | Config diff and firmware-specific validation | Target firmware schema and explicit version handling |
| P1 | Saved drone accounts and cloud synchronization | Server, authentication, ownership model and data migration policy |
| P2 | Blackbox / log analysis | Secure upload flow, parser isolation and transparent calculation methodology |
| P2 | PID and filter advice | Validated analysis model, supported firmware versions and limits disclosure |
| P3 | PWA, community presets and sharing | Account permissions, moderation and versioned preset format |

Each analyser must be implemented as a testable domain module with source provenance. No planned tool should be relabelled as available merely for interface completeness.
