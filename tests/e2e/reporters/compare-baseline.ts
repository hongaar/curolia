#!/usr/bin/env tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { styleText } from "node:util";

const e2eDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metricsPath = path.resolve(e2eDir, "../.metrics/metrics.json");
const baselinePath = path.resolve(e2eDir, "../baselines/main.json");

const TIMING_REGRESSION_MARGIN = 0.25;
const COL_GAP = "  ";

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

type CompareRow = {
  test: string;
  metric: string;
  baselineLabel: string;
  currentLabel: string;
  pct: number | null;
  regression: boolean;
  regressionKind?: "counter" | "timing";
};

type Style = Parameters<typeof styleText>[0];

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

function paint(format: Style, text: string): string {
  return styleText(format, text);
}

function percentDelta(baseline: number, current: number): number | null {
  if (baseline === 0) return current === 0 ? 0 : null;
  return ((current - baseline) / baseline) * 100;
}

function formatPct(pct: number | null): string {
  if (pct === null) return "+∞";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

function pad(value: string, width: number, align: "left" | "right"): string {
  if (value.length >= width) return value;
  const fill = " ".repeat(width - value.length);
  return align === "right" ? fill + value : value + fill;
}

function deltaStyle(row: CompareRow): Style {
  if (row.regression || row.pct === null || row.pct > 0) {
    return row.regression ? ["bold", "red"] : "red";
  }
  if (row.pct < 0) return "green";
  return "dim";
}

function collectRows(
  baseline: BaselineFile,
  current: MetricsFile,
): CompareRow[] {
  const rows: CompareRow[] = [];
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
      rows.push({
        test: testName,
        metric: key,
        baselineLabel: String(b),
        currentLabel: String(c),
        pct: percentDelta(b, c),
        regression: c > b,
        regressionKind: c > b ? "counter" : undefined,
      });
    }

    for (const key of new Set([
      ...Object.keys(base.timings),
      ...Object.keys(cur.timings),
    ])) {
      const b = base.timings[key] ?? 0;
      const c = cur.timings[key] ?? 0;
      const regression = b > 0 && c > b * (1 + TIMING_REGRESSION_MARGIN);
      rows.push({
        test: testName,
        metric: `${key} (ms)`,
        baselineLabel: b.toFixed(0),
        currentLabel: c.toFixed(0),
        pct: percentDelta(b, c),
        regression,
        regressionKind: regression ? "timing" : undefined,
      });
    }
  }

  return rows;
}

function groupedTestLabels(rows: CompareRow[]): string[] {
  return rows.map((row, i) =>
    i > 0 && rows[i - 1]!.test === row.test ? "" : row.test,
  );
}

function renderTerminal(rows: CompareRow[]): string {
  const headers = ["Test", "Metric", "Baseline", "Current", "Delta"] as const;
  const testLabels = groupedTestLabels(rows);
  const widths = {
    test: Math.max(headers[0].length, ...testLabels.map((t) => t.length)),
    metric: Math.max(headers[1].length, ...rows.map((r) => r.metric.length)),
    baseline: Math.max(
      headers[2].length,
      ...rows.map((r) => r.baselineLabel.length),
    ),
    current: Math.max(
      headers[3].length,
      ...rows.map((r) => r.currentLabel.length),
    ),
    delta: Math.max(
      headers[4].length,
      ...rows.map((r) => formatPct(r.pct).length),
    ),
  };

  const header = [
    pad(headers[0], widths.test, "left"),
    pad(headers[1], widths.metric, "left"),
    pad(headers[2], widths.baseline, "right"),
    pad(headers[3], widths.current, "right"),
    pad(headers[4], widths.delta, "right"),
  ].join(COL_GAP);

  const lines = [
    paint("bold", header),
    paint("dim", "─".repeat(header.length)),
  ];

  for (const [i, row] of rows.entries()) {
    const testCell = pad(testLabels[i]!, widths.test, "left");
    const currentCell = pad(row.currentLabel, widths.current, "right");
    const deltaCell = pad(formatPct(row.pct), widths.delta, "right");
    const unchanged = row.pct === 0 && !row.regression;
    const rest = [
      pad(row.metric, widths.metric, "left"),
      pad(row.baselineLabel, widths.baseline, "right"),
      row.regression ? paint(["bold", "red"], currentCell) : currentCell,
      unchanged ? deltaCell : paint(deltaStyle(row), deltaCell),
    ].join(COL_GAP);

    lines.push(`${testCell}${COL_GAP}${unchanged ? paint("dim", rest) : rest}`);
  }

  return lines.join("\n");
}

