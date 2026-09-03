# Architecture

OBIXCONFIGDOCTORFPV is a static React application built with Vite and TypeScript. It is intentionally client-only for the initial release: an active profile is held in React state and persisted under `obix-active-profile` in browser local storage. This keeps the initial tool functional without silently inventing account, cloud-sync, or API behavior.

| Layer | Responsibility | Key files |
|---|---|---|
| Domain | Typed `DroneProfile`, metrics, validation and safe CLI draft serialization | `client/src/lib/drone.ts` |
| Tests | Regression checks for formulas and CLI label sanitization | `client/src/lib/drone.test.ts` |
| Components | Instrument rail, status tokens, metrics and visualization | `client/src/components/` |
| Experience | View state, profile editor, tool center and configuration workspace | `client/src/pages/Home.tsx` |
| Styling | Flight Deck Atelier tokens, responsive layout and motion rules | `client/src/index.css` |

## Extension path

When user accounts are introduced, `DroneProfile` becomes the shared payload for saved builds and cloud synchronization. Individual tool domains should remain separate pure modules, for example `lib/analyzers/motor.ts`, `battery.ts`, and `pid.ts`, each with its own evidence source and tests. File import, blackbox parsing, plugins, API access, and community presets require a server-side capability and must not be simulated in the static client.

## Safety boundaries

The validation layer checks only internal consistency of entered values. It does not certify airworthiness, calculate unprovided motor/prop data, or guarantee firmware compatibility. CLI project labels are normalized before serialization to prevent insertion of additional commands through the name field.
