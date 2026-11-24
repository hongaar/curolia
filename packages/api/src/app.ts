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
  optEnum,
  optDate,
  optNumber,
  optString,
  rejectUnknownKeys,
} from "./validate.ts";

// deno-lint-ignore no-explicit-any
type Query = any;
/** Structural subset of a supabase-js client (kept loose so this runs on Deno and Node). */
export type DbClient = {
  from(table: string): Query;
  rpc(fn: string, args?: Record<string, unknown>): Query;
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
  /** A database client that acts as `userId` (RLS applies). */
  userClient(userId: string): Promise<DbClient>;
  plugins: readonly ApiPluginEntry[];
};

export type HandleOptions = {
  /** Path prefix in front of `/v1` (e.g. `/api` for the Supabase function, `""` on `api.curolia.com`). */
  basePath?: string;
};

type Ctx = {
  req: Request;
  url: URL;
  db: DbClient;
  userId: string;
  plugins: readonly ApiPluginEntry[];
};

const VISIBILITIES = ["public", "unlisted", "private"] as const;
const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

type PgError = { code?: string; message?: string } | null;

function dbError(err: PgError): ApiError {
  switch (err?.code) {
    case "42501":
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
      return badRequest(err.message ?? "Invalid value");
    default:
      return new ApiError(500, "internal_error", "Unexpected database error");
  }
}

// deno-lint-ignore no-explicit-any
async function run<T = any>(
  q: PromiseLike<{ data: unknown; error: PgError }>,
): Promise<T> {
  const { data, error } = await q;
  if (error) throw dbError(error);
  return data as T;
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
    offset = Number(atob(cursor));
    if (!Number.isInteger(offset) || offset < 0)
      throw badRequest("Invalid cursor");
  }
  return { offset, limit };
}

function listResponse<T>(rows: T[], offset: number, limit: number): Response {
  const hasMore = rows.length > limit;
  return json({
    data: rows.slice(0, limit),
    nextCursor: hasMore ? btoa(String(offset + limit)) : null,
  });
}

const wantsPlugins = (url: URL) =>
  (url.searchParams.get("include") ?? "").split(",").includes("plugins");

function pickKeys(
  cfg: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  const o =
    cfg && typeof cfg === "object" ? (cfg as Record<string, unknown>) : {};
  return Object.fromEntries(keys.filter((k) => k in o).map((k) => [k, o[k]]));
}

async function enabledPlugins(ctx: Ctx, mapIds: string[]) {
  if (!mapIds.length)
    return [] as { map_id: string; plugin_type_id: string; config: unknown }[];
  return (await run(
    ctx.db
      .from("map_plugins")
      .select("map_id, plugin_type_id, config")
      .in("map_id", mapIds)
      .eq("enabled", true)
      .in(
        "plugin_type_id",
        ctx.plugins.map((p) => p.pluginTypeId),
      ),
  )) as { map_id: string; plugin_type_id: string; config: unknown }[];
}

