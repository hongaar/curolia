import { DEFAULT_PIN_TAG_COLOR } from "@/lib/preset-pin-tag-colors";

type Rgb = { r: number; g: number; b: number };

export type RouteLineGradientOptions = {
  /** Satellite or auto map style in dark theme. */
  darkBasemap?: boolean;
};

export function pinRouteColor(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed || DEFAULT_PIN_TAG_COLOR;
}

export function routeColorsEqual(a: string, b: string): boolean {
  return pinRouteColor(a).toLowerCase() === pinRouteColor(b).toLowerCase();
}

function parseHexColor(hex: string): Rgb | null {
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length === 3) {
    return {
      r: Number.parseInt(raw[0]! + raw[0], 16),
      g: Number.parseInt(raw[1]! + raw[1], 16),
      b: Number.parseInt(raw[2]! + raw[2], 16),
    };
  }
  if (raw.length === 6) {
    return {
      r: Number.parseInt(raw.slice(0, 2), 16),
      g: Number.parseInt(raw.slice(2, 4), 16),
      b: Number.parseInt(raw.slice(4, 6), 16),
    };
  }
  return null;
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function rgbaFromHex(hex: string, alpha: number): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return `rgba(45, 106, 93, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function mixHex(a: string, b: string, t: number): string {
  const left = parseHexColor(a);
  const right = parseHexColor(b);
  if (!left || !right) return a;
  const mix = (x: number, y: number) => clampByte(x + (y - x) * t);
  const r = mix(left.r, right.r);
  const g = mix(left.g, right.g);
  const blue = mix(left.b, right.b);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${blue.toString(16).padStart(2, "0")}`;
}

function lightenHex(hex: string, amount: number): string {
  return mixHex(hex, "#ffffff", amount);
}

function darkenHex(hex: string, amount: number): string {
  return mixHex(hex, "#000000", amount);
}

function routeTone(
  hex: string,
  { darkBasemap = false }: RouteLineGradientOptions,
): string {
  return darkBasemap ? lightenHex(hex, 0.3) : hex;
}

function routeAlpha(
  alpha: number,
  { darkBasemap = false }: RouteLineGradientOptions,
): number {
  return darkBasemap ? Math.min(1, alpha + 0.16) : alpha;
}

/** MapLibre requires strictly ascending line-progress stops. */
function lineProgressGradient(stops: Array<[number, string]>): unknown[] {
  const sorted = [...stops].sort((a, b) => a[0] - b[0]);
  const deduped: Array<[number, string]> = [];
  for (const stop of sorted) {
    const position = Math.max(0, Math.min(1, stop[0]));
    const last = deduped[deduped.length - 1];
    if (last && last[0] === position) {
      deduped[deduped.length - 1] = [position, stop[1]];
    } else {
      deduped.push([position, stop[1]]);
    }
  }
  return ["interpolate", ["linear"], ["line-progress"], ...deduped.flat()];
}

/** Subtle static gradient along a segment (duotone or monotone). */
export function staticRouteLineGradient(
  from: string,
  to: string,
  options: RouteLineGradientOptions = {},
): unknown[] {
  const start = routeTone(pinRouteColor(from), options);
  const end = routeTone(pinRouteColor(to), options);
  const alpha = (value: number) => routeAlpha(value, options);

  if (routeColorsEqual(start, end)) {
    const edgeLighten = options.darkBasemap ? 0.28 : 0.14;
    const edgeDarken = options.darkBasemap ? 0.02 : 0.1;
    return lineProgressGradient([
      [0, rgbaFromHex(lightenHex(start, edgeLighten), alpha(0.5))],
      [0.5, rgbaFromHex(start, alpha(0.78))],
      [1, rgbaFromHex(darkenHex(start, edgeDarken), alpha(0.5))],
    ]);
  }

  return lineProgressGradient([
    [0, rgbaFromHex(start, alpha(0.72))],
    [1, rgbaFromHex(end, alpha(0.72))],
  ]);
}

/** Moving highlight along selected segments. */
export function animatedRouteLineGradient(
  from: string,
  to: string,
  phase: number,
  options: RouteLineGradientOptions = {},
): unknown[] {
  const start = routeTone(pinRouteColor(from), options);
  const end = routeTone(pinRouteColor(to), options);
  const alpha = (value: number) => routeAlpha(value, options);
  const p = ((phase % 1) + 1) % 1;
  const spread = 0.22;
  const beforePos = p - spread;
  const afterPos = p + spread;

  if (routeColorsEqual(start, end)) {
    const base = start;
    const peak = lightenHex(base, options.darkBasemap ? 0.58 : 0.5);
    const stops: Array<[number, string]> = [
      [
        0,
        rgbaFromHex(
          lightenHex(base, options.darkBasemap ? 0.2 : 0.1),
          alpha(0.82),
        ),
      ],
      [
        1,
        rgbaFromHex(
          darkenHex(base, options.darkBasemap ? 0 : 0.06),
          alpha(0.82),
        ),
      ],
      [p, rgbaFromHex(peak, 1)],
    ];
    if (beforePos > 0.001) {
      stops.push([beforePos, rgbaFromHex(base, alpha(0.92))]);
    }
    if (afterPos < 0.999) {
      stops.push([afterPos, rgbaFromHex(base, alpha(0.92))]);
    }
    return lineProgressGradient(stops);
  }

  const at = mixHex(start, end, p);
  const peak = lightenHex(at, options.darkBasemap ? 0.46 : 0.38);
  const stops: Array<[number, string]> = [
    [0, rgbaFromHex(start, alpha(0.8))],
    [1, rgbaFromHex(end, alpha(0.8))],
    [p, rgbaFromHex(peak, 1)],
  ];
  if (beforePos > 0.001) {
    stops.push([
      beforePos,
      rgbaFromHex(mixHex(start, end, beforePos), alpha(0.94)),
    ]);
  }
  if (afterPos < 0.999) {
    stops.push([
      afterPos,
      rgbaFromHex(mixHex(start, end, afterPos), alpha(0.94)),
    ]);
  }
  return lineProgressGradient(stops);
}
