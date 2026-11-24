/**
 * OpenAPI 3.1 description of the public REST API (alpha).
 * Served at `GET /v1/openapi.json` and rendered by the developer docs page.
 */

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });
const str = { type: "string" } as const;
const nullableStr = { type: ["string", "null"] } as const;
const visibility = {
  type: "string",
  enum: ["public", "unlisted", "private"],
} as const;
const dateTime = { type: "string", format: "date-time" } as const;
const nullableDate = { type: ["string", "null"], format: "date" } as const;
const uuidParam = (name: string, description: string) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string", format: "uuid" },
});
const json = (schema: unknown) => ({ "application/json": { schema } });
const ok = (description: string, schema: unknown) => ({
  description,
  content: json(schema),
});
const errors = {
  "400": { $ref: "#/components/responses/BadRequest" },
  "401": { $ref: "#/components/responses/Unauthorized" },
  "403": { $ref: "#/components/responses/Forbidden" },
  "404": { $ref: "#/components/responses/NotFound" },
};
const listOf = (name: string) => ({
  type: "object",
  required: ["data", "nextCursor"],
  properties: {
    data: { type: "array", items: ref(name) },
    nextCursor: {
      ...nullableStr,
      description:
        "Pass as `cursor` to fetch the next page; `null` on the last page.",
      examples: ["NTA="],
    },
  },
});
const pageParams = [
  {
    name: "limit",
    in: "query",
    description: "Page size (1–200, default 50).",
    schema: { type: "integer", minimum: 1, maximum: 200, default: 50 },
  },
  {
    name: "cursor",
    in: "query",
    description: "Opaque cursor from a previous response's `nextCursor`.",
    schema: str,
  },
];
const includeParam = {
  name: "include",
  in: "query",
  description: "Set to `plugins` to add plugin data to each resource.",
  schema: { type: "string", enum: ["plugins"] },
};
const mapId = uuidParam("mapId", "Map id.");
const pinId = uuidParam("pinId", "Pin id.");
const pluginId = {
  name: "pluginId",
  in: "path",
  required: true,
  description: "Plugin id (e.g. `poi`).",
  schema: str,
};

const EXAMPLE_MAP_ID = "6f1d2c3b-4a59-4e8f-9b7a-1c2d3e4f5a6b";
const EXAMPLE_PIN_ID = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";
const EXAMPLE_USER_ID = "2b3c4d5e-6f70-4812-93a4-b5c6d7e8f901";
const EXAMPLE_TIME = "2026-11-24T12:00:00.000Z";

