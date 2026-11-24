import {
  MAP_COLUMNS,
  PIN_COLUMNS,
  PROFILE_COLUMNS,
  toMap,
  toPin,
  toProfile,
  type ApiMap,
  type ApiPin,
} from "./dto.ts";
import {
  ApiError,
  badRequest,
  errorResponse,
  json,
  notFound,
  preflight,
  readJsonBody,
} from "./http.ts";
import { openApiDocument } from "./openapi.ts";
import { Router, type Params } from "./router.ts";
import {
  defined,
  optDate,
  optEnum,
  optNumber,
  optString,
  rejectUnknownKeys,
} from "./validate.ts";

export type Row = Record<string, unknown>;

/**
 * SQL access for one request. Statements run inside a transaction as the
 * `authenticated` role with the key owner's JWT claims, so RLS and
 * `auth.uid()`-based functions apply exactly as they do in the app.
 */
export type Db = {
  /** Runs `text` with positional `$1…` params (jsonb columns decoded to objects). */
  query(text: string, params?: readonly unknown[]): Promise<Row[]>;
};

export type ApiScope = "read" | "write";

export type ApiPluginEntry = {
  pluginTypeId: string;
  map?: { read?: boolean; write?: boolean; mapConfigKeys: readonly string[] };
  pin?: { read?: boolean; write?: boolean };
};

export type ApiDeps = {
  /** Resolves a plaintext API key; `null` when unknown or revoked. */
  resolveKey(key: string): Promise<{ userId: string; scopes: string[] } | null>;
  /** Runs `fn` with a {@link Db} that acts as `userId` (RLS applies). */
  withUser<T>(userId: string, fn: (db: Db) => Promise<T>): Promise<T>;
  plugins: readonly ApiPluginEntry[];
};

export type HandleOptions = {
  /** Path prefix in front of `/v1` (e.g. `/api` for the Supabase function, `""` on `api.curolia.com`). */
  basePath?: string;
};

type Ctx = {
  req: Request;
  url: URL;
  db: Db;
  userId: string;
  plugins: readonly ApiPluginEntry[];
};

const VISIBILITIES = ["public", "unlisted", "private"] as const;
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

/** Maps Postgres error codes to API errors. */
export function dbError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  const code = (err as { code?: string } | null)?.code;
  switch (code) {
    case "42501":
    case "P0001":
      return new ApiError(403, "forbidden", "Not allowed");
    case "23505":
      return new ApiError(
        409,
        "conflict",
        "A resource with these values already exists",
      );
    case "22P02":
      return notFound();
    case "23502":
    case "23514":
    case "22007":
    case "22008":
    case "22001":
      return badRequest("Invalid value");
    default:
      console.error("api: database error", err);
      return new ApiError(500, "internal_error", "Unexpected database error");
  }
}

/**
 * `with x as (…) select to_jsonb(x)` wrapper so rows come back with
 * PostgREST-style JSON values. A CTE (not a subquery) so DML `returning` works.
 */
async function rows(
  ctx: Ctx,
  text: string,
  params: unknown[] = [],
): Promise<Row[]> {
  const result = await ctx.db.query(
    `with x as (${text}) select to_jsonb(x) as r from x`,
    params,
  );
  return result.map((row) => row.r as Row);
}

async function one(ctx: Ctx, text: string, params: unknown[] = []) {
  return (await rows(ctx, text, params))[0] ?? null;
}

/**
 * JSON params are cast via `::text` so drivers send the string as-is
 * (casting straight to `jsonb` makes some drivers JSON-encode it twice).
 */
const jsonParam = (i: number) => `$${i}::text::jsonb`;

/** `= any(...)` over a JSON-encoded array param. */
const anyOf = (i: number, type: "uuid" | "text") =>
  `any(array(select jsonb_array_elements_text(${jsonParam(i)}))::${type}[])`;

/** Builds `col = $n, …` for whitelisted columns; values appended to `params`. */
function setClause(patch: Row, params: unknown[]): string {
  return Object.entries(patch)
    .map(([col, v]) => {
      params.push(v);
      return `${col} = $${params.length}`;
    })
    .join(", ");
}

