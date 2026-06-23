# Critical-path E2E tests

Playwright suite that runs the real app against local Supabase and asserts:

1. **No errors** (console, page errors, probe-captured exceptions)
2. **UI behavior** (pin sheet opens, map pans, search navigates, etc.)
3. **Performance budgets** via `window.__curoliaPerf` counters + timing baselines

## Prerequisites

- Local Supabase running (`npm run db:start -w @curolia/supabase`)
- E2E scripts load `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and Vite
  publishable key from `supabase status` automatically — no hardcoded JWTs.
  Override by exporting those variables yourself if needed.

## Quick start

```bash
# From repo root
npm run db:start -w @curolia/supabase
npm run db:seed:e2e -w @curolia/supabase   # additive — never wipes your data
npm run e2e -w @curolia/e2e
```

Lazy smoke subset (~1 min):

```bash
npm run e2e:smoke -w @curolia/e2e
```

Interactive UI:

```bash
npm run e2e:ui -w @curolia/e2e
```

Playwright always starts its own Vite dev server on port 5173 with `VITE_E2E=1` and
local Supabase credentials — stop any other dev server on that port first.

## Seed data

The seed script (`packages/supabase/scripts/seed-e2e.ts`) owns a namespaced user
(`e2e+seed@curolia.test`) and public dense map (`/e2e-seed/e2e-dense/map` with
~750 pins). It only upserts its own rows and **never** calls `db:reset`.

Re-running the seed reconciles pins on the E2E map only.

## Performance probe

When `VITE_E2E=1` (set automatically by Playwright `webServer`), the app exposes
`window.__curoliaPerf` with counters for hot paths:

- `markerRestack`, `cameraIdleSync`, `collisionZoomSearch`, `exploreLayerSync`, `sheetAnimationReset`

The probe is stripped from production builds.

## Baselines

Each run writes `tests/.metrics/metrics.json` (gitignored). Compare against
`tests/baselines/main.json`:

```bash
npm run compare-baseline -w @curolia/e2e
```

- **Counters**: any increase over baseline fails (when `E2E_ENFORCE_BASELINE=1`)
- **Timings**: fails only beyond +25% vs baseline median

Refresh baseline after intentional perf changes:

```bash
npm run compare-baseline -w @curolia/e2e -- --refresh-baseline
```

## CI

The `e2e` job in `.github/workflows/test.yml` starts Supabase, seeds data, runs
Playwright (Chromium desktop + mobile), posts a delta table to the job summary,
and refreshes the baseline on pushes to `main`.
