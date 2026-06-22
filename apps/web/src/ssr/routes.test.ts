import { describe, expect, it } from "vitest";

import { isSsrPathname, matchSsrRoute } from "@/ssr/routes";

describe("matchSsrRoute", () => {
  it("matches marketing and legal static routes", () => {
    expect(matchSsrRoute("/")).toEqual({ kind: "static", id: "home" });
    expect(matchSsrRoute("/privacy")).toEqual({
      kind: "static",
      id: "privacy",
    });
    expect(matchSsrRoute("/open-source")).toEqual({
      kind: "static",
      id: "openSource",
    });
    expect(matchSsrRoute("/plugins-overview")).toEqual({
      kind: "static",
      id: "pluginsOverview",
    });
    expect(matchSsrRoute("/for/travel/")).toEqual({
      kind: "static",
      id: "campaign",
      campaignId: "travel",
    });
  });

  it("matches public blog and pin detail routes", () => {
    expect(matchSsrRoute("/joram/europe/blog")).toEqual({
      kind: "blog",
      profileSlug: "joram",
      mapSlug: "europe",
    });
    expect(matchSsrRoute("/joram/europe/pin/paris")).toEqual({
      kind: "pin",
      profileSlug: "joram",
      mapSlug: "europe",
      pinSlug: "paris",
    });
  });

  it("does not match authenticated app routes or legacy paths", () => {
    expect(matchSsrRoute("/login")).toBeNull();
    expect(matchSsrRoute("/joram/europe/map")).toBeNull();
    expect(matchSsrRoute("/joram/europe/pin/paris/edit")).toBeNull();
    expect(matchSsrRoute("/settings")).toBeNull();
    expect(matchSsrRoute("/blog/europe")).toBeNull();
    expect(matchSsrRoute("/pins/europe/paris")).toBeNull();
  });
});

describe("isSsrPathname", () => {
  it("reflects matchSsrRoute", () => {
    expect(isSsrPathname("/contact")).toBe(true);
    expect(isSsrPathname("/profile")).toBe(false);
  });
});
