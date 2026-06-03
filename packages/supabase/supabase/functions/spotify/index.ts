import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SPOTIFY_TOKEN = "https://accounts.spotify.com/api/token";
const SPOTIFY_SEARCH = "https://api.spotify.com/v1/search";

type SpotifyPinItemKind = "track" | "playlist";
type LibraryScope = "playlist" | "saved";

type ResolvedItem = {
  kind: SpotifyPinItemKind;
  spotifyId: string;
  title: string;
  subtitle: string | null;
  openUrl: string;
  imageUrl: string | null;
  libraryScope?: LibraryScope;
};

type ScoredItem = ResolvedItem & { score: number };

type TokenJson = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

type TrackJson = {
  id?: string;
  name?: string;
  artists?: { name?: string }[];
  external_urls?: { spotify?: string };
  album?: { images?: { url?: string }[] };
};

type PlaylistJson = {
  id?: string;
  name?: string;
  tracks?: { total?: number };
  external_urls?: { spotify?: string };
  images?: { url?: string }[];
};

type SavedTrackJson = { track?: TrackJson | null };

type PlaylistsPageJson = {
  items?: PlaylistJson[];
  next?: string | null;
};

type SavedTracksPageJson = {
  items?: SavedTrackJson[];
  next?: string | null;
};

type SearchJson = {
  tracks?: { items?: TrackJson[] };
  playlists?: { items?: PlaylistJson[] };
};

type RequestBody = {
  action?: string;
  url?: string;
  query?: string;
};

const MAX_RESULTS = 10;
const PAGE_LIMIT = 50;
const MAX_PLAYLIST_PAGES = 8;
const MAX_LIBRARY_PAGES = 8;

