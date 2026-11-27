import {
  clearPinPhotoUrlCache,
  PIN_PHOTO_URL_TTL_SECONDS,
  signPinPhotoPaths,
} from "@curolia/plugin-contract";
import type { SupabaseClient } from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const STORAGE_KEY = "curolia:pin-photo-urls:v1";

function fakeClient() {
  let counter = 0;
  const createSignedUrls = vi.fn(async (...[paths]: [string[], number]) => {
    counter += 1;
    return {
      data: paths.map((path) => ({
        path,
        signedUrl: `https://cdn.test/${path}?token=t${counter}`,
        error: null,
      })),
      error: null,
    };
  });
  const client = {
    storage: { from: () => ({ createSignedUrls }) },
  } as unknown as SupabaseClient;
  return { client, createSignedUrls };
}

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

describe("signPinPhotoPaths", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
    clearPinPhotoUrlCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-27T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("signs with a long TTL and reuses the same URL on later calls", async () => {
    const { client, createSignedUrls } = fakeClient();

    const first = await signPinPhotoPaths(client, ["a.jpg", "b.jpg"]);
    const second = await signPinPhotoPaths(client, ["a.jpg", "b.jpg"]);

    expect(second).toEqual(first);
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
    expect(createSignedUrls).toHaveBeenCalledWith(
      ["a.jpg", "b.jpg"],
      PIN_PHOTO_URL_TTL_SECONDS,
    );
  });

  it("only signs paths that are not cached yet", async () => {
    const { client, createSignedUrls } = fakeClient();

    await signPinPhotoPaths(client, ["a.jpg"]);
    await signPinPhotoPaths(client, ["a.jpg", "b.jpg"]);

    expect(createSignedUrls).toHaveBeenLastCalledWith(
      ["b.jpg"],
      PIN_PHOTO_URL_TTL_SECONDS,
    );
  });

  it("shares in-flight signing between concurrent callers", async () => {
    const { client, createSignedUrls } = fakeClient();

    const [one, two] = await Promise.all([
      signPinPhotoPaths(client, ["a.jpg"]),
      signPinPhotoPaths(client, ["a.jpg"]),
    ]);

    expect(one).toEqual(two);
    expect(createSignedUrls).toHaveBeenCalledTimes(1);
  });

  it("reuses URLs persisted by a previous page load", async () => {
    const { client } = fakeClient();
    const first = await signPinPhotoPaths(client, ["a.jpg"]);
    expect(localStorage.getItem(STORAGE_KEY)).toContain("a.jpg");

    // Simulate a reload: drop in-memory state but keep localStorage.
    const persisted = localStorage.getItem(STORAGE_KEY)!;
    clearPinPhotoUrlCache();
    localStorage.setItem(STORAGE_KEY, persisted);
    vi.resetModules();
    const fresh = await import("@curolia/plugin-contract");
    const reloaded = fakeClient();

    const second = await fresh.signPinPhotoPaths(reloaded.client, ["a.jpg"]);
    expect(second).toEqual(first);
    expect(reloaded.createSignedUrls).not.toHaveBeenCalled();
  });

  it("re-signs once a URL is within a day of expiring", async () => {
    const { client, createSignedUrls } = fakeClient();
    const first = await signPinPhotoPaths(client, ["a.jpg"]);

    vi.advanceTimersByTime((PIN_PHOTO_URL_TTL_SECONDS - 23 * 3600) * 1000);
    const second = await signPinPhotoPaths(client, ["a.jpg"]);

    expect(second["a.jpg"]).not.toEqual(first["a.jpg"]);
    expect(createSignedUrls).toHaveBeenCalledTimes(2);
  });

  it("clears persisted URLs", async () => {
    const { client, createSignedUrls } = fakeClient();
    await signPinPhotoPaths(client, ["a.jpg"]);

    clearPinPhotoUrlCache();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    await signPinPhotoPaths(client, ["a.jpg"]);
    expect(createSignedUrls).toHaveBeenCalledTimes(2);
  });

  it("omits paths that fail to sign", async () => {
    const createSignedUrls = vi.fn(async (paths: string[]) => ({
      data: paths.map((path) => ({
        path,
        signedUrl: path === "ok.jpg" ? "https://cdn.test/ok" : "",
        error: path === "ok.jpg" ? null : "not found",
      })),
      error: null,
    }));
    const client = {
      storage: { from: () => ({ createSignedUrls }) },
    } as unknown as SupabaseClient;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(await signPinPhotoPaths(client, ["ok.jpg", "gone.jpg"])).toEqual({
      "ok.jpg": "https://cdn.test/ok",
    });
    spy.mockRestore();
  });
});
