import type { UnsplashImage } from "./unsplash-images";
import { unsplashImages } from "./unsplash-images";

export type CampaignTheme = {
  id: string;
  path: string;
  /** CSS custom property `--campaign-accent` (oklch hue) */
  accentHue: number;
  eyebrow: string;
  title: string;
  lead: string;
  heroImage: UnsplashImage;
  bullets: string[];
  ctaLabel: string;
  /** Optional second accent for gradients */
  accentHueSecondary?: number;
};

export const campaigns: CampaignTheme[] = [
  {
    id: "travel",
    path: "/for/travel",
    accentHue: 45,
    eyebrow: "For travel bloggers",
    title: "Turn your trips into a map readers can explore",
    lead: "Drop a pin for every city, café, and viewpoint. Publish the map as a blog — or keep drafts private until you are ready to share.",
    heroImage: unsplashImages.travel,
    bullets: [
      "Chronological pin lists with photos and notes",
      "Public map blogs or private planning maps",
      "Calendar feeds for trip dates and events",
      "Google Photos import for on-the-road shots",
    ],
    ctaLabel: "Start your travel map",
  },
  {
    id: "food",
    path: "/for/food",
    accentHue: 25,
    accentHueSecondary: 55,
    eyebrow: "For food bloggers",
    title: "Map every bite, from street food to fine dining",
    lead: "Tag cuisines, link menus, and attach playlists or listening history to the nights that matter. Your readers browse by neighborhood, not just by date.",
    heroImage: unsplashImages.food,
    bullets: [
      "Pins with tags, links, and rich notes",
      "Last.fm or Spotify plugins for atmosphere",
      "Separate maps per city or food tour",
      "Share publicly or keep a personal hit list",
    ],
    ctaLabel: "Map your food finds",
  },
  {
    id: "geocaching",
    path: "/for/geocaching",
    accentHue: 145,
    eyebrow: "For geocaching groups",
    title: "One map for finds, events, and mystery caches",
    lead: "Collaborate on a shared map — members add pins, photos, and logs. Export pin dates to calendar feeds for event nights and CITO meetups.",
    heroImage: unsplashImages.geocaching,
    bullets: [
      "Collaborative maps with role-based sharing",
      "Pin photos and field notes at each coordinate",
      "iCalendar subscription for scheduled events",
      "Private club maps or public showcase maps",
    ],
    ctaLabel: "Create a group map",
  },
  {
    id: "families",
    path: "/for/families",
    accentHue: 310,
    accentHueSecondary: 200,
    eyebrow: "For parents & caregivers",
    title: "Collect playgrounds, paths, and kid-friendly stops",
    lead: "Build a trusted map of places your family loves — stroller access, shade, restrooms, and age ranges in each pin. Share with friends or keep it just for you.",
    heroImage: unsplashImages.families,
    bullets: [
      "Private maps for your household",
      "Tags for age range, shade, and facilities",
      "Photos so you remember which entrance to use",
      "Publish a neighborhood guide when you are ready",
    ],
    ctaLabel: "Start a family map",
  },
  {
    id: "hiking",
    path: "/for/hiking",
    accentHue: 155,
    eyebrow: "For hikers & outdoor clubs",
    title: "Trailheads, camps, and conditions on one map",
    lead: "Chapter maps for local clubs, personal peak lists, or public trail guides. Pin elevation notes, water sources, and meetup points — sync dates to calendars.",
    heroImage: unsplashImages.hiking,
    bullets: [
      "Multiple maps per region or difficulty",
      "Pin dates for meetups and permit windows",
      "Strava integration coming soon for routes",
      "Open-source friendly — self-host if you prefer",
    ],
    ctaLabel: "Map your trails",
  },
  {
    id: "vanlife",
    path: "/for/vanlife",
    accentHue: 220,
    accentHueSecondary: 35,
    eyebrow: "For van life & road trips",
    title: "Your rolling atlas of sleeps, dumps, and views",
    lead: "Every overnight, scenic pull-off, and repair shop becomes a pin. Keep the map private on the road, then publish a blog of the route when the trip is done.",
    heroImage: unsplashImages.vanlife,
    bullets: [
      "Offline-friendly native app for on-the-go",
      "Tags for hookups, cell signal, and noise",
      "Separate maps per season or vehicle",
      "Blog publish when you are ready to share",
    ],
    ctaLabel: "Start your road map",
  },
  {
    id: "heritage",
    path: "/for/heritage",
    accentHue: 265,
    accentHueSecondary: 45,
    eyebrow: "For local history & heritage walks",
    title: "Guide visitors through the stories in your streets",
    lead: "Plaques, buildings, and hidden details become pins on a walking map. Publish a public blog for tourists or keep research maps private while you build the route.",
    heroImage: unsplashImages.heritage,
    bullets: [
      "Pins for landmarks, dates, and archival photos",
      "Tags for eras, themes, and walking loops",
      "Public map blogs for visitor self-guided tours",
      "Calendar feeds for guided walk dates and talks",
    ],
    ctaLabel: "Start a heritage map",
  },
  {
    id: "events",
    path: "/for/events",
    accentHue: 295,
    accentHueSecondary: 25,
    eyebrow: "For festivals & meetups",
    title: "Map the venue before the gates open",
    lead: "Stages, vendors, first aid, and volunteer zones — pin it all once and share a map link. Pin dates sync to calendar feeds so schedules stay current as plans change.",
    heroImage: unsplashImages.events,
    bullets: [
      "One map for attendees and crew",
      "Pin dates for set times and volunteer shifts",
      "iCalendar subscription for schedule updates",
      "Public map or private ops map for organizers",
    ],
    ctaLabel: "Plan your event map",
  },
];

export function campaignById(id: string): CampaignTheme | undefined {
  return campaigns.find((c) => c.id === id);
}
