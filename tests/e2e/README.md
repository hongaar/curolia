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
# From repo root (Turbo runs @curolia/web#codegen before Playwright)
npm run db:start -w @curolia/supabase
npm run db:seed:e2e -w @curolia/supabase   # additive — never wipes your data
npx turbo run e2e --filter=@curolia/e2e --log-order=stream --ui=stream
```

Lazy smoke subset (~1 min):

```bash
npx turbo run e2e --filter=@curolia/e2e -- --grep @smoke
```

Interactive UI (run codegen first if needed: `npx turbo run codegen --filter=@curolia/web`):

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

- **Counters**: any increase over baseline is a regression
- **Timings**: regression only beyond +25% vs baseline

`E2E_ENFORCE_BASELINE=1` makes regressions fail the process (used on pull
requests). Without it, the same compare still prints the table and GitHub
annotations but exits 0 (used on `main` so CD is not blocked).

The committed file `tests/baselines/main.json` is **static**. Do not refresh it
as a side effect of CI. After you decide a regression is acceptable, update it
deliberately:

```bash
npm run compare-baseline -w @curolia/e2e -- --refresh-baseline
```

Or from GitHub: **Actions → Update E2E baseline**. Use workflow from `main`, set
**branch** to the PR head, and paste the failing Test run ID into
**from_run_id** (reuses that job’s `e2e-metrics` artifact). Leave
**from_run_id** empty to re-run Playwright on the branch instead. On `main` the
workflow opens a PR rather than pushing through branch protection.

## CI

The `e2e` job in `.github/workflows/test.yml` runs `functions:sync` before
`supabase start` (so edge function sources exist before the CLI boots), seeds
data, runs Playwright (Chromium desktop + mobile), and posts a delta table to
the job summary. Pull requests fail on baseline regressions; pushes to `main`
report them as warnings.

Turbo runs with `--log-order=stream` so seed, Vite, and per-test `line` reporter
output appear in the GitHub log as they happen (not buffered until the job ends).
