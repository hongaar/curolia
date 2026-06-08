import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";
import {
  DEFAULT_LIST_EMOJI,
  suggestEmojiForNameSync,
} from "./_services/emoji/index.ts";
import type {
  ParsedPolarstepsStep,
  ParsedPolarstepsTrip,
} from "./parse-trip.ts";
import { importStepPhotos } from "./photo-import.ts";

export const PLUGIN_TYPE_ID = "polarsteps";

export type ImportSource = { type: "share_url"; shareUrl: string };

export type ImportSummary = {
  added: number;
  tagged: number;
  skipped: number;
  failed: number;
  photosImported: number;
  photosFailed: number;
};

export type ImportProgressUpdate = {
  processed: number;
  total: number;
  summary: ImportSummary;
  phase?: string;
};

export type ImportStepsOptions = {
  onProgress?: (update: ImportProgressUpdate) => void | Promise<void>;
};

type PinIndexEntry = {
  pinId: string;
  importedTripTags: Set<string>;
};

type PinIndex = Map<string, PinIndexEntry>;

export function mergeImportedTripIds(
  existing: string[] | undefined,
  tripIds: string[],
): string[] {
  const next = new Set(existing ?? []);
  for (const id of tripIds) next.add(id);
  return [...next];
}

export function tripTagEmoji(tripTitle: string): string {
  return suggestEmojiForNameSync(tripTitle, {
    fallback: DEFAULT_LIST_EMOJI,
  }).emoji;
}

async function loadPinIndex(
  admin: SupabaseClient,
  mapId: string,
): Promise<PinIndex> {
  const index: PinIndex = new Map();
  const { data, error } = await admin
    .from("plugin_entity_data")
    .select("entity_id, data")
    .eq("map_id", mapId)
    .eq("entity_type", "pin")
    .eq("plugin_type_id", PLUGIN_TYPE_ID);

  if (error) {
    console.error("loadPinIndex failed", error);
    return index;
  }

  for (const row of data ?? []) {
    const d = row.data as Record<string, unknown> | null;
    const dedupKey = d?.dedupKey;
    if (typeof dedupKey !== "string") continue;
    const tags = Array.isArray(d?.importedTripTags)
      ? (d.importedTripTags as string[])
      : [];
    index.set(dedupKey, {
      pinId: row.entity_id as string,
      importedTripTags: new Set(tags),
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

async function upsertPinMetadata(
  admin: SupabaseClient,
  mapId: string,
  pinId: string,
  step: ParsedPolarstepsStep,
  tripId: string,
  tripTitle: string,
  importedTripTags: string[],
): Promise<void> {
  const { error } = await admin.from("plugin_entity_data").upsert(
    {
      map_id: mapId,
      entity_type: "pin",
      entity_id: pinId,
      plugin_type_id: PLUGIN_TYPE_ID,
      data: {
        dedupKey: step.dedupKey,
        tripId,
        stepId: step.stepId,
        tripTitle,
        polarstepsUrl: step.polarstepsUrl,
        importedTripTags,
        importedAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "entity_type,entity_id,plugin_type_id" },
  );
  if (error) console.error("plugin_entity_data upsert failed", error);
}

async function importPhotosForPin(
  admin: SupabaseClient,
  mapId: string,
  pinId: string,
  step: ParsedPolarstepsStep,
  summary: ImportSummary,
): Promise<void> {
  const result = await importStepPhotos(admin, mapId, pinId, step.photos);
  summary.photosImported += result.imported;
  summary.photosFailed += result.failed;
}

export async function importTripToMap(
  admin: SupabaseClient,
  mapId: string,
  trip: ParsedPolarstepsTrip,
  pinIndex: PinIndex,
  options?: ImportStepsOptions,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    added: 0,
    tagged: 0,
    skipped: 0,
    failed: 0,
    photosImported: 0,
    photosFailed: 0,
  };

  const tripTitle = trip.title;
  const tagId = await ensureMapTag(
    admin,
    mapId,
    tripTitle,
    tripTagEmoji(tripTitle),
  );
  if (!tagId) {
    throw new Error(`Could not create tag "${tripTitle}".`);
  }

  const total = trip.steps.length;
  let processed = 0;

  async function reportProgress(phase?: string): Promise<void> {
    processed += 1;
    await options?.onProgress?.({
      processed,
      total,
      summary: { ...summary },
      phase,
    });
  }

  for (const step of trip.steps) {
    const existing = pinIndex.get(step.dedupKey);

    if (existing?.importedTripTags.has(tripTitle)) {
      await importPhotosForPin(admin, mapId, existing.pinId, step, summary);
      summary.skipped += 1;
      await reportProgress(`Skipped ${step.title}`);
      continue;
    }

    if (existing) {
      const attached = await attachTagToPin(admin, existing.pinId, tagId);
      if (!attached) {
        summary.failed += 1;
        await reportProgress();
        continue;
      }
      existing.importedTripTags.add(tripTitle);
      await upsertPinMetadata(
        admin,
        mapId,
        existing.pinId,
        step,
        trip.tripId,
        tripTitle,
        [...existing.importedTripTags],
      );
      await importPhotosForPin(admin, mapId, existing.pinId, step, summary);
      summary.tagged += 1;
      await reportProgress(`Tagged ${step.title}`);
      continue;
    }

    const { data: pin, error: pinErr } = await admin
      .from("pins")
      .insert({
        map_id: mapId,
        title: step.title,
        description: step.description,
        lat: step.lat,
        lng: step.lng,
        geocode: null,
        ...(step.date ? { date: step.date } : {}),
        ...(step.endDate ? { end_date: step.endDate } : {}),
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

    if (step.polarstepsUrl) {
      const { error: linkErr } = await admin.from("pin_links").insert({
        map_id: mapId,
        pin_id: pinId,
        url: step.polarstepsUrl,
        title: step.title,
        description: step.description,
        sort_order: 0,
      });
      if (linkErr) console.error("pin_link insert failed", linkErr);
    }

    const importedTripTags = [tripTitle];
    await upsertPinMetadata(
      admin,
      mapId,
      pinId,
      step,
      trip.tripId,
      tripTitle,
      importedTripTags,
    );

    await importPhotosForPin(admin, mapId, pinId, step, summary);

    pinIndex.set(step.dedupKey, {
      pinId,
      importedTripTags: new Set(importedTripTags),
    });
    summary.added += 1;
    await reportProgress(`Imported ${step.title}`);
  }

  return summary;
}

export async function importTripsToMap(
  admin: SupabaseClient,
  mapId: string,
  trips: ParsedPolarstepsTrip[],
  options?: ImportStepsOptions,
): Promise<ImportSummary> {
  const pinIndex = await loadPinIndex(admin, mapId);
  const combined: ImportSummary = {
    added: 0,
    tagged: 0,
    skipped: 0,
    failed: 0,
    photosImported: 0,
    photosFailed: 0,
  };

  for (const trip of trips) {
    const summary = await importTripToMap(
      admin,
      mapId,
      trip,
      pinIndex,
      options,
    );
    combined.added += summary.added;
    combined.tagged += summary.tagged;
    combined.skipped += summary.skipped;
    combined.failed += summary.failed;
    combined.photosImported += summary.photosImported;
    combined.photosFailed += summary.photosFailed;
  }

  return combined;
}
