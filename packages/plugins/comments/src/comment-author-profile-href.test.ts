import { describe, expect, it } from "vitest";

import { commentAuthorProfileHref } from "./comment-author-profile-href";
import type { PinCommentRow } from "./types";

function comment(overrides: Partial<PinCommentRow> = {}): PinCommentRow {
  return {
    id: "c1",
    pin_id: "p1",
    map_id: "m1",
    author_user_id: "u1",
    author_display_name: "Joram",
    author_guest_id: null,
    body: "Hello",
    created_at: "2026-06-12T10:00:00Z",
    updated_at: "2026-06-12T10:00:00Z",
    author_profile: {
      avatar_url: null,
      gravatar_hash: null,
      slug: "joram",
    },
    ...overrides,
  };
}

describe("commentAuthorProfileHref", () => {
  it("returns a profile path when the author has a slug", () => {
    expect(commentAuthorProfileHref(comment())).toBe("/joram");
  });

  it("returns undefined for guest comments", () => {
    expect(
      commentAuthorProfileHref(
        comment({
          author_user_id: null,
          author_guest_id: "guest-1",
          author_profile: null,
        }),
      ),
    ).toBeUndefined();
  });

  it("returns undefined when the profile slug is missing", () => {
    expect(
      commentAuthorProfileHref(
        comment({
          author_profile: {
            avatar_url: null,
            gravatar_hash: null,
            slug: null,
          },
        }),
      ),
    ).toBeUndefined();
  });
});