function page(url: URL): { offset: number; limit: number } {
  const limitRaw = url.searchParams.get("limit");
  const limit = limitRaw === null ? DEFAULT_LIMIT : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw badRequest(`limit must be an integer between 1 and ${MAX_LIMIT}`);
  }
  const cursor = url.searchParams.get("cursor");
  let offset = 0;
  if (cursor) {
    try {
      offset = Number(atob(cursor));
    } catch {
      offset = -1;
    }
    if (!Number.isInteger(offset) || offset < 0) {
      throw badRequest("Invalid cursor");
    }
  }
  return { offset, limit };
}

function listResponse<T>(items: T[], offset: number, limit: number): Response {
  const hasMore = items.length > limit;
  return json({
    data: items.slice(0, limit),
    nextCursor: hasMore ? btoa(String(offset + limit)) : null,
  });
}

const wantsPlugins = (url: URL) =>
  (url.searchParams.get("include") ?? "").split(",").includes("plugins");

function pickKeys(cfg: unknown, keys: readonly string[]): Row {
  const o = cfg && typeof cfg === "object" ? (cfg as Row) : {};
  return Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
}

type EnabledPlugin = {
  map_id: string;
  plugin_type_id: string;
  config: unknown;
};

async function enabledPlugins(ctx: Ctx, mapIds: string[]) {
  if (!mapIds.length || !ctx.plugins.length) return [] as EnabledPlugin[];
  return (await rows(
    ctx,
    `select map_id, plugin_type_id, config from public.map_plugins
     where map_id = ${anyOf(1, "uuid")} and enabled
       and plugin_type_id = ${anyOf(2, "text")}`,
    [
      JSON.stringify(mapIds),
      JSON.stringify(ctx.plugins.map((p) => p.pluginTypeId)),
    ],
  )) as EnabledPlugin[];
}

async function attachMapPlugins(ctx: Ctx, maps: ApiMap[]): Promise<void> {
  for (const m of maps) m.plugins = {};
  const enabled = await enabledPlugins(
    ctx,
    maps.map((m) => m.id),
  );
  for (const r of enabled) {
    const entry = ctx.plugins.find((p) => p.pluginTypeId === r.plugin_type_id);
    if (!entry?.map?.read) continue;
    const map = maps.find((m) => m.id === r.map_id);
    if (map) {
      map.plugins![r.plugin_type_id] = pickKeys(
        r.config,
        entry.map.mapConfigKeys,
      );
    }
  }
}

async function attachPinPlugins(ctx: Ctx, pins: ApiPin[]): Promise<void> {
  for (const p of pins) p.plugins = {};
  const readable = ctx.plugins
    .filter((p) => p.pin?.read)
    .map((p) => p.pluginTypeId);
  if (!pins.length || !readable.length) return;
  const enabled = await enabledPlugins(ctx, [
    ...new Set(pins.map((p) => p.mapId)),
  ]);
  const data = await rows(
    ctx,
    `select entity_id, plugin_type_id, data from public.plugin_entity_data
     where entity_type = 'pin' and entity_id = ${anyOf(1, "uuid")}
       and plugin_type_id = ${anyOf(2, "text")}`,
    [JSON.stringify(pins.map((p) => p.id)), JSON.stringify(readable)],
  );
  for (const r of data) {
    const pin = pins.find((p) => p.id === r.entity_id);
    if (!pin) continue;
    const on = enabled.some(
      (e) => e.map_id === pin.mapId && e.plugin_type_id === r.plugin_type_id,
    );
    if (on) pin.plugins![r.plugin_type_id as string] = r.data;
  }
}

const MAP_SELECT = `select ${MAP_COLUMNS},
  (select mm.role from public.map_members mm
   where mm.map_id = m.id and mm.user_id = auth.uid()) as role
  from public.maps m`;

async function loadMap(ctx: Ctx, mapId: string): Promise<ApiMap> {
  const row = await one(ctx, `${MAP_SELECT} where m.id = $1`, [mapId]);
  if (!row) throw notFound("Map");
  return toMap(row, (row.role as string | null) ?? null);
}

async function loadPin(ctx: Ctx, pinId: string): Promise<ApiPin> {
  const row = await one(
    ctx,
    `select ${PIN_COLUMNS} from public.pins where id = $1`,
    [pinId],
  );
  if (!row) throw notFound("Pin");
  return toPin(row);
}

function pluginEntry(ctx: Ctx, pluginId: string): ApiPluginEntry {
  const entry = ctx.plugins.find((p) => p.pluginTypeId === pluginId);
  if (!entry) throw notFound("Plugin");
  return entry;
}

