import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import {
  DEFAULT_LIST_EMOJI,
  suggestEmojiForNameSync,
} from "./_services/emoji/index.ts";
import { coordsForPlace } from "./_services/geocoding/resolver.ts";
import type { ExportBundle } from "./dataportability.ts";
import {
  parseSavedCollectionsCsv,
  parseStarredGeoJson,
  type ParsedCollection,
  type ParsedPlace,
} from "./parsers.ts";

export const PLUGIN_TYPE_ID = "google_maps_saved_lists";
export const STARRED_LIST_LABEL = "Starred places";

export type ImportSource =
  | { type: "starred" }
  | { type: "collection"; name: string };

export type ImportSummary = {
  added: number;
  tagged: number;
  skipped: number;
  failed: number;
};

export type ImportProgressUpdate = {
  processed: number;
  total: number;
  summary: ImportSummary;
};

export type ImportPlacesOptions = {
  onProgress?: (update: ImportProgressUpdate) => void | Promise<void>;
};

export type CachedExportData = {
  starred?: {
    places: ParsedPlace[];
    exportedAt: string;
    accessType?: string;
    archiveJobId?: string;
  };
  collections?: {
    items: { id: string; name: string; itemCount: number }[];
    byName: Record<string, ParsedCollection>;
    exportedAt: string;
    accessType?: string;
    archiveJobId?: string;
  };
};

export function collectionId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function listSourceToOptionId(source: ImportSource): string {
  return source.type === "starred" ? "starred" : collectionId(source.name);
}

export function mergeImportedListIds(
  existing: string[] | undefined,
  sources: ImportSource[],
): string[] {
  const next = new Set(existing ?? []);
  for (const source of sources) {
    next.add(listSourceToOptionId(source));
  }
  return [...next];
}

export function listTagNameForSource(source: ImportSource): string {
  return source.type === "starred" ? STARRED_LIST_LABEL : source.name;
}

export function listTagEmojiForSource(source: ImportSource): string {
  return suggestEmojiForNameSync(listTagNameForSource(source), {
    fallback: DEFAULT_LIST_EMOJI,
  }).emoji;
}

type GooglePinIndexEntry = {
  pinId: string;
  importedListTags: Set<string>;
};

type GooglePinIndex = Map<string, GooglePinIndexEntry>;

export function parseExportBundle(bundle: ExportBundle): CachedExportData {
  if (bundle.resource === "maps.starred_places") {
    const places: ParsedPlace[] = [];
    for (const f of bundle.files) {
      if (
        !/\.geojson$/i.test(f.name) &&
        !f.name.toLowerCase().includes("starred")
      ) {
        if (f.name.endsWith(".json") || f.name.endsWith(".geojson")) {
          places.push(
            ...parseStarredGeoJson(new TextDecoder().decode(f.bytes)),
          );
        }
        continue;
      }
      places.push(...parseStarredGeoJson(new TextDecoder().decode(f.bytes)));
    }
    return {
      starred: {
        places,
        exportedAt: bundle.exportedAt,
        accessType: bundle.accessType,
        archiveJobId: bundle.archiveJobId,
      },
    };
  }

  const byName: Record<string, ParsedCollection> = {};
  const items: { id: string; name: string; itemCount: number }[] = [];
  for (const f of bundle.files) {
    if (!f.name.endsWith(".csv")) continue;
    const parsed = parseSavedCollectionsCsv(
      f.name.split("/").pop() ?? f.name,
      new TextDecoder().decode(f.bytes),
    );
    if (!parsed) continue;
    byName[parsed.name] = parsed;
    items.push({
      id: collectionId(parsed.name),
      name: parsed.name,
      itemCount: parsed.places.length,
    });
  }
  items.sort((a, b) => a.name.localeCompare(b.name));
  return {
    collections: {
      items,
      byName,
      exportedAt: bundle.exportedAt,
      accessType: bundle.accessType,
      archiveJobId: bundle.archiveJobId,
    },
  };
}

