import {
  Building2,
  Globe2,
  Home,
  Landmark,
  Map,
  MapPin,
  Mountain,
  Road,
  Trees,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

const PLACE_CATEGORY_ICON: Record<string, LucideIcon> = {
  country: Globe2,
  continent: Globe2,
  province: Map,
  region: Map,
  county: Map,
  state: Map,
  city: Building2,
  town: Building2,
  village: Home,
  hamlet: Home,
  suburb: MapPin,
  neighbourhood: MapPin,
  neighborhood: MapPin,
  locality: MapPin,
  municipality: Building2,
  borough: MapPin,
  quarter: MapPin,
  district: MapPin,
  island: Waves,
  archipelago: Waves,
  postcode: MapPin,
  water: Waves,
  bay: Waves,
  beach: Waves,
  coastline: Waves,
  peak: Mountain,
  volcano: Mountain,
  woodland: Trees,
  park: Trees,
  landmark: Landmark,
  museum: Landmark,
  viewpoint: Mountain,
  "historic site": Landmark,
  building: Building2,
  street: Road,
  address: Road,
  place: MapPin,
};

function iconForCategory(categoryLabel?: string): LucideIcon {
  const key = categoryLabel?.trim().toLowerCase();
  if (!key) return MapPin;
  return PLACE_CATEGORY_ICON[key] ?? MapPin;
}

/** Lucide icon for a forward-search place row trailing slot. */
export function placeCategorySearchIcon(categoryLabel?: string): ReactNode {
  const Icon = iconForCategory(categoryLabel);
  return <Icon aria-hidden />;
}