function markdownDelta(row: CompareRow): string {
  const text = formatPct(row.pct);
  if (row.regression) return `🔴 **${text}**`;
  if (row.pct === null || row.pct > 0) return `🔺 ${text}`;
  if (row.pct < 0) return `🟢 ${text}`;
  return text;
}

function renderMarkdown(rows: CompareRow[]): string {
  const testLabels = groupedTestLabels(rows);
  const lines = [
    "| Test | Metric | Baseline | Current | Delta |",
    "| --- | --- | ---: | ---: | ---: |",
  ];
  for (const [i, row] of rows.entries()) {
    lines.push(
      `| ${testLabels[i]} | ${row.metric} | ${row.baselineLabel} | ${row.currentLabel} | ${markdownDelta(row)} |`,
    );
  }
  return lines.join("\n");
}

function summarize(rows: CompareRow[]): {
  regressions: number;
  increased: number;
  improved: number;
  unchanged: number;
} {
  let regressions = 0;
  let increased = 0;
  let improved = 0;
  let unchanged = 0;
  for (const row of rows) {
    if (row.regression) {
      regressions += 1;
      continue;
    }
    if (row.pct === null || row.pct > 0) increased += 1;
    else if (row.pct < 0) improved += 1;
    else unchanged += 1;
  }
  return { regressions, increased, improved, unchanged };
}

function formatCount(n: number, label: string, style?: Style): string {
  const text = `${n} ${label}`;
  return style ? paint(style, text) : text;
}

function renderSummary(rows: CompareRow[]): string {
  const { regressions, increased, improved, unchanged } = summarize(rows);
  return [
    formatCount(regressions, "regressions", regressions > 0 ? "red" : "dim"),
    formatCount(increased, "increased", increased > 0 ? "yellow" : "dim"),
    formatCount(improved, "improved", improved > 0 ? "green" : "dim"),
    formatCount(unchanged, "unchanged", "dim"),
  ].join(paint("dim", "  ·  "));
}

function renderRegressionList(rows: CompareRow[]): string {
  const failed = rows.filter((row) => row.regression);
  if (failed.length === 0) return "";

  const lines = [paint(["bold", "red"], "Regressions")];
  for (const row of failed) {
    const kind = row.regressionKind === "timing" ? "timing" : "counter";
    lines.push(
      paint(
        "red",
        `  ${kind}  ${row.test}  ${row.metric}  ${row.baselineLabel} → ${row.currentLabel}  (${formatPct(row.pct)})`,
      ),
    );
  }
  return lines.join("\n");
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

  const rows = collectRows(baseline, current);
  const summary = renderSummary(rows);
  const table = renderTerminal(rows);
  const regressionList = renderRegressionList(rows);

  console.log(`\nE2E baseline delta\n\n${summary}\n\n${table}\n`);
  if (regressionList) {
    console.error(`\n${regressionList}\n`);
  }

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const { regressions, increased, improved, unchanged } = summarize(rows);
    const md: string[] = [
      "## E2E performance delta",
      "",
      `**${regressions} regressions** · ${increased} increased · ${improved} improved · ${unchanged} unchanged`,
      "",
    ];
    if (regressions > 0) {
      md.push(
        `> [!WARNING]`,
        `> ${regressions} metric${regressions === 1 ? "" : "s"} exceeded the baseline.`,
        "",
      );
    }
    md.push(renderMarkdown(rows), "");
    fs.appendFileSync(summaryPath, `\n${md.join("\n")}\n`);
  }

  if (
    rows.some((row) => row.regression) &&
    process.env.E2E_ENFORCE_BASELINE === "1"
  ) {
    process.exit(1);
  }
}

main();
