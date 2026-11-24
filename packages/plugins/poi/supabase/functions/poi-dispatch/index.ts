import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PLUGIN_SYNC_DISPATCH_SECRET_ENV = "PLUGIN_SYNC_DISPATCH_SECRET";

function jsonResponse(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Forwards to poi `process_sync_jobs` (Overpass logic stays in the plugin function). */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const dispatchSecret =
    Deno.env.get(PLUGIN_SYNC_DISPATCH_SECRET_ENV) ??
    Deno.env.get("POI_DISPATCH_SECRET");
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
  const publishableKey = JSON.parse(
    Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}",
  ).default as string | undefined;
  if (!supabaseUrl || !publishableKey) {
    return jsonResponse(500, { error: "Supabase env vars missing" });
  }

  const body = (await req.json().catch(() => ({}))) as { limit?: number };
  const limit = Math.min(Math.max(body.limit ?? 10, 1), 50);

  const res = await fetch(`${supabaseUrl}/functions/v1/poi`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dispatchSecret}`,
      apikey: publishableKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action: "process_sync_jobs", limit }),
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
});
