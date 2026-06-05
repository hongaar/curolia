import type { ReactNode } from "react";

import {
  ApiAccessIcon,
  GoogleMapsIcon,
  GooglePhotosIcon,
  IcalIcon,
  LastfmIcon,
  OpenMeteoIcon,
  OsmPoiIcon,
  SpotifyIcon,
  StravaIcon,
  WikipediaIcon,
} from "../components/plugin-marketing-icons";

export type LandingPluginStatus = "available" | "coming-soon";

export type LandingPlugin = {
  id: string;
  name: string;
  description: string;
  status: LandingPluginStatus;
  icon: () => ReactNode;
};

export const landingPlugins: LandingPlugin[] = [
  {
    id: "google-photos",
    name: "Google Photos",
    description: "Import library shots onto pins",
    status: "available",
    icon: () => <GooglePhotosIcon size={6} />,
  },
  {
    id: "ical",
    name: "Calendar feeds",
    description: "Subscribe to pins as iCalendar (.ics)",
    status: "available",
    icon: () => <IcalIcon size={6} />,
  },
  {
    id: "lastfm",
    name: "Last.fm",
    description: "Listening history on pin dates",
    status: "available",
    icon: () => <LastfmIcon size={6} />,
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Attach tracks and playlists to pins",
    status: "available",
    icon: () => <SpotifyIcon size={6} />,
  },
  {
    id: "wikidata",
    name: "Wikipedia",
    description: "Nearby landmarks with summaries on pins",
    status: "available",
    icon: () => <WikipediaIcon size={6} />,
  },
  {
    id: "open-meteo",
    name: "Weather",
    description: "Current and historical weather on pins",
    status: "available",
    icon: () => <OpenMeteoIcon size={6} />,
  },
  {
    id: "osm-poi",
    name: "OpenStreetMap",
    description: "Nearby place tags—cafés, accessibility, campsites",
    status: "available",
    icon: () => <OsmPoiIcon size={6} />,
  },
  {
    id: "strava",
    name: "Strava",
    description: "Activities and routes on the map",
    status: "coming-soon",
    icon: () => <StravaIcon size={6} />,
  },
  {
    id: "google-maps",
    name: "Google Maps",
    description: "Import saved places and lists",
    status: "coming-soon",
    icon: () => <GoogleMapsIcon size={6} />,
  },
  {
    id: "api",
    name: "API access",
    description: "Access your data with our public API and SDK",
    status: "coming-soon",
    icon: () => <ApiAccessIcon size={6} />,
  },
];