async function attachMapPlugins(ctx: Ctx, maps: ApiMap[]): Promise<void> {
  const rows = await enabledPlugins(
    ctx,
    maps.map((m) => m.id),
  );
  for (const m of maps) m.plugins = {};
  for (const r of rows) {
    const entry = ctx.plugins.find((p) => p.pluginTypeId === r.plugin_type_id);
    if (!entry?.map?.read) continue;
    const map = maps.find((m) => m.id === r.map_id);
    if (map)
      map.plugins![r.plugin_type_id] = pickKeys(
        r.config,
        entry.map.mapConfigKeys,
      );
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
  const rows = (await run(
    ctx.db
      .from("plugin_entity_data")
      .select("entity_id, plugin_type_id, data")
      .eq("entity_type", "pin")
      .in(
        "entity_id",
        pins.map((p) => p.id),
      )
      .in("plugin_type_id", readable),
  )) as { entity_id: string; plugin_type_id: string; data: unknown }[];
  for (const r of rows) {
    const pin = pins.find((p) => p.id === r.entity_id);
    if (!pin) continue;
    const on = enabled.some(
      (e) => e.map_id === pin.mapId && e.plugin_type_id === r.plugin_type_id,
    );
    if (on) pin.plugins![r.plugin_type_id] = r.data;
  }
}

async function loadMap(ctx: Ctx, mapId: string): Promise<ApiMap> {
  const row = await run(
    ctx.db.from("maps").select(MAP_COLUMNS).eq("id", mapId).maybeSingle(),
  );
  if (!row) throw notFound("Map");
  const member = (await run(
    ctx.db
      .from("map_members")
      .select("role")
      .eq("map_id", mapId)
      .eq("user_id", ctx.userId)
      .maybeSingle(),
  )) as { role: string } | null;
  return toMap(row, member?.role ?? null);
}

async function loadPin(ctx: Ctx, pinId: string): Promise<ApiPin> {
  const row = await run(
    ctx.db.from("pins").select(PIN_COLUMNS).eq("id", pinId).maybeSingle(),
  );
  if (!row) throw notFound("Pin");
  return toPin(row);
}

function pluginEntry(ctx: Ctx, pluginId: string): ApiPluginEntry {
  const entry = ctx.plugins.find((p) => p.pluginTypeId === pluginId);
  if (!entry) throw notFound("Plugin");
  return entry;
}

// ---- Handlers ---------------------------------------------------------------

async function getProfile(ctx: Ctx) {
  const row = await run(
    ctx.db
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", ctx.userId)
      .single(),
  );
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
    await run(ctx.db.from("profiles").update(patch).eq("id", ctx.userId));
  }
  return getProfile(ctx);
}

async function listMaps(ctx: Ctx) {
  const { offset, limit } = page(ctx.url);
  const rows = (await run(
    ctx.db
      .from("map_members")
      .select(`role, maps!inner(${MAP_COLUMNS})`)
      .eq("user_id", ctx.userId)
      .order("map_id")
      .range(offset, offset + limit),
  )) as { role: string; maps: Record<string, unknown> }[];
  const maps = rows.map((r) => toMap(r.maps, r.role));
  if (wantsPlugins(ctx.url)) await attachMapPlugins(ctx, maps.slice(0, limit));
  return listResponse(maps, offset, limit);
}

