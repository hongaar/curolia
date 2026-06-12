import { describe, expect, it, vi } from "vitest";

import { renderSsrRoute } from "@/ssr/render";

vi.mock("@/lib/fetch-public-map", () => ({
  fetchPublicMapByRoute: vi.fn().mockResolvedValue(null),
  fetchPublicMapOwnerProfile: vi.fn(),
}));

const template =
  '<html><head><title>x</title></head><body><div id="root"></div></body></html>';

describe("renderSsrRoute", () => {
  it("returns null for pin routes when the map is not publicly readable", async () => {
    const result = await renderSsrRoute(
      { kind: "pin", profileSlug: "a", mapSlug: "b", pinSlug: "c" },
      "/a/b/pin/c",
      "https://curolia.com",
      template,
    );
    expect(result).toBeNull();
  });

  it("returns null for blog routes when the map is not publicly readable", async () => {
    const result = await renderSsrRoute(
      { kind: "blog", profileSlug: "a", mapSlug: "b" },
      "/a/b/blog",
      "https://curolia.com",
      template,
    );
    expect(result).toBeNull();
  });
});
