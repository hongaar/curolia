import featureJournals from "../../public/landing/feature-journals.jpg";
import featureMap from "../../public/landing/feature-map.jpg";
import featurePlugins from "../../public/landing/feature-plugins.jpg";
import featureTraces from "../../public/landing/feature-traces.jpg";
import hero from "../../public/landing/hero.jpg";

/** Landing photography bundled with `@curolia/site`. */
export const defaultLandingImages = {
  hero: {
    src: hero,
    alt: "Sunset over terraced rice fields",
  },
  map: {
    src: featureMap,
    alt: "Winding river through a misty green valley",
  },
  traces: {
    src: featureTraces,
    alt: "Mountain river valley with forest and snow peaks",
  },
  journals: {
    src: featureJournals,
    alt: "Coastal hills with yellow wildflowers above the sea",
  },
  plugins: {
    src: featurePlugins,
    alt: "Sunset over a savanna plain with scattered trees",
  },
} as const;
