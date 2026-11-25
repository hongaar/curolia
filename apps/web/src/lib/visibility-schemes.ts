import {
  PROFILE_VISIBILITY_LABELS,
  PROFILE_VISIBILITY_OPTIONS,
  VISIBILITY_LABELS,
  VISIBILITY_OPTIONS,
  type ProfileVisibility,
  type Visibility,
} from "@/lib/visibility";
import { Globe, Link, Lock, UserCheck, type LucideIcon } from "lucide-react";

type IconComponent = LucideIcon;

export type VisibilityScheme<T extends string> = {
  options: readonly T[];
  labels: Record<T, string>;
  icons: Record<T, IconComponent>;
};

export const MAP_VISIBILITY_SCHEME: VisibilityScheme<Visibility> = {
  options: VISIBILITY_OPTIONS,
  labels: VISIBILITY_LABELS,
  icons: { public: Globe, unlisted: Link, private: Lock },
};

export const PROFILE_VISIBILITY_SCHEME: VisibilityScheme<ProfileVisibility> = {
  options: PROFILE_VISIBILITY_OPTIONS,
  labels: PROFILE_VISIBILITY_LABELS,
  icons: { public: Globe, restricted: UserCheck, private: Lock },
};
