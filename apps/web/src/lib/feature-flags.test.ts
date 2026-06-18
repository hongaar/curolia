import { afterEach, describe, expect, it, vi } from "vitest";

describe("featureFlags", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("disables home recently visited by default", async () => {
    vi.stubEnv("VITE_FEATURE_HOME_RECENTLY_VISITED", "");
    const { featureFlags } = await import("./feature-flags");
    expect(featureFlags.homeRecentlyVisited).toBe(false);
  });

  it("enables home recently visited when env is true", async () => {
    vi.stubEnv("VITE_FEATURE_HOME_RECENTLY_VISITED", "true");
    const { featureFlags } = await import("./feature-flags");
    expect(featureFlags.homeRecentlyVisited).toBe(true);
  });
});
