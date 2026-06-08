import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const raw = hex.trim().replace(/^#/, "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  if (full.length !== 6 || !/^[0-9a-f]+$/i.test(full)) return null;
  const n = Number.parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Readable foreground for text/icons on a user tag hex background (#rgb / #rrggbb). */
export function contrastingForeground(hex: string): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return "oklch(0.15 0.02 260)";
  const l = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return l > 0.62 ? "oklch(0.15 0.02 260)" : "oklch(0.98 0.01 260)";
}

/** Opaque pastel fill — lightens and desaturates a tag hex for dimmed map markers. */
export function dimmedMapMarkerFill(hex: string): string {
  const rgb = parseHexRgb(hex);
  if (!rgb) return hex;
  const { r, g, b } = rgb;
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const desatMix = 0.38;
  const whiteMix = 0.55;
  let nr = r * (1 - desatMix) + gray * desatMix;
  let ng = g * (1 - desatMix) + gray * desatMix;
  let nb = b * (1 - desatMix) + gray * desatMix;
  nr = nr * (1 - whiteMix) + 255 * whiteMix;
  ng = ng * (1 - whiteMix) + 255 * whiteMix;
  nb = nb * (1 - whiteMix) + 255 * whiteMix;
  return rgbToHex(nr, ng, nb);
}
