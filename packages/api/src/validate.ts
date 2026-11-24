import { badRequest } from "./http.ts";

type Body = Record<string, unknown>;

export function rejectUnknownKeys(
  body: Body,
  allowed: readonly string[],
): void {
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  if (unknown.length)
    throw badRequest(`Unknown field(s): ${unknown.join(", ")}`);
}

export function optString(
  body: Body,
  key: string,
  { max = 10_000, nullable = true, min = 0 } = {},
): string | null | undefined {
  if (!(key in body)) return undefined;
  const v = body[key];
  if (v === null) {
    if (!nullable) throw badRequest(`${key} must not be null`);
    return null;
  }
  if (typeof v !== "string") throw badRequest(`${key} must be a string`);
  const t = v.trim();
  if (t.length < min || t.length > max) {
    throw badRequest(`${key} must be ${min}-${max} characters`);
  }
  return t;
}

export function optBoolean(body: Body, key: string): boolean | undefined {
  if (!(key in body)) return undefined;
  if (typeof body[key] !== "boolean")
    throw badRequest(`${key} must be a boolean`);
  return body[key] as boolean;
}

export function optEnum<T extends string>(
  body: Body,
  key: string,
  values: readonly T[],
): T | undefined {
  if (!(key in body)) return undefined;
  const v = body[key];
  if (typeof v !== "string" || !values.includes(v as T)) {
    throw badRequest(`${key} must be one of: ${values.join(", ")}`);
  }
  return v as T;
}

export function optNumber(
  body: Body,
  key: string,
  min: number,
  max: number,
): number | undefined {
  if (!(key in body)) return undefined;
  const v = body[key];
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max) {
    throw badRequest(`${key} must be a number between ${min} and ${max}`);
  }
  return v;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function optDate(body: Body, key: string): string | null | undefined {
  if (!(key in body)) return undefined;
  const v = body[key];
  if (v === null) return null;
  if (
    typeof v !== "string" ||
    !DATE_RE.test(v) ||
    Number.isNaN(Date.parse(v))
  ) {
    throw badRequest(`${key} must be a date (YYYY-MM-DD) or null`);
  }
  return v;
}

/** Drops `undefined` values so only provided fields are written. */
export function defined<T extends Record<string, unknown>>(o: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}
