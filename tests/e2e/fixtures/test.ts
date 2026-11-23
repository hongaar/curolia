import { test as base, expect } from "@playwright/test";

import type { CuroliaPerfSnapshot } from "./perf-types.ts";

export type ConsoleError = {
  type: "console" | "pageerror";
  message: string;
};

export type TestFixtures = {
  consoleErrors: ConsoleError[];
  perfReset: () => Promise<void>;
  perfSnapshot: () => Promise<CuroliaPerfSnapshot>;
  recordFlowMetric: (flow: string, snapshot: CuroliaPerfSnapshot) => void;
};

export function isBenignConsoleError(text: string): boolean {
  if (text.includes("favicon")) return true;
  // next-themes' ThemeProvider renders an inline <script> (needed for
  // prerendered pages); React 19.3+ warns about it on client render.
  // TODO: remove once fixed properly (see README "E2E: temporary workarounds").
  if (
    text.startsWith("Encountered a script tag while rendering React component")
  )
    return true;
  if (/Failed to load resource.*\b404\b/i.test(text)) return true;
  if (/\b404\b.*Not Found/i.test(text)) return true;
  return false;
}

export const test = base.extend<TestFixtures>({
  consoleErrors: async ({ page }, use) => {
    const errors: ConsoleError[] = [];
    const onConsole = (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === "error") {
        const text = msg.text();
        if (isBenignConsoleError(text)) return;
        errors.push({ type: "console", message: text });
      }
    };
    const onPageError = (error: Error) => {
      errors.push({ type: "pageerror", message: error.message });
    };
    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    await use(errors);
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  },

  perfReset: async ({ page }, use) => {
    await use(async () => {
      await page.evaluate(() => {
        window.__curoliaPerf?.reset();
      });
    });
  },

  perfSnapshot: async ({ page }, use) => {
    await use(async () =>
      page.evaluate(() => {
        const probe = window.__curoliaPerf;
        if (!probe) {
          return {
            counters: {},
            timings: {},
            longTasks: 0,
            layoutShifts: 0,
            errors: [],
          };
        }
        return probe.snapshot();
      }),
    );
  },

  recordFlowMetric: async ({}, use, testInfo) => {
    const flows: Record<string, CuroliaPerfSnapshot> = {};
    await use((flow, snapshot) => {
      flows[flow] = snapshot;
    });
    if (Object.keys(flows).length > 0) {
      testInfo.annotations.push({
        type: "e2e-metrics",
        description: JSON.stringify(flows),
      });
    }
  },
});

export { expect };
