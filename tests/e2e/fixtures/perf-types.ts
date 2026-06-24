export type CuroliaPerfSnapshot = {
  counters: Record<string, number>;
  timings: Record<string, number[]>;
  longTasks: number;
  layoutShifts: number;
  errors: string[];
};

declare global {
  interface Window {
    __curoliaPerf?: {
      reset: () => void;
      snapshot: () => CuroliaPerfSnapshot;
    };
    __curoliaMapIdle?: number;
    __curoliaMapWhenSettled?: () => Promise<void>;
  }
}

export {};
