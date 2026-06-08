# Polarsteps plugin (`@curolia/plugin-polarsteps`)

Imports **Polarsteps trip steps** and **photos** into Curolia map pins via a **trip share link**.

## Important

Polarsteps does not offer a public developer API. This plugin uses the same undocumented trip endpoint as community tools (API version 62), authenticated by the optional `?s=` secret on share links. Use it only for your own trips. Curolia is not affiliated with Polarsteps.

## Prerequisites

- Local or hosted Supabase with Edge Functions deployed (`npx turbo run functions:sync`).
- No extra API keys required.

## App usage

1. **Plugins** (user menu): enable **Polarsteps**.
2. **Map settings → Polarsteps**: open the import wizard.
3. Paste a **share link** from the Polarsteps app (Share → copy link).
4. Select trips and **Import to map**.

Each step becomes a dated pin tagged with the trip name. Step photos are downloaded into the `pin-photos` storage bucket.

## Edge function

Slug: `polarsteps`

Actions:

- `preview_trip` — fetch trip metadata from a share URL
- `list_trips` — cached trip previews for the user
- `import` — background import of selected share URLs
- `sync_status` — per-map import job state
