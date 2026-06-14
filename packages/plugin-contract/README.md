# `@curolia/plugin-contract`

Shared plugin contract for Curolia plugin packages and host apps.

## Purpose

- Defines the canonical plugin manifest shape (`PluginPackageManifest` / `PluginDefinition`).
- Defines contribution metadata for:
  - global settings
  - per-map settings
  - app hooks
  - Supabase Edge Function declarations
  - OAuth declarations
- Provides helpers for map plugin config records.

## Plugin package requirements

Each plugin package under `packages/plugins/<id>` should:

1. Export a manifest named `pluginManifest` from package root.
2. Keep plugin metadata in that manifest:
   - `id`
   - `displayName`
   - `description` (recommended)
   - `icon` (required React component used by host UI)
   - `implemented`
   - `contributions` (when needed)
3. Keep plugin-specific config parsing/types in the plugin package.
4. If the plugin needs OAuth, external API keys, or dashboard setup, add a **`README.md`** in that plugin package so the repo root README stays generic.

Minimal example:

```ts
import type { PluginPackageManifest } from "@curolia/plugin-contract";

function ExampleIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" />;
}

export const pluginManifest: PluginPackageManifest = {
  id: "example_plugin",
  displayName: "Example Plugin",
  description: "Example integration.",
  icon: ExampleIcon,
  implemented: true,
};
```

## Host app integration

In `@curolia/web` (`apps/web`), installed plugins are discovered from its `package.json` dependencies and generated into:

- `apps/web/src/plugins/generated-manifests.ts`

Regenerate when plugin dependencies change:

```bash
npm run plugins:sync -w @curolia/web
```

This keeps plugin add/remove flow dependency-driven (no manual registry edits).

### Pin UI surfaces

- **`PinPhotoImportSlot`**: pin editor (e.g. cloud photo pickers).
- **`PinFormSection`**: optional card body in the pin editor for existing pins; `@curolia/web` supplies the card header (icon + name).
- **`PinDetailSection`**: optional read-only block on the pin detail route; receives **`PinContextProps`** (pin id, map id, dates, `supabase`, `userId`, `pinSurface`). Plugins that persist JSON should use the shared **`plugin_entity_data`** table (see Supabase migrations).
- **`pinDetailPlain`**: set on the manifest when the detail section should omit plugin card chrome (logo, title, bordered card)—e.g. an embed-only block.

### Account plugin vs pin output (three axes)

Do not use **`user_plugins.enabled`** to gate read-only pin output that other map viewers should see.

| Axis              | Storage / field          | Gates                                                                                                          |
| ----------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Account plugin    | `user_plugins`           | Editor slots (`PinFormSection`, `PinSuggestionSlot`, photo import), client Edge writes, viewer-personal output |
| Map plugin config | `map_plugins`            | Background sync, optional map-level display (e.g. weather, Last.fm)                                            |
| Map display prefs | `maps.show_pin_metadata` | Which normalized pin metadata fields render on pins                                                            |

Set **`pinOutputScope`** on the manifest:

- **`map`** (default when `PinDetailSection` is set): pin-attached data is map content. The web shell mounts the section for all viewers when data exists; plugins must fetch **`plugin_entity_data`** on **`pinSurface: "display"`** without requiring the viewer's account plugin toggle.
- **`viewer`**: output uses the current viewer's credentials (e.g. Last.fm scrobbles). Still gated on **`user_plugins`**.

**`pinSurface`**: the shell passes **`display`** on pin detail and **`edit`** in the pin editor. Map-scoped detail sections must not check **`user_plugins`** when **`pinSurface === "display"`**.

### Entity-attached plugin data

Structured payloads keyed by **`entity_type`** + **`entity_id`** + **`plugin_type_id`** live in **`public.plugin_entity_data`** so plugins do not overload unrelated tables (e.g. pin links).

Normalized display fields (phone, hours, cuisine, …) live in **`public.pin_metadata`**.

### Future interaction plugins (comments, likes)

High-volume interaction data should use **dedicated tables** (not large JSON blobs in `plugin_entity_data`). Example shape:

- `pin_comments` — `(pin_id, map_id, author_user_id, body, created_at, …)`
- `pin_reactions` — `(pin_id, user_id, kind, …)` with unique `(pin_id, user_id, kind)`

RLS: **`select`** for map members and public map readers; **`insert`** for authenticated users with map permission (not gated on account plugin enablement).

When the first interaction plugin ships, add contract surfaces such as:

- **`PinInteractionSection`** — read path, `pinOutputScope: "map"`, mounted for all viewers
- **`PinInteractionComposer`** — write path, gated on map role / comment policy, **not** on `user_plugins`

Enabling the plugin in account settings should only control whether the editor shows composer tooling and notification preferences—not whether others can read existing comments on a pin.
