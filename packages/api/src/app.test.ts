import { describe, expect, it } from "vitest";
import { dbError, handle, type ApiDeps, type Db, type Row } from "./app.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const KEY = "cur_live_abc123";
const RO_KEY = "cur_live_def456";

type Route = [RegExp, (params: readonly unknown[]) => Row[]];

/** Fake SQL layer: the first matching route answers; wrapped selects get `{ r }` rows. */
function fakeDb(routes: Route[]): Db & { log: string[] } {
  const log: string[] = [];
  return {
    log,
    async query(text, params = []) {
      log.push(text);
      const route = routes.find(([re]) => re.test(text));
      const result = route ? route[1](params) : [];
      return text.startsWith("with x as") ? result.map((r) => ({ r })) : result;
    },
  };
}

function deps(db: Db, users: string[] = []): ApiDeps {
  return {
    plugins: [{ pluginTypeId: "poi", pin: { read: true, write: true } }],
    resolveKey: async (k) =>
      k === KEY
        ? { userId: USER, scopes: ["read", "write"] }
        : k === RO_KEY
          ? { userId: USER, scopes: ["read"] }
          : null,
    withUser: async (userId, fn) => {
      users.push(userId);
      return fn(db);
    },
  };
}

const req = (path: string, init: RequestInit & { key?: string } = {}) =>
  new Request(`https://example.test${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${init.key ?? KEY}`,
      "Content-Type": "application/json",
    },
  });

const profileRow = {
  id: USER,
  slug: "me",
  display_name: "Me",
  bio: null,
  avatar_url: null,
  visibility: "public",
  default_map_id: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("handle", () => {
  it("serves profile under any base path, as the key owner", async () => {
    const users: string[] = [];
    const db = fakeDb([[/from public\.profiles/, () => [profileRow]]]);
    for (const [path, basePath] of [
      ["/api/v1/profile", "/api"],
      ["/functions/v1/api/v1/profile", "/api"],
      ["/v1/profile", ""],
      ["/api/v1/profile", "/api/"],
    ] as const) {
      const res = await handle(req(path), deps(db, users), { basePath });
      expect(res.status).toBe(200);
      expect(res.headers.get("X-API-Status")).toBe("alpha");
      expect(await res.json()).toMatchObject({ id: USER, displayName: "Me" });
    }
    expect(users).toEqual([USER, USER, USER, USER]);
  });

  it("rejects missing, unknown and under-scoped keys", async () => {
    const db = fakeDb([]);
    const noKey = await handle(
      new Request("https://x.test/v1/profile"),
      deps(db),
    );
    expect(noKey.status).toBe(401);
    expect(
      (await handle(req("/v1/profile", { key: "cur_live_ffff" }), deps(db)))
        .status,
    ).toBe(401);
    const ro = await handle(
      req("/v1/maps", { method: "POST", key: RO_KEY, body: "{}" }),
      deps(db),
    );
    expect(ro.status).toBe(403);
    expect(await ro.json()).toMatchObject({
      error: { code: "insufficient_scope" },
    });
  });

  it("returns 404/405 for unknown routes and methods", async () => {
    const db = fakeDb([]);
    expect((await handle(req("/v1/nope"), deps(db))).status).toBe(404);
    expect(
      (await handle(req("/v1/profile", { method: "DELETE" }), deps(db))).status,
    ).toBe(405);
    expect(
      (
        await handle(req("/other/v1/profile"), deps(db), {
          basePath: "/api",
        })
      ).status,
    ).toBe(404);
  });

  it("serves openapi without a key", async () => {
    const res = await handle(
      new Request("https://x.test/v1/openapi.json"),
      deps(fakeDb([])),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).info["x-status"]).toBe("alpha");
  });

  it("validates pin input", async () => {
    const db = fakeDb([[/from public\.maps m/, () => [{ id: "m" }]]]);
    const bad = await handle(
      req("/v1/maps/m/pins", {
        method: "POST",
        body: JSON.stringify({ lat: 200, lng: 1 }),
      }),
      deps(db),
    );
    expect(bad.status).toBe(400);
    const unknown = await handle(
      req("/v1/maps/m/pins", {
        method: "POST",
        body: JSON.stringify({ lat: 1, lng: 1, foo: 1 }),
      }),
      deps(db),
    );
    expect(await unknown.json()).toMatchObject({
      error: { message: "Unknown field(s): foo" },
    });
  });

  it("passes pin fields as parameters, never inline", async () => {
    const db = fakeDb([
      [/from public\.maps m/, () => [{ id: "m" }]],
      [/insert into public\.pins/, () => [{ id: "p", map_id: "m" }]],
    ]);
    const res = await handle(
      req("/v1/maps/m/pins", {
        method: "POST",
        body: JSON.stringify({
          lat: 1,
          lng: 2,
          title: "x'; drop table pins;--",
        }),
      }),
      deps(db),
    );
    expect(res.status).toBe(201);
    const insert = db.log.find((q) => q.includes("insert into public.pins"))!;
    expect(insert).not.toContain("drop table");
    expect(insert).toContain("(map_id, title, lat, lng)");
  });

  it("returns 404 when a pin is not visible", async () => {
    const res = await handle(req("/v1/pins/p"), deps(fakeDb([])));
    expect(res.status).toBe(404);
  });

  it("paginates with an opaque cursor", async () => {
    const maps = Array.from({ length: 3 }, (_, i) => ({
      id: `m${i}`,
      name: "n",
      slug: "s",
      visibility: "private",
      role: "owner",
    }));
    const res = await handle(
      req("/v1/maps?limit=2"),
      deps(fakeDb([[/from public\.map_members mm/, () => maps]])),
    );
    const body = await res.json();
    expect(body.data).toHaveLength(2);
    expect(body.nextCursor).toBe(btoa("2"));
  });

  it("rejects plugin writes for plugins that do not expose them", async () => {
    const res = await handle(
      req("/v1/maps/m/plugins/poi", {
        method: "PUT",
        body: JSON.stringify({ config: {} }),
      }),
      deps(fakeDb([])),
    );
    expect(res.status).toBe(404);
  });

  it("maps database errors to API errors", async () => {
    const db: Db = {
      query: async () => {
        throw Object.assign(new Error("dup"), { code: "23505" });
      },
    };
    const res = await handle(
      req("/v1/profile", { method: "PATCH", body: '{"slug":"taken"}' }),
      deps(db),
    );
    expect(res.status).toBe(409);
    expect(dbError({ code: "22P02" }).status).toBe(404);
    expect(dbError({ code: "42501" }).status).toBe(403);
  });
});
