import type {
  PolarstepsApiMedia,
  PolarstepsApiStep,
  PolarstepsApiTrip,
} from "./polarsteps-api.ts";
import { tripSteps } from "./polarsteps-api.ts";

export type ParsedPolarstepsPhoto = {
  mediaId: string;
  uuid: string;
  url: string;
  width?: number;
  height?: number;
  sortOrder: number;
};

export type ParsedPolarstepsStep = {
  stepId: string;
  dedupKey: string;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  date: string | null;
  endDate: string | null;
  polarstepsUrl: string | null;
  photos: ParsedPolarstepsPhoto[];
};

export type ParsedPolarstepsTrip = {
  tripId: string;
  title: string;
  stepCount: number;
  photoCount: number;
  startDate?: string;
  endDate?: string;
  steps: ParsedPolarstepsStep[];
};

const CDN_BASES = [
  "https://d34v3m9hy689sj.cloudfront.net",
  "https://d1inuxlt37relk.cloudfront.net",
];

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toUnixSeconds(
  value: number | string | null | undefined,
): number | null {
  if (value == null) return null;
  if (typeof value === "number") return value;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed / 1000 : null;
}

export function unixToDateString(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const d = new Date(seconds * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function resolveMediaUrl(media: PolarstepsApiMedia): string | null {
  const candidates = [
    media.cdn_path,
    media.path,
    media.large_thumbnail_path,
    media.small_thumbnail_path,
  ];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
      return candidate;
    }
    const path = candidate.startsWith("/") ? candidate : `/${candidate}`;
    for (const base of CDN_BASES) {
      return `${base}${path}`;
    }
  }
  return null;
}

function isPhotoMedia(media: PolarstepsApiMedia): boolean {
  if (media.is_deleted) return false;
  // Polarsteps media type: 1 = photo, 2 = video (skip videos for now).
  if (media.type === 2) return false;
  return true;
}

function stepTitle(step: PolarstepsApiStep): string {
  const name = (step.display_name ?? step.name ?? "").trim();
  if (name) return name;
  const locality = step.location?.locality?.trim();
  if (locality) return locality;
  const locName = step.location?.name?.trim();
  if (locName) return locName;
  return "Polarsteps step";
}

function buildStepUrl(
  trip: PolarstepsApiTrip,
  step: PolarstepsApiStep,
  shareUrl?: string,
): string | null {
  if (!shareUrl) return null;
  try {
    const url = new URL(shareUrl);
    const slug = step.display_slug ?? step.slug;
    if (slug) {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/${step.id}-${slug}`;
      return url.toString();
    }
    return shareUrl;
  } catch {
    return shareUrl ?? null;
  }
}

export function parseTrip(
  trip: PolarstepsApiTrip,
  shareUrl?: string,
): ParsedPolarstepsTrip {
  const tripId = String(trip.id);
  const title = (trip.display_name ?? trip.name ?? `Trip ${tripId}`).trim();
  const steps = tripSteps(trip)
    .map((step) => parseStep(trip, step, tripId, shareUrl))
    .filter((s): s is ParsedPolarstepsStep => s != null);

  const photoCount = steps.reduce((n, s) => n + s.photos.length, 0);

  return {
    tripId,
    title,
    stepCount: steps.length,
    photoCount,
    startDate: unixToDateString(toUnixSeconds(trip.start_date)) ?? undefined,
    endDate: unixToDateString(toUnixSeconds(trip.end_date)) ?? undefined,
    steps,
  };
}

function parseStep(
  trip: PolarstepsApiTrip,
  step: PolarstepsApiStep,
  tripId: string,
  shareUrl?: string,
): ParsedPolarstepsStep | null {
  const lat = step.location?.lat;
  const lng = step.location?.lon;
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  const startSec = toUnixSeconds(step.start_time);
  const endSec = toUnixSeconds(step.end_time);
  const date = unixToDateString(startSec);
  let endDate = unixToDateString(endSec);
  if (endDate && date && endDate < date) endDate = null;

  const rawDesc = step.description?.trim();
  const description = rawDesc ? stripHtml(rawDesc) : null;

  const media = [...(step.media ?? [])]
    .filter(isPhotoMedia)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const photos: ParsedPolarstepsPhoto[] = [];
  for (let i = 0; i < media.length; i++) {
    const item = media[i]!;
    const url = resolveMediaUrl(item);
    if (!url) continue;
    photos.push({
      mediaId: String(item.id),
      uuid: item.uuid,
      url,
      width:
        typeof item.full_res_width === "number"
          ? Math.round(item.full_res_width)
          : undefined,
      height:
        typeof item.full_res_height === "number"
          ? Math.round(item.full_res_height)
          : undefined,
      sortOrder: item.order ?? i,
    });
  }

  const stepId = String(step.id);

  return {
    stepId,
    dedupKey: `polarsteps:step:${tripId}:${stepId}`,
    title: stepTitle(step),
    description,
    lat,
    lng,
    date,
    endDate,
    polarstepsUrl: buildStepUrl(trip, step, shareUrl),
    photos,
  };
}

export function tripPreviewFromParsed(
  parsed: ParsedPolarstepsTrip,
  shareUrl: string,
): {
  tripId: string;
  shareUrl: string;
  title: string;
  stepCount: number;
  photoCount: number;
  startDate?: string;
  endDate?: string;
  addedAt: string;
} {
  return {
    tripId: parsed.tripId,
    shareUrl,
    title: parsed.title,
    stepCount: parsed.stepCount,
    photoCount: parsed.photoCount,
    startDate: parsed.startDate,
    endDate: parsed.endDate,
    addedAt: new Date().toISOString(),
  };
}
