import { afterEach, describe, expect, it, vi } from "vitest";

describe("umami", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    document.head.innerHTML = "";
    delete window.umami;
  });

  it("does not load the script when website id is unset", async () => {
    vi.stubEnv("VITE_UMAMI_WEBSITE_ID", "");
    const { initUmami, trackUmamiPageview } = await import("./umami");
    initUmami();
    await trackUmamiPageview("/maps");
    expect(document.querySelector("script[data-website-id]")).toBeNull();
  });

  it("tracks in-app navigation with a custom url", async () => {
    vi.stubEnv("VITE_UMAMI_WEBSITE_ID", "test-website-id");

    const script = document.createElement("script");
    script.setAttribute("data-website-id", "test-website-id");
    script.dataset.loaded = "true";
    document.head.appendChild(script);

    const track = vi.fn();
    window.umami = { track };

    const { trackUmamiPageview } = await import("./umami");
    await trackUmamiPageview("/maps/example");

    expect(track).toHaveBeenCalledOnce();
    const mapper = track.mock.calls[0]?.[0] as (
      props: Record<string, unknown>,
    ) => Record<string, unknown>;
    expect(mapper({ url: "/old" })).toEqual({ url: "/maps/example" });
  });
});
