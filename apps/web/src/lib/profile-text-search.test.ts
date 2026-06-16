import { describe, expect, it } from "vitest";
import {
  normalizeProfileSearchQuery,
  profileSearchSubtitle,
  profileSearchTitle,
  type ProfileSearchRow,
} from "./profile-text-search";

describe("normalizeProfileSearchQuery", () => {
  it("strips a leading @ for handle lookups", () => {
    expect(normalizeProfileSearchQuery("@joram")).toBe("joram");
  });

  it("sanitizes unsafe fragments", () => {
    expect(normalizeProfileSearchQuery("  foo,bar%  ").trimEnd()).toBe(
      "foo bar",
    );
  });
});

describe("profileSearchTitle", () => {
  it("prefers display name over slug", () => {
    const row: ProfileSearchRow = {
      id: "1",
      slug: "joram",
      display_name: "Joram",
      avatar_url: null,
      gravatar_hash: null,
      is_public: true,
    };
    expect(profileSearchTitle(row)).toBe("Joram");
  });
});

describe("profileSearchSubtitle", () => {
  it("shows @handle when it differs from display name", () => {
    const row: ProfileSearchRow = {
      id: "1",
      slug: "joram",
      display_name: "Joram",
      avatar_url: null,
      gravatar_hash: null,
      is_public: true,
    };
    expect(profileSearchSubtitle(row)).toBe("@joram");
  });
});
