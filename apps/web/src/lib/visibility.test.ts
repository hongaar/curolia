import { describe, expect, it } from "vitest";

import {
  MAP_VISIBILITY_HINTS,
  PROFILE_RESTRICTED_DETAILS,
  PROFILE_VISIBILITY_HINTS,
  PROFILE_VISIBILITY_LABELS,
  PROFILE_VISIBILITY_OPTIONS,
  VISIBILITY_LABELS,
  VISIBILITY_OPTIONS,
  isViewableByLink,
  isVisibility,
} from "@/lib/visibility";
import {
  MAP_VISIBILITY_SCHEME,
  PROFILE_VISIBILITY_SCHEME,
} from "@/lib/visibility-schemes";

describe("visibility", () => {
  it("maps use public / unlisted / private", () => {
    expect(VISIBILITY_OPTIONS).toEqual(["public", "unlisted", "private"]);
    expect(VISIBILITY_LABELS.unlisted).toBe("Unlisted");
  });

  it("profiles use public / restricted / private", () => {
    expect(PROFILE_VISIBILITY_OPTIONS).toEqual([
      "public",
      "restricted",
      "private",
    ]);
    expect(PROFILE_VISIBILITY_LABELS.restricted).toBe("Restricted");
  });

  it("uses the updated map hint copy", () => {
    expect(MAP_VISIBILITY_HINTS).toEqual({
      public: "Visible to anyone, including search engines and AI agents.",
      unlisted:
        "Visible to anyone with the link. Search engines and AI agents are asked not to index this map.",
      private: "Visible only to members of this map.",
    });
  });

  it("uses the updated profile hint copy", () => {
    expect(PROFILE_VISIBILITY_HINTS.public).toBe(
      "Visible to anyone, including search engines and AI agents.",
    );
    expect(PROFILE_VISIBILITY_HINTS.restricted).toBe(
      "Only followers you approve can see your profile. Search engines and AI agents are asked not to index your profile.",
    );
    expect(PROFILE_RESTRICTED_DETAILS).toMatch(/request to follow/);
  });

  it("schemes cover every option with a label and icon", () => {
    for (const scheme of [MAP_VISIBILITY_SCHEME, PROFILE_VISIBILITY_SCHEME]) {
      for (const option of scheme.options as readonly string[]) {
        expect((scheme.labels as Record<string, string>)[option]).toBeTruthy();
        expect((scheme.icons as Record<string, unknown>)[option]).toBeTruthy();
      }
    }
  });

  it("link viewability and type guard are map-only", () => {
    expect(isViewableByLink("public")).toBe(true);
    expect(isViewableByLink("unlisted")).toBe(true);
    expect(isViewableByLink("private")).toBe(false);
    expect(isVisibility("unlisted")).toBe(true);
    expect(isVisibility("restricted")).toBe(false);
  });
});
