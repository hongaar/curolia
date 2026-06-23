/** Increment a perf counter when the host app exposes `window.__curoliaPerf`. */
export function perfProbeCount(name: string, delta = 1): void {
  if (typeof window === "undefined") return;
  const probe = (
    window as Window & {
      __curoliaPerf?: { count: (name: string, delta?: number) => void };
    }
  ).__curoliaPerf;
  probe?.count(name, delta);
}
