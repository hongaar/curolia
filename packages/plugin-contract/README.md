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
- **`PinDetailSection`**: optional block on the pin detail route; receives **`PinContextProps`** (pin id, map id, dates, `supabase`, `userId`). Plugins that persist JSON should use the shared **`plugin_entity_data`** table (see Supabase migrations).

### Entity-attached plugin data

Structured payloads keyed by **`entity_type`** + **`entity_id`** + **`plugin_type_id`** live in **`public.plugin_entity_data`** so plugins do not overload unrelated tables (e.g. pin links).