function cors(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function parseSpotifyUri(
  input: string,
): { kind: SpotifyPinItemKind; id: string } | null {
  const raw = input.trim();
  if (!raw) return null;

  const uriMatch = /^spotify:(track|playlist):([a-zA-Z0-9]+)$/i.exec(raw);
  if (uriMatch) {
    return {
      kind: uriMatch[1]!.toLowerCase() as SpotifyPinItemKind,
      id: uriMatch[2]!,
    };
  }

  let url: URL;
  try {
    url = new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "open.spotify.com" && host !== "spotify.com") return null;

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const segment = parts[0]!.toLowerCase();
  if (segment !== "track" && segment !== "playlist") return null;

  const id = parts[1]!.split("?")[0]!;
  if (!/^[a-zA-Z0-9]+$/.test(id)) return null;

  return { kind: segment, id };
}

let clientTokenCache: { token: string; expiresAtMs: number } | null = null;

function spotifyEnvConfigError(
  clientId: string,
  clientSecret: string,
): string | null {
  if (!clientId.trim()) return "SPOTIFY_CLIENT_ID not configured";
  if (!clientSecret.trim()) return "SPOTIFY_CLIENT_SECRET not configured";
  return null;
}

async function importAesKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

function getEncryptionKey(): Uint8Array {
  let b64 = (Deno.env.get("PLUGIN_OAUTH_ENCRYPTION_KEY") ?? "").trim();
  if (!b64) throw new Error("PLUGIN_OAUTH_ENCRYPTION_KEY is not set");
  b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  if (pad) b64 += "=".repeat(4 - pad);
  let bin: Uint8Array;
  try {
    bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  } catch {
    throw new Error("PLUGIN_OAUTH_ENCRYPTION_KEY is not valid base64");
  }
  if (bin.length !== 32) {
    throw new Error(
      `PLUGIN_OAUTH_ENCRYPTION_KEY must decode to 32 bytes (got ${bin.length})`,
    );
  }
  return bin;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function parseBytea(val: unknown): Uint8Array {
  if (val instanceof Uint8Array) return val;
  if (val instanceof ArrayBuffer) return new Uint8Array(val);
  if (Array.isArray(val) && val.every((x) => typeof x === "number")) {
    return new Uint8Array(val as number[]);
  }
  if (typeof val === "string") {
    const s = val.trim();
    if (s.startsWith("\\x")) {
      const hex = s.slice(2);
      if (/^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0) {
        return hexToBytes(hex);
      }
    }
    if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0 && s.length >= 2) {
      return hexToBytes(s);
    }
    try {
      let b64 = s.replace(/-/g, "+").replace(/_/g, "/");
      const p = b64.length % 4;
      if (p) b64 += "=".repeat(4 - p);
      const bin = atob(b64);
      return Uint8Array.from(bin, (c) => c.charCodeAt(0));
    } catch {
      /* fall through */
    }
  }
  throw new Error("unsupported bytea format");
}

async function decryptSecret(ct: Uint8Array): Promise<string> {
  const keyRaw = getEncryptionKey();
  const iv = ct.slice(0, 12);
  const data = ct.slice(12);
  const key = await importAesKey(keyRaw);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(pt);
}

function byteaInsertValue(buf: Uint8Array): string {
  let hex = "";
  for (let i = 0; i < buf.length; i++) {
    hex += buf[i]!.toString(16).padStart(2, "0");
  }
  return "\\x" + hex;
}

type SpotifyUserTokenResult =
  | { ok: true; accessToken: string }
  | {
      ok: false;
      reason: "not_linked" | "decrypt_failed" | "refresh_failed";
    };

async function getUserSpotifyAccessToken(
  admin: ReturnType<typeof createClient>,
  userId: string,
  spotifyClientId: string,
  spotifyClientSecret: string,
): Promise<SpotifyUserTokenResult> {
  const { data: row, error } = await admin
    .from("user_plugin_oauth_tokens")
    .select(
      "refresh_token_ciphertext, access_token_ciphertext, access_token_expires_at",
    )
    .eq("user_id", userId)
    .eq("plugin_type_id", "spotify")
    .maybeSingle();

  if (error || !row) return { ok: false, reason: "not_linked" };

  const r = row as {
    refresh_token_ciphertext: unknown;
    access_token_ciphertext: unknown | null;
    access_token_expires_at: string | null;
  };

  let refreshPlain: string;
  try {
    refreshPlain = await decryptSecret(parseBytea(r.refresh_token_ciphertext));
  } catch (e) {
    console.error("spotify refresh_token decrypt failed", e);
    return { ok: false, reason: "decrypt_failed" };
  }

  const exp = r.access_token_expires_at
    ? new Date(r.access_token_expires_at)
    : null;
  if (exp && exp > new Date(Date.now() + 60_000) && r.access_token_ciphertext) {
    try {
      const at = await decryptSecret(parseBytea(r.access_token_ciphertext));
      return { ok: true, accessToken: at };
    } catch {
      /* refresh below */
    }
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshPlain,
    client_id: spotifyClientId,
  });
  if (spotifyClientSecret.trim()) {
    body.set("client_secret", spotifyClientSecret);
  }

  const res = await fetch(SPOTIFY_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const tok = (await res.json()) as TokenJson;
  if (!res.ok || !tok.access_token) {
    console.error("spotify refresh failed", tok);
    return { ok: false, reason: "refresh_failed" };
  }

  const expiresIn = typeof tok.expires_in === "number" ? tok.expires_in : 3600;
  const accessExpires = new Date(Date.now() + expiresIn * 1000).toISOString();

  const keyRaw = getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importAesKey(keyRaw);
  const encAt = new TextEncoder().encode(tok.access_token);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encAt),
  );
  const accessCt = new Uint8Array(iv.length + ct.length);
  accessCt.set(iv, 0);
  accessCt.set(ct, iv.length);

  await admin
    .from("user_plugin_oauth_tokens")
    .update({
      access_token_ciphertext: byteaInsertValue(accessCt),
      access_token_expires_at: accessExpires,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("plugin_type_id", "spotify");

  return { ok: true, accessToken: tok.access_token };
}

async function getClientCredentialsToken(
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  if (clientTokenCache && Date.now() < clientTokenCache.expiresAtMs - 60_000) {
    return clientTokenCache.token;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(SPOTIFY_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json()) as TokenJson;
  if (!res.ok || !json.access_token) {
    console.error("spotify client_credentials failed", json);
    return null;
  }

  const expiresIn =
    typeof json.expires_in === "number" ? json.expires_in : 3600;
  clientTokenCache = {
    token: json.access_token,
    expiresAtMs: Date.now() + expiresIn * 1000,
  };
  return json.access_token;
}

function pickImage(images: { url?: string }[] | undefined): string | null {
  if (!images?.length) return null;
  return images[0]?.url ?? null;
}

function matchScore(haystack: string, needle: string): number | null {
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase().trim();
  if (!n) return null;
  if (h === n) return 0;
  if (h.startsWith(n)) return 1;
  if (h.includes(n)) return 2;
  return null;
}

function bestTextScore(texts: string[], query: string): number | null {
  let best: number | null = null;
  for (const t of texts) {
    const s = matchScore(t, query);
    if (s === null) continue;
    if (best === null || s < best) best = s;
  }
  return best;
}

async function fetchJson<T>(url: string, token: string): Promise<T | null> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    console.error("spotify api failed", url, await res.text());
    return null;
  }
  return (await res.json()) as T;
}

