import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { authAvailable, authFile } from "../fixtures/auth.ts";
import { seed } from "../fixtures/seed.ts";
import { expect, test } from "../fixtures/test.ts";

/**
 * Restricted profiles + follow requests (RLS / RPC level) and the map sharing
 * settings UI. Temporary users are created per run and removed afterwards.
 */

const PASSWORD = "e2e-Restricted-pw-1!";

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function adminClient(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function anonClient(): SupabaseClient {
  return createClient(
    env("SUPABASE_URL"),
    env("VITE_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

type TempUser = {
  id: string;
  slug: string;
  displayName: string;
  client: SupabaseClient;
};

async function createTempUser(
  admin: SupabaseClient,
  label: string,
  visibility: "public" | "restricted" | "private",
): Promise<TempUser> {
  const suffix = randomUUID().slice(0, 8);
  const email = `e2e-${label}-${suffix}@example.test`;
  const slug = `e2e-${label}-${suffix}`;
  const displayName = `E2E ${label} ${suffix}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error) throw error;
  const id = data.user.id;
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id,
      slug,
      display_name: displayName,
      visibility,
      onboarding_completed: true,
    },
    { onConflict: "id" },
  );
  if (profileError) throw profileError;

  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (signInError) throw signInError;
  return { id, slug, displayName, client };
}

/** Signup creates a default map, so remove the user's maps before the user. */
async function deleteTempUser(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error: mapsError } = await admin
    .from("maps")
    .delete()
    .eq("created_by_user_id", userId);
  if (mapsError) throw mapsError;
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw error;
}

async function createMap(
  admin: SupabaseClient,
  owner: TempUser,
  name: string,
  visibility: "public" | "unlisted" | "private",
  showOnProfile = false,
): Promise<string> {
  const id = randomUUID();
  const { error } = await admin.from("maps").insert({
    id,
    name,
    slug: `${name.toLowerCase().replace(/\W+/g, "-")}-${id.slice(0, 6)}`,
    created_by_user_id: owner.id,
    visibility,
    show_on_profile: showOnProfile,
  });
  if (error) throw error;
  const { error: memberError } = await admin
    .from("map_members")
    .upsert(
      { map_id: id, user_id: owner.id, role: "owner" },
      { onConflict: "map_id,user_id" },
    );
  if (memberError) throw memberError;
  return id;
}

async function notificationTypes(
  client: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from("notifications")
    .select("type")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => row.type as string);
}

async function expectFollowLists(
  client: SupabaseClient,
  profileId: string,
  { visible }: { visible: boolean },
): Promise<void> {
  const [followers, following, followerCount, followingCount] =
    await Promise.all([
      client.rpc("list_profile_followers", { p_profile_id: profileId }),
      client.rpc("list_profile_following", { p_profile_id: profileId }),
      client.rpc("profile_follower_count", { p_profile_id: profileId }),
      client.rpc("profile_following_count", { p_profile_id: profileId }),
    ]);
  if (visible) {
    expect(followers.data.length).toBeGreaterThan(0);
    expect(following.data.length).toBeGreaterThan(0);
    expect(Number(followerCount.data)).toBeGreaterThan(0);
    expect(Number(followingCount.data)).toBeGreaterThan(0);
  } else {
    expect(followers.data).toEqual([]);
    expect(following.data).toEqual([]);
    expect(Number(followerCount.data)).toBe(0);
    expect(Number(followingCount.data)).toBe(0);
  }
}

test.describe("restricted profiles (database)", () => {
  const admin = adminClient();
  const created: string[] = [];

  test.afterAll(async () => {
    for (const id of created) await deleteTempUser(admin, id);
  });

  test("follow requests need approval and gate profile maps", async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "database flow runs once",
    );

    const owner = await createTempUser(admin, "owner", "restricted");
    const viewer = await createTempUser(admin, "viewer", "public");
    created.push(owner.id, viewer.id);

    await admin
      .from("profiles")
      .update({ bio: "secret bio" })
      .eq("id", owner.id);
    const publicMap = await createMap(admin, owner, "Public", "public");
    const optInMap = await createMap(admin, owner, "OptIn", "unlisted", true);
    const hiddenUnlisted = await createMap(admin, owner, "Hidden", "unlisted");
    const privateMap = await createMap(admin, owner, "Private", "private");
    // Owner follows the viewer so the owner's "following" list is non-empty.
    await owner.client.rpc("follow_profile", { p_following_id: viewer.id });

    // Signed out: slug resolves with visibility, but the profile row stays
    // hidden even though the owner has a public map.
    const anon = anonClient();
    const { data: resolved } = await anon.rpc("resolve_profile_slug", {
      p_slug: owner.slug,
    });
    expect(resolved[0]).toMatchObject({
      profile_id: owner.id,
      visibility: "restricted",
    });
    for (const client of [anon, viewer.client]) {
      const { data: row } = await client
        .from("profiles")
        .select("id, bio")
        .eq("id", owner.id)
        .maybeSingle();
      expect(row).toBeNull();
    }

    // Public map attribution: name and slug only, no bio.
    const { data: ownerCard } = await anon.rpc("get_map_owner_card", {
      p_map_id: publicMap,
    });
    expect(ownerCard[0]).toMatchObject({
      slug: owner.slug,
      display_name: owner.displayName,
      bio: null,
    });
    const { data: privateCard } = await anon.rpc("get_map_owner_card", {
      p_map_id: privateMap,
    });
    expect(privateCard).toEqual([]);

    // Signed in, not following: card only, no maps, no follow lists.
    const { data: card, error: cardError } = await viewer.client.rpc(
      "get_restricted_profile_card",
      { p_slug: owner.slug },
    );
    expect(cardError).toBeNull();
    expect(card).toHaveLength(1);
    expect(card[0]).toMatchObject({
      id: owner.id,
      display_name: owner.displayName,
      follow_status: null,
    });
    const { data: idsBefore } = await viewer.client.rpc(
      "list_profile_map_ids",
      { p_profile_id: owner.id },
    );
    expect(idsBefore).toEqual([]);
    await expectFollowLists(viewer.client, owner.id, { visible: false });

    // A direct insert cannot skip approval.
    const { error: bypassError } = await viewer.client
      .from("profile_follows")
      .insert({
        follower_id: viewer.id,
        following_id: owner.id,
        status: "approved",
      });
    expect(bypassError).not.toBeNull();

    // Request → pending, the owner is notified.
    const { data: status, error: followError } = await viewer.client.rpc(
      "follow_profile",
      { p_following_id: owner.id },
    );
    expect(followError).toBeNull();
    expect(status).toBe("pending");
    expect(await notificationTypes(owner.client, owner.id)).toContain(
      "profile_follow_request",
    );

    const { data: pending } = await owner.client.rpc(
      "list_pending_follow_requests",
    );
    expect(
      pending.map((row: { profile_id: string }) => row.profile_id),
    ).toEqual([viewer.id]);
    const { data: countPending } = await owner.client.rpc(
      "profile_follower_count",
      { p_profile_id: owner.id },
    );
    expect(Number(countPending)).toBe(0);

    // Pending followers still see nothing.
    const { data: idsPending } = await viewer.client.rpc(
      "list_profile_map_ids",
      { p_profile_id: owner.id },
    );
    expect(idsPending).toEqual([]);
    await expectFollowLists(viewer.client, owner.id, { visible: false });

    // Only the owner can approve.
    const { error: selfApprove } = await viewer.client.rpc(
      "approve_follow_request",
      { p_follower_id: viewer.id },
    );
    expect(selfApprove).not.toBeNull();

    const { error: approveError } = await owner.client.rpc(
      "approve_follow_request",
      { p_follower_id: viewer.id },
    );
    expect(approveError).toBeNull();
    expect(await notificationTypes(viewer.client, viewer.id)).toContain(
      "profile_follow_approved",
    );

    await expectFollowLists(viewer.client, owner.id, { visible: true });

    // Approved: full profile, public + opt-in unlisted maps, followed feed.
    const { data: approvedRow } = await viewer.client
      .from("profiles")
      .select("id")
      .eq("id", owner.id)
      .maybeSingle();
    expect(approvedRow?.id).toBe(owner.id);

    const { data: idsAfter } = await viewer.client.rpc("list_profile_map_ids", {
      p_profile_id: owner.id,
    });
    expect([...(idsAfter as string[])].sort()).toEqual(
      [publicMap, optInMap].sort(),
    );
    expect(idsAfter).not.toContain(hiddenUnlisted);
    expect(idsAfter).not.toContain(privateMap);

    const { data: feed } = await viewer.client.rpc(
      "list_followed_recent_public_maps",
      { p_limit: 50 },
    );
    const feedIds = (feed as { map_id: string }[]).map((row) => row.map_id);
    expect(feedIds).toEqual(expect.arrayContaining([publicMap, optInMap]));
    expect(feedIds).not.toContain(hiddenUnlisted);

    const { data: countApproved } = await owner.client.rpc(
      "profile_follower_count",
      { p_profile_id: owner.id },
    );
    expect(Number(countApproved)).toBe(1);
  });

  test("declining removes the request; public profiles approve instantly", async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "database flow runs once",
    );

    const owner = await createTempUser(admin, "decl", "restricted");
    const viewer = await createTempUser(admin, "declv", "public");
    created.push(owner.id, viewer.id);

    await viewer.client.rpc("follow_profile", { p_following_id: owner.id });
    const { error: declineError } = await owner.client.rpc(
      "decline_follow_request",
      { p_follower_id: viewer.id },
    );
    expect(declineError).toBeNull();
    const { data: afterDecline } = await viewer.client.rpc(
      "profile_follow_status",
      { p_following_id: owner.id },
    );
    expect(afterDecline).toBeNull();

    // Pending requests become approved when the profile goes public.
    await viewer.client.rpc("follow_profile", { p_following_id: owner.id });
    await owner.client.rpc("set_profile_visibility", {
      p_visibility: "public",
    });
    const { data: afterPublic } = await viewer.client.rpc(
      "profile_follow_status",
      { p_following_id: owner.id },
    );
    expect(afterPublic).toBe("approved");

    // Owners can remove an existing follower.
    await owner.client.rpc("set_profile_visibility", {
      p_visibility: "restricted",
    });
    const { error: removeError } = await owner.client.rpc("remove_follower", {
      p_follower_id: viewer.id,
    });
    expect(removeError).toBeNull();
    const { data: afterRemove } = await viewer.client.rpc(
      "profile_follow_status",
      { p_following_id: owner.id },
    );
    expect(afterRemove).toBeNull();

    // Following a public profile is immediate.
    const { data: reverse } = await owner.client.rpc("follow_profile", {
      p_following_id: viewer.id,
    });
    expect(reverse).toBe("approved");
  });
});

test.describe("restricted profile page", () => {
  const admin = adminClient();
  let owner: TempUser | null = null;

  test.beforeAll(async () => {
    owner = await createTempUser(admin, "page", "restricted");
  });

  test.afterAll(async () => {
    if (owner) await deleteTempUser(admin, owner.id);
  });

  test("signed-out visitors get a sign-in prompt", async ({
    page,
    consoleErrors,
  }) => {
    await page.goto(`/${owner!.slug}`);
    await expect(
      page.getByRole("heading", { name: "Restricted profile" }),
    ).toBeVisible();
    await expect(page.getByText(owner!.displayName)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Sign in" }).first(),
    ).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
    expect(consoleErrors).toEqual([]);
  });

  test.describe("signed in", () => {
    test.beforeEach(() => {
      if (!authAvailable()) test.skip();
    });
    test.use({ storageState: authFile });

    test("can see the card and request to follow", async ({
      page,
      consoleErrors,
    }) => {
      await page.goto(`/${owner!.slug}`);
      await expect(page.getByText(owner!.displayName)).toBeVisible();
      const request = page.getByRole("button", { name: "Request to follow" });
      await expect(request).toBeVisible();
      await request.click();
      await expect(
        page.getByRole("button", { name: "Requested" }),
      ).toBeVisible();
      await expect(
        page.getByText(/Maps are visible once it.s approved/),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: /^Followers/ }),
      ).toHaveCount(0);

      const { data } = await admin
        .from("profile_follows")
        .select("status")
        .eq("follower_id", seed.userId)
        .eq("following_id", owner!.id)
        .single();
      expect(data?.status).toBe("pending");
      expect(consoleErrors).toEqual([]);
    });
  });
});

test.describe("map sharing settings", () => {
  test.beforeEach(() => {
    if (!authAvailable()) test.skip();
  });
  test.use({ storageState: authFile });

  test.afterEach(async () => {
    await adminClient()
      .from("maps")
      .update({ visibility: "public", show_on_profile: false })
      .eq("id", seed.secondaryMapId);
  });

  test("owner role dropdown, transfer dialog and unlisted toggle", async ({
    page,
    consoleErrors,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop settings page",
    );

    await page.goto(`/${seed.profileSlug}/${seed.secondaryMapSlug}/settings`);

    const headings = page.getByRole("heading", {
      name: /^(Members|Pending invitations|Invite by email|Visibility)$/,
    });
    await expect(headings.first()).toHaveText("Members");

    // The owner row has a dropdown, with no separate role label.
    const role = page.getByRole("combobox", { name: "Role" }).first();
    await expect(role).toHaveText(/Owner/);
    await expect(
      page.getByRole("heading", { name: "Transfer ownership" }),
    ).toHaveCount(0);
    await role.click();
    await page.getByRole("option", { name: "Transfer ownership…" }).click();
    const dialog = page.getByRole("dialog", { name: "Transfer ownership" });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(role).toHaveText(/Owner/);

    // New copy and the unlisted opt-in.
    await expect(
      page.getByText("Visible only to members of this map."),
    ).toBeVisible();
    const checkbox = page.getByRole("checkbox", {
      name: "Visible to followers",
    });
    await expect(checkbox).toBeDisabled();
    await page.getByText("Unlisted", { exact: true }).click();
    await expect(checkbox).toBeEnabled();
    await page.getByRole("button", { name: "Visible to followers" }).hover();
    await expect(
      page.getByText(
        /To choose who can follow you, make your profile restricted/,
      ),
    ).toBeVisible();
    await checkbox.click();
    await expect
      .poll(async () => {
        const { data } = await adminClient()
          .from("maps")
          .select("show_on_profile")
          .eq("id", seed.secondaryMapId)
          .single();
        return data?.show_on_profile;
      })
      .toBe(true);

    expect(consoleErrors).toEqual([]);
  });
});

test.describe("profile settings", () => {
  test.beforeEach(() => {
    if (!authAvailable()) test.skip();
  });
  test.use({ storageState: authFile });

  test("restricted option has short help and a Learn more tip", async ({
    page,
    consoleErrors,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "hover tooltip on desktop",
    );
    await page.goto("/profile");
    await expect(
      page.getByText(
        "Only followers you approve can see your profile. Search engines and AI agents are asked not to index your profile.",
      ),
    ).toBeVisible();
    const tip = page.getByRole("button", { name: "Learn more" });
    await tip.hover();
    const body = page.getByText(/You approve each request/);
    await expect(body).toBeVisible();
    // Not hidden behind the option cards.
    expect(
      await body.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const top = document.elementFromPoint(
          r.x + r.width / 2,
          r.y + r.height / 2,
        );
        return Boolean(top && (el === top || el.contains(top)));
      }),
    ).toBe(true);
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("profile follow requests indicator", () => {
  const admin = adminClient();
  let requester: TempUser | null = null;

  test.beforeEach(() => {
    if (!authAvailable()) test.skip();
  });
  test.use({ storageState: authFile });

  test.afterEach(async () => {
    if (requester) await deleteTempUser(admin, requester.id);
    requester = null;
  });

  test("followers trigger shows a dot for pending requests", async ({
    page,
    consoleErrors,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-chromium",
      "desktop profile popover",
    );
    requester = await createTempUser(admin, "req", "public");
    // Admin insert: keep the seeded profile public for parallel specs.
    const { error } = await admin.from("profile_follows").insert({
      follower_id: requester.id,
      following_id: seed.userId,
      status: "pending",
    });
    if (error) throw error;

    await page.goto(`/${seed.profileSlug}`);
    const followers = page.getByRole("button", {
      name: /^Followers: .*pending follow requests$/,
    });
    await expect(followers).toBeVisible();
    await expect(
      page.getByRole("button", { name: /^Following: \d+$/ }),
    ).toBeVisible();
    await followers.click();
    await expect(page.getByText(requester.displayName)).toBeVisible();
    await page
      .getByRole("listitem")
      .filter({ hasText: requester.displayName })
      .getByRole("button", { name: "Decline" })
      .click();
    await expect(
      page.getByRole("button", { name: /^Followers: \d+$/ }),
    ).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("restricted profile seen by a map member", () => {
  const admin = adminClient();
  let owner: TempUser | null = null;
  let mapName = "";

  test.beforeEach(() => {
    if (!authAvailable()) test.skip();
  });
  test.use({ storageState: authFile });

  test.afterEach(async () => {
    if (owner) await deleteTempUser(admin, owner.id);
    owner = null;
  });

  test("members see shared maps but not follow lists", async ({
    page,
    consoleErrors,
  }) => {
    owner = await createTempUser(admin, "member", "restricted");
    mapName = `Member map ${owner.id.slice(0, 6)}`;
    const mapId = await createMap(admin, owner, mapName, "private");
    const { error } = await admin
      .from("map_members")
      .insert({ map_id: mapId, user_id: seed.userId, role: "viewer" });
    if (error) throw error;

    await page.goto(`/${owner.slug}`);
    await expect(page.getByText(owner.displayName)).toBeVisible();
    await expect(page.getByText(mapName)).toBeVisible();
    await expect(page.getByRole("button", { name: /^Followers/ })).toHaveCount(
      0,
    );
    await expect(page.getByRole("button", { name: /^Following/ })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Request to follow" }),
    ).toBeVisible();
    expect(consoleErrors).toEqual([]);
  });
});

test.describe("map author card", () => {
  const admin = adminClient();
  let owner: TempUser | null = null;

  test.afterEach(async () => {
    if (owner) await deleteTempUser(admin, owner.id);
    owner = null;
  });

  test("falls back to the profile slug when there is no display name", async ({
    page,
    consoleErrors,
  }) => {
    owner = await createTempUser(admin, "author", "public");
    await admin
      .from("profiles")
      .update({ display_name: null })
      .eq("id", owner.id);
    const mapId = await createMap(admin, owner, "Author map", "public");
    const { data: map } = await admin
      .from("maps")
      .select("slug")
      .eq("id", mapId)
      .single();

    await page.goto(`/${owner.slug}/${map!.slug}/blog`);
    const author = page.getByRole("link", { name: owner.slug }).first();
    await expect(author).toBeVisible();
    await expect(page.getByText("Map owner")).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });
});