const pluginNotEnabled = () =>
  new ApiError(404, "plugin_not_enabled", "Plugin is not enabled on this map");

// ---- Handlers ---------------------------------------------------------------

async function getProfile(ctx: Ctx) {
  const row = await one(
    ctx,
    `select ${PROFILE_COLUMNS} from public.profiles where id = $1`,
    [ctx.userId],
  );
  if (!row) throw notFound("Profile");
  return json(toProfile(row));
}

async function patchProfile(ctx: Ctx) {
  const body = await readJsonBody(ctx.req);
  rejectUnknownKeys(body, ["displayName", "bio", "slug"]);
  const patch = defined({
    display_name: optString(body, "displayName", { max: 100 }),
    bio: optString(body, "bio", { max: 2000 }),
    slug: optString(body, "slug", { min: 1, max: 64, nullable: false }),
  });
  if (Object.keys(patch).length) {
    const params: unknown[] = [ctx.userId];
    await ctx.db.query(
      `update public.profiles set ${setClause(patch, params)}, updated_at = now()
       where id = $1`,
      params,
    );
  }
  return getProfile(ctx);
}

async function listMaps(ctx: Ctx) {
  const { offset, limit } = page(ctx.url);
  const data = await rows(
    ctx,
    `select ${MAP_COLUMNS}, mm.role from public.map_members mm
     join public.maps m on m.id = mm.map_id
     where mm.user_id = $1
     order by m.created_at, m.id
     limit $2 offset $3`,
    [ctx.userId, limit + 1, offset],
  );
  const maps = data.map((r) => toMap(r, r.role as string));
  if (wantsPlugins(ctx.url)) await attachMapPlugins(ctx, maps.slice(0, limit));
  return listResponse(maps, offset, limit);
}

function mapInput(body: Row, create: boolean) {
  rejectUnknownKeys(body, ["name", "description", "iconEmoji", "visibility"]);
  const name = optString(body, "name", { min: 1, max: 200, nullable: false });
  if (create && name === undefined) throw badRequest("name is required");
  return {
    patch: defined({
      name,
      description: optString(body, "description", { max: 5000 }),
      icon_emoji: optString(body, "iconEmoji", { max: 32 }),
    }),
    visibility: optEnum(body, "visibility", VISIBILITIES),
  };
}

async function setVisibility(ctx: Ctx, mapId: string, visibility: string) {
  await ctx.db.query(
    `select public.set_map_visibility($1, $2::public.visibility)`,
    [mapId, visibility],
  );
}

async function createMap(ctx: Ctx) {
  const { patch, visibility } = mapInput(await readJsonBody(ctx.req), true);
  const cols = ["created_by_user_id", ...Object.keys(patch)];
  const params = [ctx.userId, ...Object.values(patch)];
  const [map] = await ctx.db.query(
    `insert into public.maps (${cols.join(", ")})
     values (${params.map((_, i) => `$${i + 1}`).join(", ")})
     returning id`,
    params,
  );
  const mapId = map!.id as string;
  await ctx.db.query(
    `insert into public.map_members (map_id, user_id, role)
     values ($1, $2, 'owner')`,
    [mapId, ctx.userId],
  );
  if (visibility !== undefined) await setVisibility(ctx, mapId, visibility);
  return json(await loadMap(ctx, mapId), 201);
}

async function getMap(ctx: Ctx, { mapId }: Params) {
  const map = await loadMap(ctx, mapId!);
  if (wantsPlugins(ctx.url)) await attachMapPlugins(ctx, [map]);
  return json(map);
}

async function patchMap(ctx: Ctx, { mapId }: Params) {
  const { patch, visibility } = mapInput(await readJsonBody(ctx.req), false);
  if (Object.keys(patch).length) {
    const params: unknown[] = [mapId];
    const updated = await ctx.db.query(
      `update public.maps set ${setClause(patch, params)}, updated_at = now()
       where id = $1 returning id`,
      params,
    );
    if (!updated.length) throw notFound("Map");
  }
  if (visibility !== undefined) await setVisibility(ctx, mapId!, visibility);
  return json(await loadMap(ctx, mapId!));
}

async function deleteMap(ctx: Ctx, { mapId }: Params) {
  await loadMap(ctx, mapId!);
  await ctx.db.query(`select public.delete_map($1)`, [mapId]);
  return json(null, 204);
}

