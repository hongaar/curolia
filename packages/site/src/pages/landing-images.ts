import featureMaps from "../../public/landing/feature-maps.jpg";
import featureMap from "../../public/landing/feature-map.jpg";
import featurePlugins from "../../public/landing/feature-plugins.jpg";
import featurePins from "../../public/landing/feature-pins.jpg";
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
  pins: {
    src: featurePins,
    alt: "Mountain river valley with forest and snow peaks",
  },
  maps: {
    src: featureMaps,
    alt: "Coastal hills with yellow wildflowers above the sea",
  },
  plugins: {
    src: featurePlugins,
    alt: "Sunset over a savanna plain with scattered trees",
  },
} as const;
