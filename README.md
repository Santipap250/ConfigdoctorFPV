# OBIXCONFIGDOCTORFPV

**OBIX Config Lab** is a browser-first FPV drone workbench. The current release provides a reusable `DroneProfile`, deterministic battery/load/flight-time calculations, input validation, a transparent Betaflight-oriented CLI draft, local browser persistence, copy and download actions, and a responsive tool-center shell.

## Run locally

```bash
pnpm install
pnpm dev
```

Use `pnpm build` for a production build, `pnpm check` for TypeScript checks, and `pnpm exec vitest run` for calculation tests.

## Calculation scope

The workbench calculates only from user-provided values. Nominal voltage is `cell count × 3.7 V`; continuous battery current is `capacity in Ah × C rating`; flight-time is the conservative `80% usable capacity ÷ entered average current`; peak power is nominal voltage times entered peak current. Thrust-to-weight is withheld unless a verified measured thrust-per-motor value is supplied.

The generated CLI is a reviewable draft. It sanitizes project labels and identifies its target, but it does **not** claim firmware or component compatibility. Always inspect and validate a draft against the actual flight controller and firmware documentation.

## Current scope and future work

The tool center labels modules as **Available** only when an implementation exists. Planned categories are intentionally not presented as analyzers. See [ROADMAP.md](./ROADMAP.md) for the next discrete domains.


## Flight Toolkit

The Tools surface now includes five local utilities for practical FPV workflows: Power Budget, Battery Sag Check, Thrust Margin, a persistent Pre-flight Checklist, and Config Diff. Each tool uses explicit user inputs and states its limitations instead of presenting unverified component or firmware claims as facts.