async function searchUserLibrary(
  token: string,
  query: string,
): Promise<ResolvedItem[]> {
  const playlists: ScoredItem[] = [];
  const saved: ScoredItem[] = [];

  let playlistUrl: string | null =
    `https://api.spotify.com/v1/me/playlists?limit=${PAGE_LIMIT}`;
  let playlistPages = 0;

  while (playlistUrl && playlistPages < MAX_PLAYLIST_PAGES) {
    const page = await fetchJson<PlaylistsPageJson>(playlistUrl, token);
    playlistPages += 1;
    if (!page) break;

    for (const pl of page.items ?? []) {
      if (!pl?.id || !pl.name) continue;
      const score = bestTextScore([pl.name], query);
      if (score === null) continue;
      const total = pl.tracks?.total;
      const countLabel =
        typeof total === "number"
          ? `${total} track${total === 1 ? "" : "s"}`
          : null;
      playlists.push({
        kind: "playlist",
        spotifyId: pl.id,
        title: pl.name,
        subtitle: countLabel,
        openUrl:
          pl.external_urls?.spotify ??
          `https://open.spotify.com/playlist/${pl.id}`,
        imageUrl: pickImage(pl.images),
        libraryScope: "playlist",
        score,
      });
    }

    playlistUrl = page.next ?? null;
    if (playlists.length >= MAX_RESULTS) break;
  }

  let libraryUrl: string | null =
    `https://api.spotify.com/v1/me/tracks?limit=${PAGE_LIMIT}`;
  let libraryPages = 0;

  while (
    libraryUrl &&
    libraryPages < MAX_LIBRARY_PAGES &&
    saved.length < MAX_RESULTS
  ) {
    const page = await fetchJson<SavedTracksPageJson>(libraryUrl, token);
    libraryPages += 1;
    if (!page) break;

    for (const row of page.items ?? []) {
      const tr = row.track;
      if (!tr?.id || !tr.name) continue;
      const artists =
        tr.artists
          ?.map((a) => a.name)
          .filter(Boolean)
          .join(", ") ?? "";
      const score = bestTextScore(
        [tr.name, artists, `${tr.name} ${artists}`],
        query,
      );
      if (score === null) continue;
      saved.push({
        kind: "track",
        spotifyId: tr.id,
        title: tr.name,
        subtitle: artists || null,
        openUrl:
          tr.external_urls?.spotify ??
          `https://open.spotify.com/track/${tr.id}`,
        imageUrl: pickImage(tr.album?.images),
        libraryScope: "saved",
        score,
      });
    }

    libraryUrl = page.next ?? null;
  }

  const sortByScore = (a: ScoredItem, b: ScoredItem) =>
    a.score - b.score || a.title.localeCompare(b.title);

  playlists.sort(sortByScore);
  saved.sort(sortByScore);

  const out: ResolvedItem[] = [];
  const seen = new Set<string>();

  for (const item of playlists) {
    const key = `playlist:${item.spotifyId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { score: _s, ...rest } = item;
    out.push(rest);
    if (out.length >= MAX_RESULTS) return out;
  }

  for (const item of saved) {
    const key = `track:${item.spotifyId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { score: _s, ...rest } = item;
    out.push(rest);
    if (out.length >= MAX_RESULTS) return out;
  }

  return out;
}

function itemKey(item: Pick<ResolvedItem, "kind" | "spotifyId">): string {
  return `${item.kind}:${item.spotifyId}`;
}

async function searchCatalog(
  token: string,
  query: string,
): Promise<ResolvedItem[]> {
  const u = new URL(SPOTIFY_SEARCH);
  u.searchParams.set("q", query);
  u.searchParams.set("type", "track,playlist");
  u.searchParams.set("limit", "5");

  const json = await fetchJson<SearchJson>(u.toString(), token);
  if (!json) return [];

  const out: ResolvedItem[] = [];

  for (const tr of json.tracks?.items ?? []) {
    if (!tr?.id || !tr.name) continue;
    const artists =
      tr.artists
        ?.map((a) => a.name)
        .filter(Boolean)
        .join(", ") ?? "";
    out.push({
      kind: "track",
      spotifyId: tr.id,
      title: tr.name,
      subtitle: artists || null,
      openUrl:
        tr.external_urls?.spotify ?? `https://open.spotify.com/track/${tr.id}`,
      imageUrl: pickImage(tr.album?.images),
    });
  }

  for (const pl of json.playlists?.items ?? []) {
    if (!pl?.id || !pl.name) continue;
    const total = pl.tracks?.total;
    const subtitle =
      typeof total === "number"
        ? `${total} track${total === 1 ? "" : "s"}`
        : "Playlist";
    out.push({
      kind: "playlist",
      spotifyId: pl.id,
      title: pl.name,
      subtitle,
      openUrl:
        pl.external_urls?.spotify ??
        `https://open.spotify.com/playlist/${pl.id}`,
      imageUrl: pickImage(pl.images),
    });
  }

  return out.slice(0, MAX_RESULTS);
}

async function resolveTrack(
  token: string,
  id: string,
): Promise<ResolvedItem | null> {
  const json = await fetchJson<TrackJson>(
    `https://api.spotify.com/v1/tracks/${id}`,
    token,
  );
  if (!json?.id || !json.name) return null;
  const artists =
    json.artists
      ?.map((a) => a.name)
      .filter(Boolean)
      .join(", ") ?? "";
  return {
    kind: "track",
    spotifyId: json.id,
    title: json.name,
    subtitle: artists || null,
    openUrl:
      json.external_urls?.spotify ??
      `https://open.spotify.com/track/${json.id}`,
    imageUrl: pickImage(json.album?.images),
  };
}

async function resolvePlaylist(
  token: string,
  id: string,
): Promise<ResolvedItem | null> {
  const json = await fetchJson<PlaylistJson>(
    `https://api.spotify.com/v1/playlists/${id}`,
    token,
  );
  if (!json?.id || !json.name) return null;
  const total = json.tracks?.total;
  const subtitle =
    typeof total === "number"
      ? `${total} track${total === 1 ? "" : "s"}`
      : "Playlist";
  return {
    kind: "playlist",
    spotifyId: json.id,
    title: json.name,
    subtitle,
    openUrl:
      json.external_urls?.spotify ??
      `https://open.spotify.com/playlist/${json.id}`,
    imageUrl: pickImage(json.images),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const spotifyClientId = Deno.env.get("SPOTIFY_CLIENT_ID") ?? "";
  const spotifyClientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET") ?? "";

  const authHeader = req.headers.get("Authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/i, "") ?? "";
  if (!jwt) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "invalid_session" }), {
      status: 401,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "bad_json" }), {
      status: 400,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const configError = spotifyEnvConfigError(
    spotifyClientId,
    spotifyClientSecret,
  );
  if (configError) {
    return new Response(JSON.stringify({ error: configError }), {
      status: 500,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  const admin = createClient(supabaseUrl, serviceKey);

  const catalogToken = await getClientCredentialsToken(
    spotifyClientId,
    spotifyClientSecret,
  );
  if (!catalogToken) {
    return new Response(JSON.stringify({ error: "spotify_api_unavailable" }), {
      status: 503,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  if (body.action === "search") {
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 2) {
      return new Response(JSON.stringify({ error: "query_too_short" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const [catalogRaw, userTok] = await Promise.all([
      searchCatalog(catalogToken, query),
      getUserSpotifyAccessToken(
        admin,
        userData.user.id,
        spotifyClientId,
        spotifyClientSecret,
      ),
    ]);

    let library: ResolvedItem[] = [];
    let libraryUnavailable: string | undefined;

    if (userTok.ok) {
      library = await searchUserLibrary(userTok.accessToken, query);
    } else if (userTok.reason === "not_linked") {
      libraryUnavailable = "spotify_link_required";
    } else {
      return new Response(
        JSON.stringify({
          error: "spotify_oauth_unavailable",
          reason: userTok.reason,
          library: [],
          catalog: [],
        }),
        {
          status: 503,
          headers: { ...cors(), "Content-Type": "application/json" },
        },
      );
    }

    const libKeys = new Set(library.map((i) => itemKey(i)));
    const catalog = catalogRaw
      .filter((i) => !libKeys.has(itemKey(i)))
      .slice(0, MAX_RESULTS);

    return new Response(
      JSON.stringify({ library, catalog, libraryUnavailable }),
      {
        status: 200,
        headers: { ...cors(), "Content-Type": "application/json" },
      },
    );
  }

  if (body.action === "resolve" && typeof body.url === "string") {
    const parsed = parseSpotifyUri(body.url);
    if (!parsed) {
      return new Response(JSON.stringify({ error: "invalid_spotify_url" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const item =
      parsed.kind === "track"
        ? await resolveTrack(catalogToken, parsed.id)
        : await resolvePlaylist(catalogToken, parsed.id);

    if (!item) {
      return new Response(JSON.stringify({ error: "spotify_not_found" }), {
        status: 404,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ item }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "invalid_body" }), {
    status: 400,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
});
