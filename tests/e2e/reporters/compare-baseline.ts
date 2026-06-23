#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const e2eDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metricsPath = path.resolve(e2eDir, "../.metrics/metrics.json");
const baselinePath = path.resolve(e2eDir, "../baselines/main.json");

const TIMING_REGRESSION_MARGIN = 0.25;

type MetricsFile = {
  tests: Record<
    string,
    {
      counters: Record<string, number>;
      timings: Record<string, number>;
      longTasks: number;
      layoutShifts: number;
    }
  >;
};

type BaselineFile = MetricsFile & { generatedAt?: string };

function loadJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function mergeTests(
  target: BaselineFile["tests"],
  source: BaselineFile["tests"],
): void {
  for (const [testName, metrics] of Object.entries(source)) {
    target[testName] ??= {
      counters: {},
      timings: {},
      longTasks: 0,
      layoutShifts: 0,
    };
    const row = target[testName]!;
    for (const [key, value] of Object.entries(metrics.counters)) {
      row.counters[key] = Math.max(row.counters[key] ?? 0, value);
    }
    for (const [key, value] of Object.entries(metrics.timings)) {
      row.timings[key] = value;
    }
    row.longTasks = Math.max(row.longTasks, metrics.longTasks);
    row.layoutShifts = Math.max(row.layoutShifts, metrics.layoutShifts);
  }
}

function formatDelta(baseline: number, current: number): string {
  if (baseline === 0) return current === 0 ? "0%" : "+∞";
  const pct = ((current - baseline) / baseline) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function main(): void {
  const refresh = process.argv.includes("--refresh-baseline");
  const current = loadJson<MetricsFile>(metricsPath);

  if (refresh) {
    if (!current) {
      console.error("No metrics.json to refresh baseline from");
      process.exit(1);
    }
    const baseline: BaselineFile = {
      generatedAt: new Date().toISOString(),
      tests: {},
    };
    mergeTests(baseline.tests, current.tests);
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, `${JSON.stringify(baseline, null, 2)}\n`);
    console.log(`Refreshed baseline at ${baselinePath}`);
    return;
  }

  if (!current) {
    console.log("No metrics.json — skipping baseline comparison");
    return;
  }

  const baseline = loadJson<BaselineFile>(baselinePath);
  if (!baseline) {
    console.log("No baseline yet — writing initial baseline from this run");
    const initial: BaselineFile = {
      generatedAt: new Date().toISOString(),
      tests: {},
    };
    mergeTests(initial.tests, current.tests);
    fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
    fs.writeFileSync(baselinePath, `${JSON.stringify(initial, null, 2)}\n`);
    return;
  }

  const lines: string[] = [
    "| Metric | Baseline | Current | Delta |",
    "| --- | ---: | ---: | ---: |",
  ];
  let failed = false;

  const allTests = new Set([
    ...Object.keys(baseline.tests),
    ...Object.keys(current.tests),
  ]);

  for (const testName of [...allTests].sort()) {
    const base = baseline.tests[testName];
    const cur = current.tests[testName];
    if (!base || !cur) continue;

    for (const key of new Set([
      ...Object.keys(base.counters),
      ...Object.keys(cur.counters),
    ])) {
      const b = base.counters[key] ?? 0;
      const c = cur.counters[key] ?? 0;
      const delta = formatDelta(b, c);
      lines.push(`| ${testName} ${key} | ${b} | ${c} | ${delta} |`);
      if (c > b) {
        console.error(`Counter regression: ${testName} ${key} ${b} -> ${c}`);
        failed = true;
      }
    }

    for (const key of new Set([
      ...Object.keys(base.timings),
      ...Object.keys(cur.timings),
    ])) {
      const b = base.timings[key] ?? 0;
      const c = cur.timings[key] ?? 0;
      const delta = formatDelta(b, c);
      lines.push(
        `| ${testName} ${key} (ms) | ${b.toFixed(0)} | ${c.toFixed(0)} | ${delta} |`,
      );
      if (b > 0 && c > b * (1 + TIMING_REGRESSION_MARGIN)) {
        console.error(
          `Timing regression: ${testName} ${key} ${b.toFixed(0)}ms -> ${c.toFixed(0)}ms`,
        );
        failed = true;
      }
    }
  }

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  const table = lines.join("\n");
  console.log("\nE2E baseline delta:\n");
  console.log(table);
  if (summaryPath) {
    fs.appendFileSync(summaryPath, `\n## E2E performance delta\n\n${table}\n`);
  }

  if (failed && process.env.E2E_ENFORCE_BASELINE === "1") {
    process.exit(1);
  }
}

main();
