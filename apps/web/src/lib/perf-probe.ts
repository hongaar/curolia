export type CuroliaPerfSnapshot = {
  counters: Record<string, number>;
  timings: Record<string, number[]>;
  longTasks: number;
  layoutShifts: number;
  errors: string[];
};

export type CuroliaPerfProbe = {
  count: (name: string, delta?: number) => void;
  reset: () => void;
  snapshot: () => CuroliaPerfSnapshot;
  recordTiming: (label: string, durationMs: number) => void;
  interaction: <T>(label: string, fn: () => T | Promise<T>) => Promise<T>;
  getErrors: () => readonly string[];
};

declare global {
  interface Window {
    __curoliaPerf?: CuroliaPerfProbe;
    /** Incremented on each MapLibre `idle` when `VITE_E2E=1` (E2E map settle detection). */
    __curoliaMapIdle?: number;
    /** Resolves when the map camera is not moving (E2E settle helper). */
    __curoliaMapWhenSettled?: () => Promise<void>;
  }
}

const E2E_ENABLED = import.meta.env.VITE_E2E === "1";

function createProbe(): CuroliaPerfProbe {
  const counters = new Map<string, number>();
  const timings = new Map<string, number[]>();
  const errors: string[] = [];
  let longTasks = 0;
  let layoutShifts = 0;

  const count = (name: string, delta = 1) => {
    counters.set(name, (counters.get(name) ?? 0) + delta);
  };

  const reset = () => {
    counters.clear();
    timings.clear();
    errors.length = 0;
    longTasks = 0;
    layoutShifts = 0;
  };

  const snapshot = (): CuroliaPerfSnapshot => ({
    counters: Object.fromEntries(counters),
    timings: Object.fromEntries(
      [...timings.entries()].map(([key, values]) => [key, [...values]]),
    ),
    longTasks,
    layoutShifts,
    errors: [...errors],
  });

  const recordTiming = (label: string, durationMs: number) => {
    const bucket = timings.get(label) ?? [];
    bucket.push(durationMs);
    timings.set(label, bucket);
  };

  const interaction = async <T>(
    label: string,
    fn: () => T | Promise<T>,
  ): Promise<T> => {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      recordTiming(label, performance.now() - start);
    }
  };

  const pushError = (message: string) => {
    if (errors.length < 50) errors.push(message);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
      pushError(event.error?.message ?? event.message);
    });
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      pushError(
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection",
      );
    });

    if (typeof PerformanceObserver !== "undefined") {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          longTasks += list.getEntries().length;
        });
        longTaskObserver.observe({ type: "longtask", buffered: true });
      } catch {
        // longtask not supported in this browser
      }

      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ("hadRecentInput" in entry && entry.hadRecentInput) continue;
            layoutShifts += 1;
          }
        });
        layoutShiftObserver.observe({
          type: "layout-shift",
          buffered: true,
        });
      } catch {
        // layout-shift not supported
      }
    }
  }

  return {
    count,
    reset,
    snapshot,
    recordTiming,
    interaction,
    getErrors: () => errors,
  };
}

let probeInstance: CuroliaPerfProbe | null = null;

export function getPerfProbe(): CuroliaPerfProbe | null {
  if (!E2E_ENABLED) return null;
  if (!probeInstance) {
    probeInstance = createProbe();
    if (typeof window !== "undefined") {
      window.__curoliaPerf = probeInstance;
    }
  }
  return probeInstance;
}

/** No-op in production; increments a named counter when E2E probe is active. */
export function perfCount(name: string, delta = 1): void {
  getPerfProbe()?.count(name, delta);
}

export function initPerfProbe(): void {
  getPerfProbe();
}
