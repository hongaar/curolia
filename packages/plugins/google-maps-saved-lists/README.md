# Google Maps saved lists plugin (`@curolia/plugin-google-maps-saved-lists`)

Imports **starred places** and **custom saved lists** from Google Maps into Curolia map pins via Google's official [Data Portability API](https://developers.google.com/data-portability).

## Prerequisites

- Local or hosted Supabase with Edge Functions deployed.
- **`PLUGIN_OAUTH_ENCRYPTION_KEY`**
- **`GOOGLE_DATAPORTABILITY_CLIENT_ID`** / **`GOOGLE_DATAPORTABILITY_CLIENT_SECRET`** (recommended: a **dedicated** OAuth Web client — see below). Falls back to **`GOOGLE_CLIENT_ID`** / **`GOOGLE_CLIENT_SECRET`** if unset.
- **`GOOGLE_PLACES_API_KEY`** (or **`GOOGLE_MAPS_API_KEY`**) for place lookup during download.
- **`GEOAPIFY_API_KEY`** (recommended fallback geocoding when Places text search misses).

## Google Cloud Console

Google **forbids mixing** Data Portability scopes with other scope types (Photos, `openid`, etc.) on the same OAuth client. If you also run **Google Photos**, create a **second** “Web application” OAuth client used only for Maps:

1. Enable the **Data Portability API** on your OAuth project.
2. On that client’s consent screen, add **only** these scopes (no Photos / OIDC scopes):
   - `https://www.googleapis.com/auth/dataportability.maps.starred_places`
   - `https://www.googleapis.com/auth/dataportability.saved.collections`
3. Set **`GOOGLE_DATAPORTABILITY_CLIENT_ID`** / **`GOOGLE_DATAPORTABILITY_CLIENT_SECRET`** to that client (Supabase Edge secrets + local `.env`).
4. **Authorized redirect URI** (shared `plugin-oauth` callback; register on **both** clients if you use two):
   - Local: `http://127.0.0.1:54321/functions/v1/plugin-oauth?action=callback`
   - Production: `https://<project-ref>.supabase.co/functions/v1/plugin-oauth?action=callback`

### Places API (coordinate lookup)

Collection CSVs often ship **place-id-only** Maps URLs (no embedded lat/lng). During download, Curolia resolves coordinates server-side:

1. **Embedded URL coords** when present (no API call).
2. **Google Places** — legacy Place Details by decimal `cid` from the URL, then Places API (New) text search (`title`, list name, note).
3. **Geoapify Geocoding** — same text query as fallback; batches of 15+ use Geoapify's [batch geocode API](https://www.geoapify.com/docs/geocoding/batch/) (~50% credit savings vs single requests).

Create a **server-only** API key — separate from any browser Maps key:

1. Google Cloud Console → **Credentials** → **Create API key** (or duplicate an existing one for server use).
2. **Application restrictions** → **IP addresses** — add the egress IP(s) of your Supabase Edge Functions (hosted project; for local dev use a second dev key with **None** or your machine’s public IP).
3. **API restrictions** → restrict to **Places API** and **Places API (New)** only.

An IP-restricted key **cannot** be used from a browser: browser requests come from the user’s IP, not yours, so Google rejects them even if the key string leaks into client code. Google API keys are not “secrets” in the OAuth sense — security is **restriction type + never shipping the server key to the client** (keep it in Supabase Edge Function secrets / `.env` only).

**Do not** use HTTP referrer restrictions on this key — that is for browser keys and Edge Functions send no referer (which caused the `REQUEST_DENIED` errors in your logs).

Set the server key as `GOOGLE_PLACES_API_KEY` on the `google-maps-saved-lists` Edge Function.

On-demand reverse geocoding in the web app still uses **Photon**; bulk import does **not** call Photon (fair-use / rate limits).

### Geoapify

Sign up at [geoapify.com](https://www.geoapify.com/) and set `GEOAPIFY_API_KEY`. Free tier: **3,000 credits/day**, up to **~5 requests/second** ([pricing](https://www.geoapify.com/pricing/)). The resolver spaces sequential calls (~220 ms) and uses batch mode when enough URLs remain in a worker batch.

### Production verification

`maps.starred_places` is a **restricted** scope. Public rollout requires Google OAuth verification and likely a CASA security assessment. While the app is in **Testing** mode, add up to 100 test Google accounts.

During OAuth, users choose **one-time** or **time-based** (30/180 day) export access. Google allows at most **one export per resource group per 24 hours**.

## App usage

1. **Plugins** (user menu): enable **Google Maps**, then **Link Google Maps**.
2. **Map settings → Google Maps**: open the import wizard, **download** your Google Maps data (once per account), choose one or more lists, then **Import to map**.

Downloaded data is cached per user and can be imported into any map. Coordinates are resolved during download so import stays fast. Refreshing the download will be supported in a future release.

## Limitations

- Import is **Curolia ← Google only** (no write-back to Google lists).
- Not real-time; exports are async ZIP archives from Data Portability.
- Places that still lack coordinates after API lookup are reported as failed in the import summary.

## Troubleshooting

- **Error 400 `invalid_request` — “Incremental auth is not allowed for the requested scopes”**: Your Google account already granted **other** scopes to the same OAuth client (e.g. after linking **Google Photos**). Fix: use a **dedicated** `GOOGLE_DATAPORTABILITY_CLIENT_ID` (above), or revoke Curolia at [Google Account → Third-party access](https://myaccount.google.com/permissions) and link **Google Maps before** Photos. Curolia sends only `dataportability.*` scopes and sets `include_granted_scopes=false`.
- **Error 400 `invalid_request` (other)**: Ensure Data Portability scopes are on the consent screen and your account is a **test user** while the app is in Testing.
- **Link first**: Map settings show a reminder until OAuth is linked under Plugins.
- **Empty list dropdown**: Click **Refresh lists from Google** (triggers a Data Portability export).
- **24h rate limit**: Status shows when the next Google export is allowed.
- **One-time consent**: Re-link Google after a one-time export to import again.
- **Download stuck / most places missing coordinates**: Ensure `GOOGLE_PLACES_API_KEY` and/or `GEOAPIFY_API_KEY` are set on the Edge Function. If a prior download ran without keys, clear `coordLookupAttempted` on cached places (or re-download after wiping export cache) so lookup retries with the APIs.

After changing plugin Edge Function sources:

```bash
npx turbo run functions:sync
```