const EX = {
  Error: { error: { code: "not_found", message: "Map not found" } },
  Profile: {
    id: EXAMPLE_USER_ID,
    slug: "ada",
    displayName: "Ada Lovelace",
    bio: "Always on the road.",
    avatarUrl: null,
    visibility: "public",
    defaultMapId: EXAMPLE_MAP_ID,
    createdAt: EXAMPLE_TIME,
    updatedAt: EXAMPLE_TIME,
  },
  ProfileUpdate: { displayName: "Ada L.", bio: "Mapping every coffee stop." },
  Map: {
    id: EXAMPLE_MAP_ID,
    name: "Italy 2026",
    slug: "italy-2026",
    description: "Two weeks from Milan to Naples.",
    iconEmoji: "🇮🇹",
    visibility: "unlisted",
    role: "owner",
    createdAt: EXAMPLE_TIME,
    updatedAt: EXAMPLE_TIME,
  },
  MapCreate: { name: "Italy 2026", iconEmoji: "🇮🇹", visibility: "private" },
  MapUpdate: { description: "Two weeks from Milan to Naples." },
  Pin: {
    id: EXAMPLE_PIN_ID,
    mapId: EXAMPLE_MAP_ID,
    slug: "colosseum",
    title: "Colosseum",
    description: "Go early to beat the queue.",
    lat: 41.8902,
    lng: 12.4922,
    date: "2026-05-12",
    endDate: null,
    createdAt: EXAMPLE_TIME,
    updatedAt: EXAMPLE_TIME,
  },
  PinCreate: {
    lat: 41.8902,
    lng: 12.4922,
    title: "Colosseum",
    date: "2026-05-12",
  },
  PinUpdate: { title: "Colosseum at sunrise" },
} as const;

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Curolia API",
    version: "1.0.0-alpha",
    description:
      "**Alpha:** this API may change at any time, without backwards compatibility or prior notice. " +
      "Authenticate with an API key from the developer portal: `Authorization: Bearer cur_live_…`. " +
      "Keys act as your account; `read` keys may only use GET, `write` is required for everything else.",
    "x-status": "alpha",
  },
  servers: [
    {
      url: "https://{project}.supabase.co/functions/v1/api",
      variables: { project: { default: "your-project" } },
    },
  ],
  security: [{ apiKey: [] }],
  tags: [
    { name: "Profile", description: "The account that owns the API key." },
    {
      name: "Maps",
      description: "Maps you are a member of (or public maps by id).",
    },
    { name: "Pins", description: "Pins on a map." },
    { name: "Plugins", description: "Plugin data exposed on maps and pins." },
  ],
  paths: {
    "/v1/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get your profile",
        operationId: "getProfile",
        responses: { "200": ok("Your profile.", ref("Profile")), ...errors },
      },
      patch: {
        tags: ["Profile"],
        summary: "Update your profile",
        operationId: "updateProfile",
        requestBody: { required: true, content: json(ref("ProfileUpdate")) },
        responses: { "200": ok("Updated profile.", ref("Profile")), ...errors },
      },
    },
    "/v1/maps": {
      get: {
        tags: ["Maps"],
        summary: "List your maps",
        operationId: "listMaps",
        parameters: [...pageParams, includeParam],
        responses: { "200": ok("A page of maps.", listOf("Map")), ...errors },
      },
      post: {
        tags: ["Maps"],
        summary: "Create a map",
        operationId: "createMap",
        requestBody: { required: true, content: json(ref("MapCreate")) },
        responses: {
          "201": ok("The new map (you are its owner).", ref("Map")),
          ...errors,
        },
      },
    },
    "/v1/maps/{mapId}": {
      parameters: [mapId],
      get: {
        tags: ["Maps"],
        summary: "Get a map",
        operationId: "getMap",
        parameters: [includeParam],
        responses: { "200": ok("The map.", ref("Map")), ...errors },
      },
      patch: {
        tags: ["Maps"],
        summary: "Update a map",
        operationId: "updateMap",
        requestBody: { required: true, content: json(ref("MapUpdate")) },
        responses: { "200": ok("Updated map.", ref("Map")), ...errors },
      },
      delete: {
        tags: ["Maps"],
        summary: "Delete a map (owner only)",
        operationId: "deleteMap",
        responses: { "204": { description: "Deleted." }, ...errors },
      },
    },
    "/v1/maps/{mapId}/plugins/{pluginId}": {
      parameters: [mapId, pluginId],
      put: {
        tags: ["Plugins"],
        summary: "Update exposed plugin settings on a map",
        description:
          "Merges `config` into the plugin's map settings. Only keys the plugin exposes are accepted.",
        operationId: "updateMapPlugin",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["config"],
            properties: { config: { type: "object" } },
          }),
        },
        responses: {
          "200": ok("Exposed settings after the update.", {
            type: "object",
            properties: { pluginId: str, config: { type: "object" } },
          }),
          ...errors,
        },
      },
    },
    "/v1/maps/{mapId}/pins": {
      parameters: [mapId],
      get: {
        tags: ["Pins"],
        summary: "List pins on a map",
        operationId: "listPins",
        parameters: [...pageParams, includeParam],
        responses: { "200": ok("A page of pins.", listOf("Pin")), ...errors },
      },
      post: {
        tags: ["Pins"],
        summary: "Create a pin",
        operationId: "createPin",
        requestBody: { required: true, content: json(ref("PinCreate")) },
        responses: { "201": ok("The new pin.", ref("Pin")), ...errors },
      },
    },
    "/v1/pins/{pinId}": {
      parameters: [pinId],
      get: {
        tags: ["Pins"],
        summary: "Get a pin",
        operationId: "getPin",
        parameters: [includeParam],
        responses: { "200": ok("The pin.", ref("Pin")), ...errors },
      },
      patch: {
        tags: ["Pins"],
        summary: "Update a pin",
        operationId: "updatePin",
        requestBody: { required: true, content: json(ref("PinUpdate")) },
        responses: { "200": ok("Updated pin.", ref("Pin")), ...errors },
      },
      delete: {
        tags: ["Pins"],
        summary: "Delete a pin",
        operationId: "deletePin",
        responses: { "204": { description: "Deleted." }, ...errors },
      },
    },
    "/v1/pins/{pinId}/plugins/{pluginId}": {
      parameters: [pinId, pluginId],
      put: {
        tags: ["Plugins"],
        summary: "Replace a plugin's data on a pin",
        description:
          "The plugin must be enabled on the pin's map and expose pin writes.",
        operationId: "updatePinPlugin",
        requestBody: {
          required: true,
          content: json({
            type: "object",
            required: ["data"],
            properties: { data: { type: "object" } },
          }),
        },
        responses: {
          "200": ok("Stored plugin data.", {
            type: "object",
            properties: { pluginId: str, data: { type: "object" } },
          }),
          ...errors,
        },
      },
    },
  },
  components: {
    securitySchemes: {
      apiKey: {
        type: "http",
        scheme: "bearer",
        description: "API key (`cur_live_…`) from the developer portal.",
      },
    },
    responses: {
      BadRequest: {
        description: "Invalid request.",
        content: json(ref("Error")),
      },
      Unauthorized: {
        description: "Missing, invalid or revoked API key.",
        content: json(ref("Error")),
      },
      Forbidden: {
        description: "Key lacks the scope, or you lack permission.",
        content: json(ref("Error")),
      },
      NotFound: {
        description: "Not found (or not visible to you).",
        content: json(ref("Error")),
      },
    },
    schemas: {
      Error: {
        examples: [EX.Error],
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: { code: str, message: str },
          },
        },
      },
      Plugins: {
        type: "object",
        description:
          "Present with `include=plugins`: data keyed by plugin id, for enabled plugins that expose it.",
        additionalProperties: true,
      },
      Profile: {
        examples: [EX.Profile],
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          slug: str,
          displayName: nullableStr,
          bio: nullableStr,
          avatarUrl: nullableStr,
          visibility,
          defaultMapId: nullableStr,
          createdAt: dateTime,
          updatedAt: dateTime,
        },
      },
      ProfileUpdate: {
        examples: [EX.ProfileUpdate],
        type: "object",
        additionalProperties: false,
        properties: { displayName: nullableStr, bio: nullableStr, slug: str },
      },
      Map: {
        examples: [EX.Map],
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: str,
          slug: str,
          description: nullableStr,
          iconEmoji: nullableStr,
          visibility,
          role: {
            ...nullableStr,
            description:
              "Your role (`owner`, `editor`, `viewer`) or `null` for a public map you are not a member of.",
          },
          createdAt: dateTime,
          updatedAt: dateTime,
          plugins: ref("Plugins"),
        },
      },
      MapCreate: {
        examples: [EX.MapCreate],
        type: "object",
        additionalProperties: false,
        required: ["name"],
        properties: {
          name: str,
          description: nullableStr,
          iconEmoji: nullableStr,
          visibility,
        },
      },
      MapUpdate: {
        examples: [EX.MapUpdate],
        type: "object",
        additionalProperties: false,
        properties: {
          name: str,
          description: nullableStr,
          iconEmoji: nullableStr,
          visibility,
        },
      },
      Pin: {
        examples: [EX.Pin],
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          mapId: { type: "string", format: "uuid" },
          slug: str,
          title: nullableStr,
          description: nullableStr,
          lat: { type: "number" },
          lng: { type: "number" },
          date: nullableDate,
          endDate: nullableDate,
          createdAt: dateTime,
          updatedAt: dateTime,
          plugins: ref("Plugins"),
        },
      },
      PinCreate: {
        examples: [EX.PinCreate],
        type: "object",
        additionalProperties: false,
        required: ["lat", "lng"],
        properties: {
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
          title: nullableStr,
          description: nullableStr,
          date: nullableDate,
          endDate: nullableDate,
        },
      },
      PinUpdate: {
        examples: [EX.PinUpdate],
        type: "object",
        additionalProperties: false,
        properties: {
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
          title: nullableStr,
          description: nullableStr,
          date: nullableDate,
          endDate: nullableDate,
        },
      },
    },
  },
} as const;

