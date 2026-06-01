import {
  Baby,
  Binoculars,
  CalendarDays,
  Camera,
  Compass,
  MapPin,
  Mountain,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type LandingAudience = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  campaignPath?: string;
};

export const landingAudiences: LandingAudience[] = [
  {
    id: "travel",
    title: "Travel blogs",
    description:
      "Turn every stop into a pin and publish your route as a map-backed blog your readers can explore.",
    icon: Camera,
    campaignPath: "/for/travel",
  },
  {
    id: "food",
    title: "Food bloggers",
    description:
      "Map restaurants, markets, and tasting notes — link menus, photos, and playlists to each pin.",
    icon: UtensilsCrossed,
    campaignPath: "/for/food",
  },
  {
    id: "geocaching",
    title: "Geocaching groups",
    description:
      "Share finds, mystery caches, and event locations on a collaborative map the whole crew can update.",
    icon: Compass,
    campaignPath: "/for/geocaching",
  },
  {
    id: "families",
    title: "Parents & caregivers",
    description:
      "Collect playgrounds, splash pads, and stroller-friendly paths — private for your family or public for the neighborhood.",
    icon: Baby,
    campaignPath: "/for/families",
  },
  {
    id: "hiking",
    title: "Hikers & outdoor clubs",
    description:
      "Trailheads, campsites, and conditions — organize chapters in separate maps and export calendars for meetups.",
    icon: Mountain,
    campaignPath: "/for/hiking",
  },
  {
    id: "vanlife",
    title: "Van life & road trips",
    description:
      "Overnights, dump stations, and scenic pulls — one rolling map that grows with every mile.",
    icon: MapPin,
    campaignPath: "/for/vanlife",
  },
  {
    id: "heritage",
    title: "Local history walks",
    description:
      "Heritage plaques, architecture, and guided tours — publish a walking map blog for visitors.",
    icon: Binoculars,
    campaignPath: "/for/heritage",
  },
  {
    id: "events",
    title: "Festivals & meetups",
    description:
      "Stages, vendors, and volunteer zones — sync pin dates to calendar feeds so schedules stay current.",
    icon: CalendarDays,
    campaignPath: "/for/events",
  },
];
