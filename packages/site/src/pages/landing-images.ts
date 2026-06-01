import { unsplashImages } from "../content/unsplash-images";

/**
 * Landing imagery for Storybook overrides and tests.
 * Production pages use Unsplash URLs from `unsplash-images.ts`.
 * Local files under `public/landing/` are retained but unused.
 */
export const defaultLandingImages = {
  hero: unsplashImages.hero,
  map: unsplashImages.mapFeature,
  pins: unsplashImages.pinsFeature,
  maps: unsplashImages.mapsFeature,
  plugins: unsplashImages.pluginsFeature,
} as const;
