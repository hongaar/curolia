import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { PLUGIN_SYNC_DISPATCH_REGISTRY } from "./dispatch-registry.gen.ts";

const PLUGIN_SYNC_DISPATCH_SECRET_ENV = "PLUGIN_SYNC_DISPATCH_SECRET";
const DEFAULT_BATCH_PER_PLUGIN = 5;
const MAX_BATCH_PER_PLUGIN = 20;

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Plugin-agnostic worker: forwards pending jobs to each registered plugin dispatch function. */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const dispatchSecret =
    Deno.env.get(PLUGIN_SYNC_DISPATCH_SECRET_ENV) ??
    Deno.env.get("OSM_POI_DISPATCH_SECRET");
  if (!dispatchSecret) {
    return jsonResponse(500, {
      error: `${PLUGIN_SYNC_DISPATCH_SECRET_ENV} is not configured`,
    });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (authHeader !== `Bearer ${dispatchSecret}`) {
    return jsonResponse(401, { error: "Unauthorized" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRole) {
    return jsonResponse(500, { error: "Supabase env vars missing" });
  }

  const body = (await req.json().catch(() => ({}))) as {
    limit?: number;
    pluginTypeId?: string;
  };
  const batchPerPlugin = Math.min(
    Math.max(body.limit ?? DEFAULT_BATCH_PER_PLUGIN, 1),
    MAX_BATCH_PER_PLUGIN,
  );

  const admin = createClient(supabaseUrl, serviceRole);
  const registry = body.pluginTypeId
    ? PLUGIN_SYNC_DISPATCH_REGISTRY.filter(
        (entry) => entry.pluginTypeId === body.pluginTypeId,
      )
    : PLUGIN_SYNC_DISPATCH_REGISTRY;

  const results: Record<string, unknown>[] = [];

  for (const entry of registry) {
    const { count, error: countErr } = await admin
      .from("plugin_sync_jobs")
      .select("id", { count: "exact", head: true })
      .eq("plugin_type_id", entry.pluginTypeId)
      .eq("status", "pending");

    if (countErr) {
      results.push({
        pluginTypeId: entry.pluginTypeId,
        error: countErr.message,
      });
      continue;
    }
    if (!count || count === 0) continue;

    const limit = Math.min(batchPerPlugin, count);
    const res = await fetch(
      `${supabaseUrl}/functions/v1/${entry.dispatchFunctionSlug}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${dispatchSecret}`,
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ limit }),
      },
    );

    let payload: Record<string, unknown> = {};
    try {
      payload = (await res.json()) as Record<string, unknown>;
    } catch {
      payload = { raw: await res.text() };
    }

    results.push({
      pluginTypeId: entry.pluginTypeId,
      dispatchFunctionSlug: entry.dispatchFunctionSlug,
      pending: count,
      limit,
      status: res.status,
      ...payload,
    });
  }

  return jsonResponse(200, {
    dispatched: results.length,
    results,
  });
});
