import { describe, expect, it } from "vitest";
import { handle, type ApiDeps, type DbClient } from "./app.ts";
import { signUserJwt } from "./jwt.ts";

const USER = "11111111-1111-4111-8111-111111111111";
const KEY = "cur_live_abc123";
const RO_KEY = "cur_live_def456";

/** Chainable fake PostgREST builder that resolves to the queued result per table. */
function fakeDb(
  results: Record<string, unknown>,
): DbClient & { calls: string[] } {
  const calls: string[] = [];
  const builder = (table: string) => {
    const q: Record<string, unknown> = {};
    const chain =
      (name: string) =>
      (..._args: unknown[]) => {
        calls.push(`${table}.${name}`);
        return q;
      };
    for (const m of [
      "select",
      "eq",
      "in",
      "order",
      "range",
      "insert",
      "update",
      "delete",
      "upsert",
    ]) {
      q[m] = chain(m);
    }
    const done = { data: results[table] ?? null, error: null };
    q.single = () => Promise.resolve(done);
    q.maybeSingle = () => Promise.resolve(done);
    q.then = (r: (v: unknown) => unknown) => Promise.resolve(done).then(r);
    return q;
  };
  return { calls, from: builder, rpc: (fn: string) => builder(`rpc:${fn}`) };
}

function deps(db: DbClient): ApiDeps {
  return {
    plugins: [{ pluginTypeId: "poi", pin: { read: true, write: true } }],
    resolveKey: async (k) =>
      k === KEY
        ? { userId: USER, scopes: ["read", "write"] }
        : k === RO_KEY
          ? { userId: USER, scopes: ["read"] }
          : null,
    userClient: async () => db,
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
  it("serves profile under any base path and sets the alpha header", async () => {
    const db = fakeDb({ profiles: profileRow });
    for (const [path, basePath] of [
      ["/api/v1/profile", "/api"],
      ["/functions/v1/api/v1/profile", "/api"],
      ["/v1/profile", ""],
      ["/api/v1/profile", "/api/"],
    ] as const) {
      const res = await handle(req(path), deps(db), { basePath });
      expect(res.status).toBe(200);
      expect(res.headers.get("X-API-Status")).toBe("alpha");
      expect(await res.json()).toMatchObject({ id: USER, displayName: "Me" });
    }
  });

  it("rejects missing, unknown and under-scoped keys", async () => {
    const db = fakeDb({});
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
    const db = fakeDb({});
    expect((await handle(req("/v1/nope"), deps(db))).status).toBe(404);
    expect(
      (await handle(req("/v1/profile", { method: "DELETE" }), deps(db))).status,
    ).toBe(405);
    expect(
      (await handle(req("/other/v1/profile"), deps(db), { basePath: "/api" }))
        .status,
    ).toBe(404);
  });

  it("serves openapi without a key", async () => {
    const res = await handle(
      new Request("https://x.test/v1/openapi.json"),
      deps(fakeDb({})),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).info["x-status"]).toBe("alpha");
  });

  it("validates pin input", async () => {
    const db = fakeDb({ maps: { id: "m" } });
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

  it("returns 404 when a pin is not visible", async () => {
    const res = await handle(req("/v1/pins/p"), deps(fakeDb({ pins: null })));
    expect(res.status).toBe(404);
  });

  it("paginates with an opaque cursor", async () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({
      role: "owner",
      maps: { id: `m${i}`, name: "n", slug: "s", visibility: "private" },
    }));
    const res = await handle(
      req("/v1/maps?limit=2"),
      deps(fakeDb({ map_members: rows })),
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
      deps(fakeDb({})),
    );
    expect(res.status).toBe(404);
  });
});

describe("signUserJwt", () => {
  it("produces an HS256 token with the authenticated role", async () => {
    const token = await signUserJwt(USER, "secret", 60, 1000);
    const [h, p, sig] = token.split(".");
    expect(JSON.parse(atob(h!))).toEqual({ alg: "HS256", typ: "JWT" });
    expect(JSON.parse(atob(p!))).toMatchObject({
      sub: USER,
      role: "authenticated",
      exp: 1060,
    });
    expect(sig).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
