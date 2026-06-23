export function requireSupabaseEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      [
        `Missing required environment variable: ${name}`,
        "",
        "Local: start Supabase and run via the package script so credentials load from `supabase status`:",
        "  npm run db:start -w @curolia/supabase",
        "  npm run db:seed:e2e -w @curolia/supabase",
        "",
        "Or export explicitly (from `npm run db:status -w @curolia/supabase`):",
        "  SUPABASE_URL",
        "  SUPABASE_SERVICE_ROLE_KEY",
      ].join("\n"),
    );
  }
  return value;
}
