import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import postgres from "npm:postgres@3.4.7";

import { pluginApiRegistry } from "./api-registry.gen.ts";
import { handle, isPublicPath } from "./lib/_api/app.ts";

/**
 * Public REST API (alpha) on Supabase Edge Functions. All logic lives in
 * `@curolia/api` (synced into `lib/_api`); this adapter only wires the database,
 * so the API can later be served from another host with a different `basePath`.
 *
 * Queries run over a direct Postgres connection. Each request is a transaction
 * that switches to the `authenticated` role with the key owner's JWT claims
 * (as PostgREST does), so RLS applies without minting tokens or using API keys.
 */
const dbUrl = Deno.env.get("SUPABASE_DB_URL");

const sql = dbUrl
  ? postgres(dbUrl, { max: 3, prepare: false, idle_timeout: 20 })
  : null;

Deno.serve((req) => {
  if (!sql && !isPublicPath(new URL(req.url).pathname)) {
    return new Response(
      JSON.stringify({
        error: { code: "misconfigured", message: "SUPABASE_DB_URL is not set" },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
  return handle(
    req,
    {
      plugins: pluginApiRegistry,
      async resolveKey(key) {
        const [row] = await sql!.unsafe(
          "select user_id, scopes from public.resolve_api_key($1)",
          [key],
        );
        if (!row) return null;
        return {
          userId: row.user_id as string,
          scopes: row.scopes as string[],
        };
      },
      withUser(userId, fn) {
        return sql!.begin(async (tx) => {
          await tx.unsafe("set local role authenticated");
          await tx.unsafe("select set_config('request.jwt.claims', $1, true)", [
            JSON.stringify({ sub: userId, role: "authenticated" }),
          ]);
          return fn({
            query: (text, params = []) =>
              tx.unsafe(text, params as never[]) as unknown as Promise<
                Record<string, unknown>[]
              >,
          });
        }) as Promise<Awaited<ReturnType<typeof fn>>>;
      },
    },
    { basePath: "/api" },
  );
});
