# OBIX Config Doctor FPV — Evidence Integrity Update

## Target

Upload this source tree to GitHub repository `Santipap250/ConfigdoctorFPV` using the existing protected-`main` workflow.

## Included changes

- Corrected the T-Motor F60 PRO V 2207.5 / KV1950 reference row to 33.9 g and 1216 W.
- Hardened battery cell validation so only whole-number 1–12S values are accepted.
- Extended evidence source metadata with optional structured snapshot SHA-256, source version, and verified-field provenance.
- Added `evidence-source-snapshots.ts` so the reviewed source-derived claim snapshots and hashes are auditable in-repo.
- Added `hasSourceSnapshot()` validation helper.
- Added explicit motor/prop evidence links to the local drone profile.
- Added evidence-to-profile checks that return MATCHED / REVIEW / UNKNOWN / OUTSIDE SOURCE RANGE without inventing compatibility.
- Added regression tests for the corrected motor variant and evidence-link behavior.
- Added working Tool Center search filtering.
- Added Command Palette search filtering and Escape-key close behavior.
- Made the rail Settings button open the Command Palette instead of being inert.
- Shows a short source snapshot SHA-256 fingerprint in the Evidence Table.
- Bumped package version to 1.2.0.

## Important hash note

`source.snapshotHash` is a SHA-256 fingerprint of the structured source-derived claim snapshot stored in the repository. It is NOT presented as a hash of the live third-party webpage HTML. This avoids claiming page immutability that the repository does not actually capture.

## Verification in the preparation environment

Passed:
- JSON parsing of package.json
- source-hash linkage checks
- corrected F60 PRO V KV1950 values check
- brace/parenthesis structural checks on modified TypeScript/TSX files

Not run here:
- `pnpm install --frozen-lockfile`
- Vitest suite
- TypeScript project check
- Vite production build
- Playwright E2E

Reason: the preparation environment could not reach `registry.npmjs.org` and does not have the repository dependencies installed. GitHub Actions should remain the authoritative CI gate after the files are pushed through the repository's protected PR flow.
