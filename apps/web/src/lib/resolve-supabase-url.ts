import { Capacitor } from "@capacitor/core";

/** Android emulators reach the host machine via 10.0.2.2, not 127.0.0.1 / localhost. */
export function resolveSupabaseUrl(
  raw: string,
  platform: string = Capacitor.getPlatform(),
): string {
  if (platform !== "android") return raw;

  try {
    const parsed = new URL(raw);
    if (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
      return raw;
    }
    parsed.hostname = "10.0.2.2";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return raw;
  }
}
