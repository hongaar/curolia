import { describe, expect, it } from "vitest";

import { fetchPublicMapOwnerProfile } from "@/lib/fetch-public-map";

type Client = Parameters<typeof fetchPublicMapOwnerProfile>[1];

function clientReturning(rows: unknown[]): Client {
  return {
    rpc: async () => ({ data: rows, error: null }),
  } as unknown as Client;
}

describe("fetchPublicMapOwnerProfile", () => {
  it("maps the owner card including the gravatar hash", async () => {
    const owner = await fetchPublicMapOwnerProfile(
      "map-1",
      clientReturning([
        {
          profile_id: "u1",
          slug: "joram",
          display_name: "Joram",
          avatar_url: null,
          gravatar_hash: "abc",
          bio: "Traveler",
        },
      ]),
    );
    expect(owner).toEqual({
      displayName: "Joram",
      avatarUrl: null,
      gravatarHash: "abc",
      bio: "Traveler",
      profileSlug: "joram",
    });
  });

  it("falls back to the slug like the profile page, not 'Map owner'", async () => {
    const owner = await fetchPublicMapOwnerProfile(
      "map-1",
      clientReturning([
        {
          profile_id: "u1",
          slug: "joram",
          display_name: "  ",
          avatar_url: null,
          gravatar_hash: null,
          bio: null,
        },
      ]),
    );
    expect(owner?.displayName).toBe("joram");
  });

  it("returns null when the map owner is not visible", async () => {
    expect(await fetchPublicMapOwnerProfile("map-1", clientReturning([]))).toBe(
      null,
    );
  });
});
