import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const DISPATCH_SECRET_ENV = "PLUGIN_SYNC_DISPATCH_SECRET";
const BATCH_LIMIT = 10;

const ENRICHERS = ["wikidata", "commons"] as const;

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function upsertPlaceMetadata(
  admin: ReturnType<typeof createClient>,
  placeId: string,
  fieldKey: string,
  sourcePluginId: string,
  value: Record<string, unknown>,
): Promise<void> {
  const { error } = await admin.from("place_metadata").upsert(
    {
      place_id: placeId,
      field_key: fieldKey,
      source_plugin_id: sourcePluginId,
      value,
    },
    { onConflict: "place_id,field_key,source_plugin_id" },
  );
  if (error) throw error;
}

async function enrichWikidata(
  admin: ReturnType<typeof createClient>,
  placeId: string,
): Promise<void> {
  const { data: place, error } = await admin
    .from("places")
    .select("lat, lng, name")
    .eq("id", placeId)
    .maybeSingle();
  if (error || !place?.lat || !place?.lng) return;

  const geoUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gsradius=250&gscoord=${place.lat}|${place.lng}&gslimit=1&format=json&origin=*`;
  const geoRes = await fetch(geoUrl, {
    headers: { "User-Agent": "Curolia/1.0 (place-enrichment)" },
  });
  if (!geoRes.ok) return;
  const geoJson = (await geoRes.json()) as {
    query?: { geosearch?: { title?: string; pageid?: number }[] };
  };
  const hit = geoJson.query?.geosearch?.[0];
  if (!hit?.title) return;

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
  const summaryRes = await fetch(summaryUrl, {
    headers: { "User-Agent": "Curolia/1.0 (place-enrichment)" },
  });
  if (!summaryRes.ok) return;
  const summary = (await summaryRes.json()) as {
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
    thumbnail?: { source?: string };
  };

  if (summary.extract) {
    await upsertPlaceMetadata(admin, placeId, "wikipedia_extract", "wikidata", {
      value: summary.extract,
    });
  }
  if (summary.content_urls?.desktop?.page) {
    await upsertPlaceMetadata(admin, placeId, "wikipedia_url", "wikidata", {
      value: summary.content_urls.desktop.page,
    });
  }
  if (summary.thumbnail?.source) {
    await upsertPlaceMetadata(admin, placeId, "photo_url", "wikidata", {
      url: summary.thumbnail.source,
    });
  }

  await admin
    .from("places")
    .update({ last_enriched_at: new Date().toISOString() })
    .eq("id", placeId);
}

async function enrichCommons(
  admin: ReturnType<typeof createClient>,
  placeId: string,
): Promise<void> {
  const { data: place, error } = await admin
    .from("places")
    .select("lat, lng")
    .eq("id", placeId)
    .maybeSingle();
  if (error || !place?.lat || !place?.lng) return;

  const url = `https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=${place.lat}|${place.lng}&gsradius=500&gslimit=5&format=json&origin=*`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Curolia/1.0 (place-enrichment)" },
  });
  if (!res.ok) return;
  const json = (await res.json()) as {
    query?: { geosearch?: unknown[] };
  };
  const count = json.query?.geosearch?.length ?? 0;
  if (count > 0) {
    await upsertPlaceMetadata(
      admin,
      placeId,
      "commons_photo_count",
      "commons",
      {
        value: count,
      },
    );
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "method_not_allowed" });
  }

  const secret =
    Deno.env.get(DISPATCH_SECRET_ENV) ?? Deno.env.get("POI_DISPATCH_SECRET");
  if (!secret) {
    return jsonResponse(500, { error: "dispatch_secret_missing" });
  }
  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader !== `Bearer ${secret}`) {
    return jsonResponse(401, { error: "unauthorized" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return jsonResponse(500, { error: "supabase_env_missing" });
  }

  const admin = createClient(supabaseUrl, serviceRole);
  const results: Record<string, unknown>[] = [];

  for (const pluginTypeId of ENRICHERS) {
    const { data: jobs, error } = await admin
      .from("place_enrichment_jobs")
      .select("id, place_id, plugin_type_id, attempts")
      .eq("plugin_type_id", pluginTypeId)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(BATCH_LIMIT);

    if (error) {
      results.push({ pluginTypeId, error: error.message });
      continue;
    }

    for (const job of jobs ?? []) {
      await admin
        .from("place_enrichment_jobs")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", job.id);

      try {
        if (pluginTypeId === "wikidata") {
          await enrichWikidata(admin, job.place_id);
        } else if (pluginTypeId === "commons") {
          await enrichCommons(admin, job.place_id);
        }

        await admin
          .from("place_enrichment_jobs")
          .update({
            status: "completed",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);

        await admin.rpc("recompute_place_prominence", {
          p_place_id: job.place_id,
        });

        results.push({ jobId: job.id, pluginTypeId, ok: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : "enrich_failed";
        await admin
          .from("place_enrichment_jobs")
          .update({
            status: "failed",
            attempts: job.attempts + 1,
            last_error: message.slice(0, 500),
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        results.push({ jobId: job.id, pluginTypeId, error: message });
      }
    }
  }

  return jsonResponse(200, { processed: results.length, results });
});