async function putMapPlugin(ctx: Ctx, { mapId, pluginId }: Params) {
  const entry = pluginEntry(ctx, pluginId!);
  if (!entry.map?.write) throw notFound("Plugin");
  const body = await readJsonBody(ctx.req);
  rejectUnknownKeys(body, ["config"]);
  const cfg = body.config;
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
    throw badRequest("config must be an object");
  }
  rejectUnknownKeys(cfg as Row, entry.map.mapConfigKeys);
  const exists = await one(
    ctx,
    `select 1 as ok from public.map_plugins
     where map_id = $1 and plugin_type_id = $2 and enabled`,
    [mapId, pluginId],
  );
  if (!exists) throw pluginNotEnabled();
  const [updated] = await ctx.db.query(
    `update public.map_plugins set config = config || ${jsonParam(3)}, updated_at = now()
     where map_id = $1 and plugin_type_id = $2 returning config`,
    [mapId, pluginId, JSON.stringify(cfg)],
  );
  if (!updated) throw new ApiError(403, "forbidden", "Not allowed");
  return json({
    pluginId,
    config: pickKeys(updated.config, entry.map.mapConfigKeys),
  });
}

async function listPins(ctx: Ctx, { mapId }: Params) {
  await loadMap(ctx, mapId!);
  const { offset, limit } = page(ctx.url);
  const data = await rows(
    ctx,
    `select ${PIN_COLUMNS} from public.pins where map_id = $1
     order by created_at, id limit $2 offset $3`,
    [mapId, limit + 1, offset],
  );
  const pins = data.map(toPin);
  if (wantsPlugins(ctx.url)) await attachPinPlugins(ctx, pins.slice(0, limit));
  return listResponse(pins, offset, limit);
}

function pinInput(body: Row, create: boolean) {
  rejectUnknownKeys(body, [
    "title",
    "description",
    "lat",
    "lng",
    "date",
    "endDate",
  ]);
  const lat = optNumber(body, "lat", -90, 90);
  const lng = optNumber(body, "lng", -180, 180);
  if (create && (lat === undefined || lng === undefined)) {
    throw badRequest("lat and lng are required");
  }
  return defined({
    title: optString(body, "title", { max: 500 }),
    description: optString(body, "description", { max: 20_000 }),
    lat,
    lng,
    date: optDate(body, "date"),
    end_date: optDate(body, "endDate"),
  });
}

async function createPin(ctx: Ctx, { mapId }: Params) {
  const input = pinInput(await readJsonBody(ctx.req), true);
  await loadMap(ctx, mapId!);
  const cols = ["map_id", ...Object.keys(input)];
  const params = [mapId, ...Object.values(input)];
  const row = await one(
    ctx,
    `insert into public.pins (${cols.join(", ")})
     values (${params.map((_, i) => `$${i + 1}`).join(", ")})
     returning ${PIN_COLUMNS}`,
    params,
  );
  return json(toPin(row!), 201);
}

async function getPin(ctx: Ctx, { pinId }: Params) {
  const pin = await loadPin(ctx, pinId!);
  if (wantsPlugins(ctx.url)) await attachPinPlugins(ctx, [pin]);
  return json(pin);
}

async function patchPin(ctx: Ctx, { pinId }: Params) {
  const patch = pinInput(await readJsonBody(ctx.req), false);
  if (!Object.keys(patch).length) return json(await loadPin(ctx, pinId!));
  const params: unknown[] = [pinId];
  const row = await one(
    ctx,
    `update public.pins set ${setClause(patch, params)}, updated_at = now()
     where id = $1 returning ${PIN_COLUMNS}`,
    params,
  );
  if (!row) throw notFound("Pin");
  return json(toPin(row));
}

async function deletePin(ctx: Ctx, { pinId }: Params) {
  const deleted = await ctx.db.query(
    `delete from public.pins where id = $1 returning id`,
    [pinId],
  );
  if (!deleted.length) throw notFound("Pin");
  return json(null, 204);
}

