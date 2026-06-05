import type { PluginPackageManifest } from "@curolia/plugin-contract";
import { WikidataIcon } from "./icon";
import { WikidataPinDetailSection } from "./pin-detail-section";
import { WikidataPinDraftEnrichmentSlot } from "./pin-draft-enrichment-slot";
import { WikidataPinFormSection } from "./pin-form-section";
import { wikidataPluginMeta } from "./plugin-meta";

export const wikidataPluginManifest: PluginPackageManifest = {
  id: wikidataPluginMeta.typeId,
  displayName: wikidataPluginMeta.displayName,
  description:
    "Show a short Wikipedia extract for the nearest notable place at each pin’s coordinates.",
  icon: WikidataIcon,
  implemented: wikidataPluginMeta.implemented,
  PinDetailSection: WikidataPinDetailSection,
  PinFormSection: WikidataPinFormSection,
  PinDraftEnrichmentSlot: WikidataPinDraftEnrichmentSlot,
  contributions: {
    appHooks: [
      {
        name: "pins.suggestFieldsFromCoordinates",
        description:
          "Suggest pin title and description from the nearest Wikipedia article.",
      },
    ],
    edgeFunctions: [
      {
        slug: "wikidata",
        verifyJwt: true,
        description:
          "Query Wikidata for nearby notable places and fetch Wikipedia summaries.",
      },
    ],
  },
};
