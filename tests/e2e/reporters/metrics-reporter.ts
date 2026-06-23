import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

import type { CuroliaPerfSnapshot } from "../fixtures/perf-types.ts";
import { median } from "../lib/budgets.ts";

type FlowMetrics = {
  counters: Record<string, number>;
  timings: Record<string, number>;
  longTasks: number;
  layoutShifts: number;
};

const e2eDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metricsDir = path.resolve(e2eDir, "../.metrics");
const metricsPath = path.join(metricsDir, "metrics.json");

function parseFlowMetrics(
  test: TestCase,
  result: TestResult,
): FlowMetrics | null {
  const annotation = result.annotations.find((a) => a.type === "e2e-metrics");
  if (!annotation?.description) return null;
  try {
    const flows = JSON.parse(annotation.description) as Record<
      string,
      CuroliaPerfSnapshot & { wallMs?: number }
    >;
    const merged: FlowMetrics = {
      counters: {},
      timings: {},
      longTasks: 0,
      layoutShifts: 0,
    };
    for (const [flow, snapshot] of Object.entries(flows)) {
      for (const [key, value] of Object.entries(snapshot.counters ?? {})) {
        const mergedKey = `${flow}.${key}`;
        merged.counters[mergedKey] = Math.max(
          merged.counters[mergedKey] ?? 0,
          value,
        );
      }
      merged.longTasks = Math.max(merged.longTasks, snapshot.longTasks ?? 0);
      merged.layoutShifts = Math.max(
        merged.layoutShifts,
        snapshot.layoutShifts ?? 0,
      );
      for (const [label, values] of Object.entries(snapshot.timings ?? {})) {
        merged.timings[`${flow}.${label}`] = median(values);
      }
      if (snapshot.wallMs !== undefined) {
        merged.timings[`${flow}.wall`] = snapshot.wallMs;
      }
    }
    return merged;
  } catch {
    return null;
  }
}

class MetricsReporter implements Reporter {
  private readonly byTest = new Map<string, FlowMetrics>();

  onTestEnd(test: TestCase, result: TestResult): void {
    const metrics = parseFlowMetrics(test, result);
    if (metrics) {
      this.byTest.set(test.title, metrics);
    }
  }

  onEnd(result: FullResult): void {
    const payload = {
      generatedAt: new Date().toISOString(),
      status: result.status,
      tests: Object.fromEntries(this.byTest),
    };
    fs.mkdirSync(metricsDir, { recursive: true });
    fs.writeFileSync(metricsPath, `${JSON.stringify(payload, null, 2)}\n`);
  }
}

export default MetricsReporter;
