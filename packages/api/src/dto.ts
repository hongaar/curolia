/** Public API shapes (decoupled from DB rows so columns can change independently). */

type Row = Record<string, unknown>;

export type ApiProfile = {
  id: string;
  slug: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  visibility: "public" | "unlisted" | "private";
  defaultMapId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiMap = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconEmoji: string | null;
  visibility: "public" | "unlisted" | "private";
  role: string | null;
  createdAt: string;
  updatedAt: string;
  plugins?: Record<string, unknown>;
};

export type ApiPin = {
  id: string;
  mapId: string;
  slug: string;
  title: string | null;
  description: string | null;
  lat: number;
  lng: number;
  date: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  plugins?: Record<string, unknown>;
};

export const toProfile = (r: Row): ApiProfile => ({
  id: r.id as string,
  slug: r.slug as string,
  displayName: (r.display_name as string | null) ?? null,
  bio: (r.bio as string | null) ?? null,
  avatarUrl: (r.avatar_url as string | null) ?? null,
  visibility: r.visibility as ApiProfile["visibility"],
  defaultMapId: (r.default_map_id as string | null) ?? null,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

export const toMap = (r: Row, role: string | null): ApiMap => ({
  id: r.id as string,
  name: r.name as string,
  slug: r.slug as string,
  description: (r.description as string | null) ?? null,
  iconEmoji: (r.icon_emoji as string | null) ?? null,
  visibility: r.visibility as ApiMap["visibility"],
  role,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

export const toPin = (r: Row): ApiPin => ({
  id: r.id as string,
  mapId: r.map_id as string,
  slug: r.slug as string,
  title: (r.title as string | null) ?? null,
  description: (r.description as string | null) ?? null,
  lat: r.lat as number,
  lng: r.lng as number,
  date: (r.date as string | null) ?? null,
  endDate: (r.end_date as string | null) ?? null,
  createdAt: r.created_at as string,
  updatedAt: r.updated_at as string,
});

export const PROFILE_COLUMNS =
  "id, slug, display_name, bio, avatar_url, visibility, default_map_id, created_at, updated_at";
/** Map columns, qualified with the `m` alias used by the map queries. */
export const MAP_COLUMNS =
  "m.id, m.name, m.slug, m.description, m.icon_emoji, m.visibility, m.created_at, m.updated_at";
export const PIN_COLUMNS =
  "id, map_id, slug, title, description, lat, lng, date, end_date, created_at, updated_at";
