import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { pluginApiRegistry } from "./api-registry.gen.ts";
import { handle } from "./lib/_api/app.ts";
import { signUserJwt } from "./lib/_api/jwt.ts";

/**
 * Public REST API (alpha) on Supabase Edge Functions. All logic lives in
 * `@curolia/api` (synced into `lib/_api`); this adapter only wires env + clients,
 * so the API can later be served from another host with a different `basePath`.
 */
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
/** Project JWT secret (legacy HS256) used to mint short-lived user tokens. */
const jwtSecret =
  Deno.env.get("API_JWT_SECRET") ?? Deno.env.get("SUPABASE_JWT_SECRET");

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

Deno.serve((req) => {
  // The OpenAPI document is public and needs no database access.
  if (!jwtSecret && !new URL(req.url).pathname.endsWith("/v1/openapi.json")) {
    return new Response(
      JSON.stringify({
        error: { code: "misconfigured", message: "API_JWT_SECRET is not set" },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  return handle(
    req,
    {
      plugins: pluginApiRegistry,
      async resolveKey(key) {
        const { data, error } = await admin.rpc("resolve_api_key", {
          p_key: key,
        });
        const row = Array.isArray(data) ? data[0] : null;
        if (error || !row) return null;
        return {
          userId: row.user_id as string,
          scopes: row.scopes as string[],
        };
      },
      async userClient(userId) {
        const token = await signUserJwt(userId, jwtSecret!);
        return createClient(supabaseUrl, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
      },
    },
    { basePath: "/api" },
  );
});
