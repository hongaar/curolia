const SAMPLE_SIZE = 8;

type Rgb = { r: number; g: number; b: number };

/** Average opaque pixels from canvas image data. */
export function averageOpaqueRgb(data: Uint8ClampedArray): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3]! < 16) continue;
    r += data[i]!;
    g += data[i + 1]!;
    b += data[i + 2]!;
    count += 1;
  }

  if (count === 0) return { r: 120, g: 120, b: 130 };
  return { r: r / count, g: g / count, b: b / count };
}

/** Convert sRGB channel to linear light for HSL math. */
function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [h: number, s: number, l: number] {
  const rl = channelToLinear(r);
  const gl = channelToLinear(g);
  const bl = channelToLinear(b);

  const max = Math.max(rl, gl, bl);
  const min = Math.min(rl, gl, bl);
  const lightness = (max + min) / 2;

  if (max === min) return [0, 0, lightness];

  const delta = max - min;
  const saturation =
    lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

  let hue = 0;
  if (max === rl) hue = ((gl - bl) / delta + (gl < bl ? 6 : 0)) / 6;
  else if (max === gl) hue = ((bl - rl) / delta + 2) / 6;
  else hue = ((rl - gl) / delta + 4) / 6;

  return [hue * 360, saturation, lightness];
}

/** Turn an averaged cover sample into a badge-friendly accent fill. */
export function rgbToAccentCss(r: number, g: number, b: number): string {
  const [hue, saturation, lightness] = rgbToHsl(r, g, b);

  if (saturation < 0.08) {
    return `oklch(0.55 0.04 ${Math.round(hue)})`;
  }

  const accentSaturation = Math.min(0.55, Math.max(0.38, saturation * 1.35));
  const accentLightness = Math.min(0.64, Math.max(0.5, lightness * 0.92));

  return `hsl(${Math.round(hue)} ${Math.round(accentSaturation * 100)}% ${Math.round(accentLightness * 100)}%)`;
}

/**
 * Sample the bottom-left cover region (where the inset icon sits) on a tiny
 * canvas. Returns null when the image is unreadable (e.g. cross-origin without
 * CORS) so callers can fall back to a deterministic color.
 */
export function sampleCoverAccentFromImage(
  image: HTMLImageElement,
): string | null {
  const { naturalWidth, naturalHeight } = image;
  if (naturalWidth <= 0 || naturalHeight <= 0) return null;

  const canvas = document.createElement("canvas");
  canvas.width = SAMPLE_SIZE;
  canvas.height = SAMPLE_SIZE;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  const sourceX = 0;
  const sourceY = naturalHeight * 0.68;
  const sourceWidth = naturalWidth * 0.38;
  const sourceHeight = naturalHeight * 0.32;

  try {
    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      SAMPLE_SIZE,
      SAMPLE_SIZE,
    );
    const { data } = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const { r, g, b } = averageOpaqueRgb(data);
    return rgbToAccentCss(r, g, b);
  } catch {
    return null;
  }
}
