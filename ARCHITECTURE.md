# Architecture

OBIXCONFIGDOCTORFPV is a static React application built with Vite and TypeScript. It is intentionally client-only for the initial release: an active profile is held in React state and persisted under `obix-active-profile` in browser local storage. This keeps the initial tool functional without silently inventing account, cloud-sync, or API behavior.

| Layer | Responsibility | Key files |
|---|---|---|
| Domain | Typed `DroneProfile`, metrics, validation and safe CLI draft serialization | `client/src/lib/drone.ts` |
| Tests | Regression checks for formulas and CLI label sanitization | `client/src/lib/drone.test.ts` |
| Components | Instrument rail, status tokens, metrics and visualization | `client/src/components/` |
| Experience | View state and the initial Home/Workbench experience | `client/src/pages/Home.tsx` |
| Experience (on-demand) | Tool Center and Config review, code-split as separate chunks | `client/src/components/ToolCenter.tsx`, `client/src/components/ConfigCenter.tsx` |
| Styling | Flight Deck Atelier tokens, responsive layout and motion rules | `client/src/index.css` |

## Performance conventions

- **Initial load vs. on-demand.** `pages/Home.tsx` keeps only the Home and Workbench experience eager; the Tools view (`components/ToolCenter.tsx`, which also hosts the motor/prop evidence table and mission-readiness guide) and the Config review view (`components/ConfigCenter.tsx`) are loaded via `React.lazy` the first time a user navigates to them. Shared pieces used by both an eager and a lazy view (`components/ValidationPanel.tsx`, `lib/format.ts`) live in their own module so they aren't duplicated across chunks. New heavy, view-scoped features should follow the same pattern rather than being added directly to `Home.tsx`.
- **Optional analytics.** `client/src/lib/analytics.ts` only injects the (currently unconfigured) Umami script when both `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID` are set at build time; see `.env.example`. There is no static `%VITE_*%` placeholder in `index.html` — that pattern produces an "undefined env var" build warning and ships a literal, broken script tag whenever the vars are unset.
- **pnpm install scripts.** Only `@tailwindcss/oxide` and `esbuild` are allowed to run their install scripts (`package.json`'s `pnpm.onlyBuiltDependencies`) — both fetch/link a required prebuilt native binary. This is an explicit allow-list, not a blanket `--ignore-scripts` bypass; add a new entry only when a specific dependency is confirmed to need it.

## Extension path

When user accounts are introduced, `DroneProfile` becomes the shared payload for saved builds and cloud synchronization. Individual tool domains should remain separate pure modules, for example `lib/analyzers/motor.ts`, `battery.ts`, and `pid.ts`, each with its own evidence source and tests. File import, blackbox parsing, plugins, API access, and community presets require a server-side capability and must not be simulated in the static client.

## Safety boundaries

The validation layer checks only internal consistency of entered values. It does not certify airworthiness, calculate unprovided motor/prop data, or guarantee firmware compatibility. CLI project labels are normalized before serialization to prevent insertion of additional commands through the name field.