export function mergeCachedExport(
  current: CachedExportData | null,
  patch: CachedExportData,
): CachedExportData {
  return {
    starred: patch.starred ?? current?.starred,
    collections: patch.collections ?? current?.collections,
  };
}

export type UserExportPluginData = {
  exportCache?: CachedExportData;
  listDiscoveryJob?: Record<string, unknown>;
  lastExportAt?: string;
  accessType?: string;
};

export async function loadUserExportPluginData(
  admin: SupabaseClient,
  userId: string,
): Promise<UserExportPluginData> {
  const { data } = await admin
    .from("plugin_entity_data")
    .select("data")
    .eq("entity_type", "user")
    .eq("entity_id", userId)
    .eq("plugin_type_id", PLUGIN_TYPE_ID)
    .maybeSingle();
  if (!data?.data || typeof data.data !== "object") return {};
  return data.data as UserExportPluginData;
}

export async function patchUserExportPluginData(
  admin: SupabaseClient,
  userId: string,
  patch: Partial<UserExportPluginData>,
): Promise<UserExportPluginData> {
  const prev = await loadUserExportPluginData(admin, userId);
  const next: UserExportPluginData = { ...prev, ...patch };
  const { error } = await admin.from("plugin_entity_data").upsert(
    {
      map_id: null,
      entity_type: "user",
      entity_id: userId,
      plugin_type_id: PLUGIN_TYPE_ID,
      data: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,entity_id,plugin_type_id" },
  );
  if (error) throw error;
  return next;
}

export async function loadCachedExport(
  admin: SupabaseClient,
  userId: string,
): Promise<CachedExportData | null> {
  const row = await loadUserExportPluginData(admin, userId);
  return row.exportCache ?? null;
}

export async function saveCachedExport(
  admin: SupabaseClient,
  userId: string,
  exportCache: CachedExportData,
): Promise<void> {
  await patchUserExportPluginData(admin, userId, { exportCache });
}

export async function loadGooglePinIndex(
  admin: SupabaseClient,
  mapId: string,
): Promise<GooglePinIndex> {
  const index: GooglePinIndex = new Map();
  const { data: rows } = await admin
    .from("plugin_entity_data")
    .select("entity_id, data")
    .eq("map_id", mapId)
    .eq("entity_type", "pin")
    .eq("plugin_type_id", PLUGIN_TYPE_ID);

  for (const row of rows ?? []) {
    const d = row.data as Record<string, unknown> | null;
    const dedupKey = d?.dedupKey;
    if (typeof dedupKey !== "string") continue;
    const importedListTags = new Set<string>();
    if (Array.isArray(d?.importedListTags)) {
      for (const tag of d.importedListTags) {
        if (typeof tag === "string" && tag.trim()) {
          importedListTags.add(tag);
        }
      }
    }
    index.set(dedupKey, {
      pinId: row.entity_id as string,
      importedListTags,
    });
  }
  return index;
}

async function ensureMapTag(
  admin: SupabaseClient,
  mapId: string,
  name: string,
  iconEmoji: string,
): Promise<string | null> {
  const { data: existing } = await admin
    .from("tags")
    .select("id")
    .eq("map_id", mapId)
    .eq("name", name)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const { data: created, error } = await admin
    .from("tags")
    .insert({
      map_id: mapId,
      name,
      color: "#6366f1",
      icon_emoji: iconEmoji,
    })
    .select("id")
    .single();
  if (error || !created?.id) {
    console.error("tag insert failed", error);
    return null;
  }
  return created.id as string;
}

async function attachTagToPin(
  admin: SupabaseClient,
  pinId: string,
  tagId: string,
): Promise<boolean> {
  const { error } = await admin
    .from("pin_tags")
    .upsert(
      { pin_id: pinId, tag_id: tagId },
      { onConflict: "pin_id,tag_id", ignoreDuplicates: true },
    );
  if (error) {
    console.error("pin_tags upsert failed", error);
    return false;
  }
  return true;
}

async function upsertGooglePinMetadata(
  admin: SupabaseClient,
  mapId: string,
  pinId: string,
  place: ParsedPlace,
  importedListTags: string[],
): Promise<void> {
  const { error } = await admin.from("plugin_entity_data").upsert(
    {
      map_id: mapId,
      entity_type: "pin",
      entity_id: pinId,
      plugin_type_id: PLUGIN_TYPE_ID,
      data: {
        dedupKey: place.dedupKey,
        googleMapsUrl: place.googleMapsUrl,
        source: place.source,
        collectionName: place.collectionName ?? null,
        importedListTags,
        importedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,entity_id,plugin_type_id" },
  );
  if (error) console.error("plugin_entity_data upsert failed", error);
}

export async function importPlacesToMap(
  admin: SupabaseClient,
  mapId: string,
  places: ParsedPlace[],
  source: ImportSource,
  options?: ImportPlacesOptions,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    added: 0,
    tagged: 0,
    skipped: 0,
    failed: 0,
  };

  const listTagName = listTagNameForSource(source);
  const listTagEmoji = listTagEmojiForSource(source);
  const tagId = await ensureMapTag(admin, mapId, listTagName, listTagEmoji);
  if (!tagId) {
    throw new Error(`Could not create tag "${listTagName}".`);
  }

  const pinIndex = await loadGooglePinIndex(admin, mapId);
  const total = places.length;
  let processed = 0;

  async function reportProgress(): Promise<void> {
    processed += 1;
    await options?.onProgress?.({ processed, total, summary: { ...summary } });
  }

  for (const place of places) {
    const existing = pinIndex.get(place.dedupKey);
    if (existing?.importedListTags.has(listTagName)) {
      summary.skipped += 1;
      await reportProgress();
      continue;
    }

    if (existing) {
      const attached = await attachTagToPin(admin, existing.pinId, tagId);
      if (!attached) {
        summary.failed += 1;
        await reportProgress();
        continue;
      }

      existing.importedListTags.add(listTagName);
      await upsertGooglePinMetadata(admin, mapId, existing.pinId, place, [
        ...existing.importedListTags,
      ]);
      summary.tagged += 1;
      await reportProgress();
      continue;
    }

    const coords = coordsForPlace(place);
    if (!coords) {
      summary.failed += 1;
      await reportProgress();
      continue;
    }

    const { data: pin, error: pinErr } = await admin
      .from("pins")
      .insert({
        map_id: mapId,
        title: place.title,
        description: place.note,
        lat: coords.lat,
        lng: coords.lng,
        geocode: null,
      })
      .select("id")
      .single();

    if (pinErr || !pin?.id) {
      console.error("pin insert failed", pinErr);
      summary.failed += 1;
      await reportProgress();
      continue;
    }

    const pinId = pin.id as string;
    await attachTagToPin(admin, pinId, tagId);

    const { error: linkErr } = await admin.from("pin_links").insert({
      map_id: mapId,
      pin_id: pinId,
      url: place.googleMapsUrl,
      title: place.title,
      description: place.note,
      sort_order: 0,
    });
    if (linkErr) console.error("pin_link insert failed", linkErr);

    const importedListTags = [listTagName];
    await upsertGooglePinMetadata(admin, mapId, pinId, place, importedListTags);

    pinIndex.set(place.dedupKey, {
      pinId,
      importedListTags: new Set(importedListTags),
    });
    summary.added += 1;
    await reportProgress();
  }

  return summary;
}

export function placesForSource(
  cache: CachedExportData | null,
  source: ImportSource,
): ParsedPlace[] {
  if (!cache) return [];
  if (source.type === "starred") return cache.starred?.places ?? [];
  const col = cache.collections?.byName[source.name];
  return col?.places ?? [];
}
