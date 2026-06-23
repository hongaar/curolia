import type { CuroliaPerfSnapshot } from "../fixtures/perf-types.ts";
import type { ConsoleError } from "../fixtures/test.ts";
import { assertFlowBudget, collectErrors } from "./budgets.ts";

export async function finishFlow(
  flow: string,
  options: {
    consoleErrors: ConsoleError[];
    snapshot: CuroliaPerfSnapshot;
    timings?: Record<string, number>;
    recordFlowMetric: (flow: string, snapshot: CuroliaPerfSnapshot) => void;
  },
): Promise<void> {
  await collectErrors(options.consoleErrors, options.snapshot);
  assertFlowBudget(flow, options.snapshot, options.timings ?? {});

  const enriched: CuroliaPerfSnapshot = {
    ...options.snapshot,
    timings: { ...options.snapshot.timings },
  };
  for (const [label, ms] of Object.entries(options.timings ?? {})) {
    enriched.timings[label] = [ms];
  }
  options.recordFlowMetric(flow, enriched);
}
