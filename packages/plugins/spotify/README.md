# Spotify plugin (`@curolia/plugin-spotify`)

> **Disabled in the app** (package kept in the monorepo). Spotify’s Web API only exposes a shallow **recently played** feed (roughly the last few days), which cannot satisfy pin **date-range** listening history. Re-enable by setting `implemented: true` in `src/plugin-meta.ts`, restoring `@curolia/plugin-spotify` in `apps/web/package.json`, and removing `spotify` from `DISABLED_PLUGIN_PACKAGE_DIRS` in `packages/supabase/scripts/sync-plugins.mjs` and `extract-plugin-oauth-registry.ts`, then run `plugins:sync` and `functions:sync`.

Resolves **top streamed tracks** (by replay count in your Spotify **recently played** history) that fall within each pin’s **date range**, stores them in **`public.plugin_entity_data`**, and renders a **Spotify** card on the **pin detail** page. OAuth uses the shared **`plugin-oauth`** Edge Function (PKCE).

## Prerequisites

- **`SPOTIFY_CLIENT_ID`** in **`packages/supabase/supabase/functions/.env`** (local) or Supabase secrets (production).
- **`SPOTIFY_CLIENT_SECRET`** is optional: use it if your Spotify app is configured as a **confidential** client; the token exchange sends it when set.
- Same **`PLUGIN_OAUTH_ENCRYPTION_KEY`** as other plugin OAuth (see repo root README).

## Spotify Developer Dashboard

1. Create an app at [Spotify for Developers](https://developer.spotify.com/dashboard).
2. **Redirect URIs**: add your **`plugin-oauth`** callback **exactly** (same path as Google OAuth in this repo):
   - Local: `http://127.0.0.1:54321/functions/v1/plugin-oauth?action=callback` (adjust host/port if your Supabase API URL differs).
   - Production: `https://<project-ref>.supabase.co/functions/v1/plugin-oauth?action=callback`.
3. Required scope for this plugin is **`user-read-recently-played`** (declared in the plugin manifest; the OAuth registry is generated via `functions:sync`).

## App usage

1. **Settings → Plugins**: enable **Spotify**, then **Link Spotify**.
2. Open a **pin** that has a **start date** (and optional end date). The pin detail page runs sync when dates are set; changing dates invalidates the sync query key (see **`spotifyPinSyncQueryKey`** in **`src/query-keys.ts`**) so Spotify refreshes without extra wiring in the web shell.

## Behaviour notes

- Ranking uses **recently played** entries inside the pin window, **not** Spotify’s separate “top tracks” API (which uses fixed time ranges, not calendar dates).
- Long windows are capped: see **`SPOTIFY_RECENTLY_PLAYED_MAX_PAGES`** and related constants in **`src/constants.ts`** to avoid excessive Spotify pagination.
- Payload shape for `plugin_entity_data.data` is **`SpotifyPinPayload`** in **`src/spotify-pin-data.ts`** (`schemaVersion: 1`).

### Why past pin dates often show “no plays”

Spotify’s **[Get Recently Played Tracks](https://developer.spotify.com/documentation/web-api/reference/get-recently-played)** endpoint exposes **recent** streams with pagination—it is **not** a complete listening-history archive by calendar day. Third‑party integrations cannot reconstruct “everything you played on 2023‑06‑15” the way your Spotify Wrapped or internal Spotify logs might.

In practice:

- Only plays that appear in this **recently-played feed** can be matched to your pin window. Listening **months or years ago** usually **won’t** appear, even if you definitely listened that day.
- Cursor paging helps scan backward only **within the history Spotify returns** for your account; once the API stops returning older pages, we cannot see further back ([historical discussion](https://github.com/spotify/web-api/issues/1405)).
- Pin dates are interpreted as **UTC** calendar days (`YYYY-MM-DD` → start/end of that day in UTC). Local‑timezone listening can fall on the adjacent UTC date.

For calendar‑accurate long‑term scrobbling, users typically need something like **Last.fm** (or another service that logs plays continuously), not the Spotify Web API alone.
