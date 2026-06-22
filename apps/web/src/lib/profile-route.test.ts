import {
  isPublicProfileViewPathname,
  parsePublicProfilePathname,
  publicProfileHref,
} from "@/lib/profile-route";
import { describe, expect, it } from "vitest";

describe("parsePublicProfilePathname", () => {
  it("parses single-segment profile URLs", () => {
    expect(parsePublicProfilePathname("/joram")).toBe("joram");
    expect(parsePublicProfilePathname("/joram/")).toBe("joram");
  });

  it("skips reserved app routes", () => {
    expect(parsePublicProfilePathname("/profile")).toBeNull();
    expect(parsePublicProfilePathname("/settings")).toBeNull();
    expect(parsePublicProfilePathname("/plugins")).toBeNull();
    expect(parsePublicProfilePathname("/plugins-overview")).toBeNull();
    expect(parsePublicProfilePathname("/whats-new")).toBeNull();
    expect(parsePublicProfilePathname("/for/travel")).toBeNull();
  });
});

describe("isPublicProfileViewPathname", () => {
  it("matches public profile pages only", () => {
    expect(isPublicProfileViewPathname("/joram")).toBe(true);
    expect(isPublicProfileViewPathname("/joram/trip")).toBe(false);
    expect(isPublicProfileViewPathname("/profile")).toBe(false);
  });
});

describe("publicProfileHref", () => {
  it("builds profile homepage links", () => {
    expect(publicProfileHref("joram")).toBe("/joram");
  });
});
