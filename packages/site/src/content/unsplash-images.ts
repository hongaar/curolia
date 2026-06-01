/** Unsplash photo credit (required when hotlinking). */
export type UnsplashCredit = {
  name: string;
  username: string;
};

export type UnsplashImage = {
  src: string;
  alt: string;
  credit: UnsplashCredit;
};

function unsplash(
  photoId: string,
  alt: string,
  credit: UnsplashCredit,
  width = 1600,
): UnsplashImage {
  return {
    src: `https://images.unsplash.com/${photoId}?w=${width}&q=80&auto=format&fit=crop`,
    alt,
    credit,
  };
}

/** Marketing photography via Unsplash. Local files under `public/landing/` are kept but unused. */
export const unsplashImages = {
  hero: unsplash(
    "photo-1524661135-423995f22d0b",
    "Topographic map spread on a wooden table",
    { name: "Luigi Pozzoli", username: "luigipozz" },
  ),
  mapFeature: unsplash(
    "photo-1472214103451-9374bd1c798e",
    "Sunset over a calm lake with mountains",
    { name: "Tim Foster", username: "timberfoster" },
  ),
  pinsFeature: unsplash(
    "photo-1441974231531-c6227db76b6e",
    "Sunlight through trees on a forest trail",
    { name: "Noah Buscher", username: "hhhhhno" },
  ),
  mapsFeature: unsplash(
    "photo-1506905925346-21bda4d32df4",
    "Snow-capped mountain peaks above clouds",
    { name: "Marc Zimmer", username: "marcdzimmer" },
  ),
  pluginsFeature: unsplash(
    "photo-1514525253161-7a46d19cd819",
    "Concert crowd with stage lights",
    { name: "Aditya Chinchure", username: "adityachinchure" },
  ),
  nativeHero: unsplash(
    "photo-1469474968028-56623f02e42e",
    "Sunlit mountain valley with pine forest",
    { name: "Luca Bravo", username: "lucabravo" },
    1200,
  ),
  travel: unsplash(
    "photo-1488646953014-85cb44e25828",
    "Traveler looking at a paper map in a sunny plaza",
    { name: "Aswin C", username: "aswin_cp" },
  ),
  food: unsplash(
    "photo-1414235077428-338989a2e8c0",
    "Gourmet dish on a restaurant table",
    { name: "Eaters Collective", username: "eaterscollective" },
  ),
  geocaching: unsplash(
    "photo-1500530855697-b586d89ba3ee",
    "Person walking on a trail through green hills",
    { name: "Dino Reichmuth", username: "dinoreichmuth" },
  ),
  families: unsplash(
    "photo-1516627145497-ae6968895b74",
    "Children playing outdoors",
    { name: "Tanaphong Toochinda", username: "bo1920" },
  ),
  hiking: unsplash(
    "photo-1609521263047-f8f205293f24",
    "Hiker on a mountain trail above clouds",
    { name: "Kyle Glenn", username: "kylejglenn" },
  ),
  vanlife: unsplash(
    "photo-1504280390367-361c6d9f38f4",
    "Camping tent under a starry night sky",
    { name: "Josh Eckworth", username: "eckworth" },
  ),
  heritage: unsplash(
    "photo-1548013146-72479768bada",
    "Traditional pagoda architecture at dusk",
    { name: "Victor He", username: "victorhe" },
  ),
  events: unsplash(
    "photo-1492684223066-81342ee5ff30",
    "Outdoor festival with lights and crowd",
    { name: "Sebastiaan Stam", username: "sebastiaanstam" },
  ),
} as const;

export function unsplashProfileUrl({ username }: UnsplashCredit): string {
  return `https://unsplash.com/@${username}`;
}
