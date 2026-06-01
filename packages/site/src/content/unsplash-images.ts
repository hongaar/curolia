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
    "photo-1488646953014-85cb44e25828",
    "Traveler with a map in a sunlit plaza, planning the next stop",
    { name: "Aswin C", username: "aswin_cp" },
    1800,
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
    "photo-1519681393784-d120267933ba",
    "Mountain ridge under a starry night sky",
    { name: "Billy Huynh", username: "billyhuynh" },
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
    "photo-1613794713137-a78aba4be84a",
    "Child playing on a sandy playground in a city park",
    { name: "Fabian Centeno", username: "real_chance12" },
  ),
  hiking: unsplash(
    "photo-1510312305653-8ed496efae75",
    "Dome tent on a mountain top with the sun behind",
    { name: "Kevin Ianeselli", username: "kevinianeselli" },
  ),
  vanlife: unsplash(
    "photo-1469854523086-cc02fe5d8800",
    "Yellow Volkswagen van on the road",
    { name: "Dino Reichmuth", username: "dinoreichmuth" },
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
