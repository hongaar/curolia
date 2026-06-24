import type { CuroliaPerfSnapshot } from "../fixtures/perf-types.ts";

export type FlowBudgets = {
  counters?: Record<string, number>;
  maxLongTasks?: number;
  maxTimingMs?: Record<string, number>;
};

export const FLOW_BUDGETS: Record<string, FlowBudgets> = {
  "map-load": {
    counters: { cameraIdleSync: 3 },
    // Cold load on a 750-pin map; CI runners routinely see ~10–12 long tasks.
    maxLongTasks: 14,
    maxTimingMs: { "map-load": 15_000 },
  },
  "map-settings": {
    counters: { cameraIdleSync: 10 },
  },
  "pin-detail": {
    counters: {
      markerRestack: 8,
      sheetAnimationReset: 2,
      collisionZoomSearch: 2,
    },
    maxTimingMs: { "pin-open": 6_000 },
  },
  collision: {
    counters: {
      markerRestack: 4,
      collisionZoomSearch: 20,
    },
  },
  "map-pan-zoom": {
    counters: { markerRestack: 45, collisionZoomSearch: 8 },
    // MapLibre tile/marker work on ~750 pins: 4 pans + 6 wheel zooms routinely
    // produce ~15 main-thread long tasks; this guards runaway regressions only.
    maxLongTasks: 24,
  },
  explore: {
    counters: { exploreLayerSync: 6 },
    maxTimingMs: { "explore-toggle": 5_000 },
  },
  search: {
    maxTimingMs: { "search-pick": 6_000 },
  },
};

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!;
}

export function assertFlowBudget(
  flow: string,
  snapshot: CuroliaPerfSnapshot,
  timings: Record<string, number>,
): void {
  const budget = FLOW_BUDGETS[flow];
  if (!budget) return;

  for (const [name, max] of Object.entries(budget.counters ?? {})) {
    const actual = snapshot.counters[name] ?? 0;
    if (actual > max) {
      throw new Error(
        `[${flow}] counter ${name}=${actual} exceeds budget ${max}`,
      );
    }
  }

  if (
    budget.maxLongTasks !== undefined &&
    snapshot.longTasks > budget.maxLongTasks
  ) {
    throw new Error(
      `[${flow}] longTasks=${snapshot.longTasks} exceeds budget ${budget.maxLongTasks}`,
    );
  }

  for (const [label, maxMs] of Object.entries(budget.maxTimingMs ?? {})) {
    const duration = timings[label] ?? 0;
    if (duration > maxMs) {
      throw new Error(
        `[${flow}] timing ${label}=${duration.toFixed(0)}ms exceeds budget ${maxMs}ms`,
      );
    }
  }
}

export async function collectErrors(
  pageErrors: Array<{ type: string; message: string }>,
  snapshot: CuroliaPerfSnapshot,
): Promise<void> {
  const messages = [...pageErrors.map((e) => e.message), ...snapshot.errors];
  if (messages.length > 0) {
    throw new Error(`Unexpected errors:\n${messages.join("\n")}`);
  }
}