export type OpenApiDocument = typeof openApiDocument;

// ---- Example helpers (used by the developer docs) --------------------------

type Schema = Record<string, unknown>;

/** Resolves a local `#/components/...` `$ref` against {@link openApiDocument}. */
export function resolveRef(node: unknown): Schema {
  let cur = node as Schema;
  for (let i = 0; i < 10 && cur && typeof cur.$ref === "string"; i++) {
    const parts = (cur.$ref as string).replace(/^#\//, "").split("/");
    cur = parts.reduce<unknown>(
      (acc, key) => (acc as Record<string, unknown>)?.[key],
      openApiDocument,
    ) as Schema;
  }
  return cur ?? {};
}

/** Builds an example value for a schema: `examples` first, then a type-based sample. */
export function exampleFor(node: unknown, depth = 0): unknown {
  const schema = resolveRef(node);
  if (Array.isArray(schema.examples) && schema.examples.length) {
    return schema.examples[0];
  }
  if (depth > 6) return null;
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (Array.isArray(schema.enum)) return schema.enum[0];
  switch (type) {
    case "object": {
      const props = (schema.properties ?? {}) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(props).map(([k, v]) => [k, exampleFor(v, depth + 1)]),
      );
    }
    case "array":
      return [exampleFor(schema.items, depth + 1)];
    case "integer":
    case "number":
      return 0;
    case "boolean":
      return true;
    case "string":
      if (schema.format === "uuid") return EXAMPLE_MAP_ID;
      if (schema.format === "date-time") return EXAMPLE_TIME;
      if (schema.format === "date") return "2026-05-12";
      return "string";
    default:
      return null;
  }
}
