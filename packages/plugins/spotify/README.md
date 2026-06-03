# Spotify plugin (`@curolia/plugin-spotify`)

Attach **Spotify tracks and playlists** to pins. Metadata is resolved via the **`spotify`** Edge Function (Spotify Web API client credentials) and stored in **`public.plugin_entity_data`**.

**OAuth** (PKCE via **`plugin-oauth`**) powers the **Your library** search group (playlists + saved tracks). **Spotify** (catalog) search uses client credentials and works without linking. Scopes: `playlist-read-private`, `user-library-read`, `user-read-email`.

## Prerequisites

- **`SPOTIFY_CLIENT_ID`** and **`SPOTIFY_CLIENT_SECRET`** in **`packages/supabase/supabase/functions/.env`** (local) or Supabase secrets (production). The **`spotify`** function refuses requests if either is missing.

## Spotify Developer Dashboard

1. Create an app at [Spotify for Developers](https://developer.spotify.com/dashboard).
2. **Redirect URIs** (if users link accounts): same **`plugin-oauth`** callback as other OAuth plugins (see repo root README).
3. OAuth scopes are declared in the plugin manifest (`playlist-read-private`, `user-library-read`, `user-read-email`).

## App usage

1. **Settings → Plugins**: enable **Spotify**.
2. **Link Spotify** under Settings → Plugins (re-link once after scope updates).
3. **Edit** a pin, search your library under **Spotify**, and pick one result (one per pin). The pin detail page shows the Spotify embed only (`pinDetailPlain` on the manifest—no plugin card chrome).

## Payload

**`SpotifyPinPayload`** (`schemaVersion: 2`) in **`src/spotify-pin-data.ts`**: at most one entry in **`items`** (track or playlist metadata for search + embed).
