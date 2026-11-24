/**
 * Base URL of the public REST API (alpha), in front of `/v1`.
 * Set `VITE_PUBLIC_API_URL` once the API moves to its own host (e.g. `https://api.curolia.com`).
 */
export function publicApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_PUBLIC_API_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");
  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? "").replace(
    /\/+$/,
    "",
  );
  return `${supabaseUrl}/functions/v1/api`;
}