function mapInput(body: Record<string, unknown>, create: boolean) {
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

async function createMap(ctx: Ctx) {
  const { patch, visibility } = mapInput(await readJsonBody(ctx.req), true);
  const map = (await run(
    ctx.db
      .from("maps")
      .insert({ ...patch, created_by_user_id: ctx.userId })
      .select("id")
      .single(),
  )) as { id: string };
  await run(
    ctx.db
      .from("map_members")
      .insert({ map_id: map.id, user_id: ctx.userId, role: "owner" }),
  );
  if (visibility !== undefined) {
    await run(
      ctx.db.rpc("set_map_visibility", {
        p_map_id: map.id,
        p_visibility: visibility,
      }),
    );
  }
  return json(await loadMap(ctx, map.id), 201);
}

async function getMap(ctx: Ctx, { mapId }: Params) {
  const map = await loadMap(ctx, mapId!);
  if (wantsPlugins(ctx.url)) await attachMapPlugins(ctx, [map]);
  return json(map);
}

async function patchMap(ctx: Ctx, { mapId }: Params) {
  const { patch, visibility } = mapInput(await readJsonBody(ctx.req), false);
  if (Object.keys(patch).length) {
    const updated = await run(
      ctx.db.from("maps").update(patch).eq("id", mapId).select("id"),
    );
    if (!(updated as unknown[]).length) throw notFound("Map");
  }
  if (visibility !== undefined) {
    await run(
      ctx.db.rpc("set_map_visibility", {
        p_map_id: mapId,
        p_visibility: visibility,
      }),
    );
  }
  return json(await loadMap(ctx, mapId!));
}

async function deleteMap(ctx: Ctx, { mapId }: Params) {
  await loadMap(ctx, mapId!);
  await run(ctx.db.rpc("delete_map", { p_map_id: mapId }));
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
  rejectUnknownKeys(cfg as Record<string, unknown>, entry.map.mapConfigKeys);
  const [row] = (await run(
    ctx.db
      .from("map_plugins")
      .select("config")
      .eq("map_id", mapId)
      .eq("plugin_type_id", pluginId)
      .eq("enabled", true),
  )) as { config: Record<string, unknown> | null }[];
  if (!row)
    throw new ApiError(
      404,
      "plugin_not_enabled",
      "Plugin is not enabled on this map",
    );
  const next = { ...(row.config ?? {}), ...(cfg as Record<string, unknown>) };
  const updated = await run(
    ctx.db
      .from("map_plugins")
      .update({ config: next })
      .eq("map_id", mapId)
      .eq("plugin_type_id", pluginId)
      .select("config"),
  );
  if (!(updated as unknown[]).length)
    throw new ApiError(403, "forbidden", "Not allowed");
  return json({ pluginId, config: pickKeys(next, entry.map.mapConfigKeys) });
}

async function listPins(ctx: Ctx, { mapId }: Params) {
  await loadMap(ctx, mapId!);
  const { offset, limit } = page(ctx.url);
  const rows = (await run(
    ctx.db
      .from("pins")
      .select(PIN_COLUMNS)
      .eq("map_id", mapId)
      .order("created_at")
      .order("id")
      .range(offset, offset + limit),
  )) as Record<string, unknown>[];
  const pins = rows.map(toPin);
  if (wantsPlugins(ctx.url)) await attachPinPlugins(ctx, pins.slice(0, limit));
  return listResponse(pins, offset, limit);
}

function pinInput(body: Record<string, unknown>, create: boolean) {
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
  const row = await run(
    ctx.db
      .from("pins")
      .insert({ ...input, map_id: mapId })
      .select(PIN_COLUMNS)
      .single(),
  );
  return json(toPin(row), 201);
}

async function getPin(ctx: Ctx, { pinId }: Params) {
  const pin = await loadPin(ctx, pinId!);
  if (wantsPlugins(ctx.url)) await attachPinPlugins(ctx, [pin]);
  return json(pin);
}

async function patchPin(ctx: Ctx, { pinId }: Params) {
  const patch = pinInput(await readJsonBody(ctx.req), false);
  if (!Object.keys(patch).length) return json(await loadPin(ctx, pinId!));
  const rows = (await run(
    ctx.db.from("pins").update(patch).eq("id", pinId).select(PIN_COLUMNS),
  )) as Record<string, unknown>[];
  if (!rows.length) throw notFound("Pin");
  return json(toPin(rows[0]!));
}

async function deletePin(ctx: Ctx, { pinId }: Params) {
  const rows = (await run(
    ctx.db.from("pins").delete().eq("id", pinId).select("id"),
  )) as unknown[];
  if (!rows.length) throw notFound("Pin");
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
    throw new ApiError(
      404,
      "plugin_not_enabled",
      "Plugin is not enabled on this map",
    );
  }
  await run(
    ctx.db.from("plugin_entity_data").upsert(
      {
        entity_type: "pin",
        entity_id: pinId,
        plugin_type_id: pluginId,
        map_id: pin.mapId,
        data: body.data,
      },
      { onConflict: "entity_type,entity_id,plugin_type_id" },
    ),
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
    if (!key)
      throw new ApiError(401, "unauthorized", "Missing or malformed API key");
    const resolved = await deps.resolveKey(key);
    if (!resolved)
      throw new ApiError(401, "unauthorized", "Invalid or revoked API key");
    const needed: ApiScope = req.method === "GET" ? "read" : "write";
    if (!resolved.scopes.includes(needed)) {
      throw new ApiError(
        403,
        "insufficient_scope",
        `This API key lacks the "${needed}" scope`,
      );
    }

    const ctx: Ctx = {
      req,
      url,
      db: await deps.userClient(resolved.userId),
      userId: resolved.userId,
      plugins: deps.plugins,
    };
    return await m.handler(ctx, m.params);
  } catch (err) {
    if (err instanceof ApiError) return errorResponse(err);
    console.error("api: unhandled error", err);
    return errorResponse(
      new ApiError(500, "internal_error", "Unexpected error"),
    );
  }
}