async function putPinPlugin(ctx: Ctx, { pinId, pluginId }: Params) {
  const entry = pluginEntry(ctx, pluginId!);
  if (!entry.pin?.write) throw notFound("Plugin");
  const body = await readJsonBody(ctx.req);
  rejectUnknownKeys(body, ["data"]);
  if (!body.data || typeof body.data !== "object" || Array.isArray(body.data)) {
    throw badRequest("data must be an object");
  }
  const pin = await loadPin(ctx, pinId!);
  const enabled = await enabledPlugins(ctx, [pin.mapId]);
  if (!enabled.some((e) => e.plugin_type_id === pluginId)) {
    throw pluginNotEnabled();
  }
  await ctx.db.query(
    `insert into public.plugin_entity_data
       (entity_type, entity_id, plugin_type_id, map_id, data)
     values ('pin', $1, $2, $3, ${jsonParam(4)})
     on conflict (entity_type, entity_id, plugin_type_id)
     do update set data = excluded.data, updated_at = now()`,
    [pinId, pluginId, pin.mapId, JSON.stringify(body.data)],
  );
  return json({ pluginId, data: body.data });
}

const router = new Router<Ctx>()
  .on("GET", "/v1/profile", getProfile)
  .on("PATCH", "/v1/profile", patchProfile)
  .on("GET", "/v1/maps", listMaps)
  .on("POST", "/v1/maps", createMap)
  .on("GET", "/v1/maps/:mapId", getMap)
  .on("PATCH", "/v1/maps/:mapId", patchMap)
  .on("DELETE", "/v1/maps/:mapId", deleteMap)
  .on("PUT", "/v1/maps/:mapId/plugins/:pluginId", putMapPlugin)
  .on("GET", "/v1/maps/:mapId/pins", listPins)
  .on("POST", "/v1/maps/:mapId/pins", createPin)
  .on("GET", "/v1/pins/:pinId", getPin)
  .on("PATCH", "/v1/pins/:pinId", patchPin)
  .on("DELETE", "/v1/pins/:pinId", deletePin)
  .on("PUT", "/v1/pins/:pinId/plugins/:pluginId", putPinPlugin);

function stripBase(pathname: string, basePath: string): string | null {
  const base = basePath.replace(/\/+$/, "");
  if (!base) return pathname;
  if (pathname === base) return "/";
  return pathname.startsWith(`${base}/`) ? pathname.slice(base.length) : null;
}

/** `/v1/openapi.json` needs no key or database. */
export function isPublicPath(pathname: string): boolean {
  return pathname.endsWith("/v1/openapi.json");
}

/** Host-agnostic entry point: works behind any origin or mount path. */
export async function handle(
  req: Request,
  deps: ApiDeps,
  { basePath = "" }: HandleOptions = {},
): Promise<Response> {
  try {
    if (req.method === "OPTIONS") return preflight();
    const url = new URL(req.url);
    // Supabase serves functions at `/functions/v1/<slug>/...` or `/<slug>/...` internally.
    const path = stripBase(
      url.pathname.replace(/^\/functions\/v1/, ""),
      basePath,
    );
    if (path === null) throw notFound("Route");

    if (req.method === "GET" && path === "/v1/openapi.json") {
      return json(openApiDocument);
    }

    const m = router.match(req.method, path);
    if (m === null) throw notFound("Route");
    if (m === "method_not_allowed") {
      throw new ApiError(405, "method_not_allowed", "Method not allowed");
    }

    const auth = req.headers.get("Authorization") ?? "";
    const key = /^Bearer\s+(cur_live_[0-9a-f]+)$/i.exec(auth.trim())?.[1];
    if (!key) {
      throw new ApiError(401, "unauthorized", "Missing or malformed API key");
    }
    const resolved = await deps.resolveKey(key);
    if (!resolved) {
      throw new ApiError(401, "unauthorized", "Invalid or revoked API key");
    }
    const needed: ApiScope = req.method === "GET" ? "read" : "write";
    if (!resolved.scopes.includes(needed)) {
      throw new ApiError(
        403,
        "insufficient_scope",
        `This API key lacks the "${needed}" scope`,
      );
    }

    return await deps.withUser(resolved.userId, async (db) => {
      const ctx: Ctx = {
        req,
        url,
        db: {
          query: async (text, params) => {
            try {
              return await db.query(text, params);
            } catch (err) {
              throw dbError(err);
            }
          },
        },
        userId: resolved.userId,
        plugins: deps.plugins,
      };
      return m.handler(ctx, m.params);
    });
  } catch (err) {
    if (err instanceof ApiError) return errorResponse(err);
    console.error("api: unhandled error", err);
    return errorResponse(
      new ApiError(500, "internal_error", "Unexpected error"),
    );
  }
}
