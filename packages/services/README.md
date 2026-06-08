# @curolia/services

Shared utilities for geocoding, coordinate parsing, and emoji suggestion. Used by `@curolia/web`, plugins, and Supabase Edge Functions (via `functions:sync` copy into `lib/_services/`).

## Geocoding (feature-based API)

Import from `@curolia/services/geocoding` — not provider modules.

**Browser (forward search + reverse geocode):**

```ts
import {
  searchPlaces,
  reverseGeocodeForStorage,
  reverseGeocodeDetails,
  defaultPlaceTitleForZoom,
} from "@curolia/services/geocoding";
```

**Stored pin geocode labels:**

```ts
import { pinLocationLabel, parsePinGeocode } from "@curolia/services/geocoding";
```

**Map share URL coordinate extraction:**

```ts
import {
  coordsFromMapShareUrl,
  extractLocationFromMapShareUrl,
} from "@curolia/services/geocoding";
```

**Server-side coordinate resolution (Edge Functions):**

```ts
import { createCoordResolver } from "./lib/_services/geocoding/resolver.ts";

const resolver = createCoordResolver({
  placesLookupApiKey: Deno.env.get("GOOGLE_PLACES_API_KEY"),
  forwardGeocodeApiKey: Deno.env.get("GEOAPIFY_API_KEY"),
});
```

Provider implementations (Photon, Geoapify, Google Places) live inside the package and are not part of the public export surface.

## Emoji suggestion

```ts
import { suggestEmojiForNameSync } from "@curolia/services/emoji";

const { emoji } = suggestEmojiForNameSync("Coffee shops", { fallback: "📋" });
```

Optional LLM fallback (server/Edge only): `@curolia/services/emoji/llm`.

Environment variables: `EMOJI_LLM_API_KEY`, optional `EMOJI_LLM_PROVIDER`, `EMOJI_LLM_MODEL`, `EMOJI_LLM_BASE_URL`.
