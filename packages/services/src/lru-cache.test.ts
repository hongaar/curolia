import { describe, expect, it } from "vitest";
import { AsyncLruCache, LruCache } from "./lru-cache.ts";

describe("LruCache", () => {
  it("evicts the least recently used entry", () => {
    const cache = new LruCache<string, number>({ maxSize: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);

    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(1);
    expect(cache.get("c")).toBe(3);
  });
});

describe("AsyncLruCache", () => {
  it("coalesces parallel fetches for the same key", async () => {
    const cache = new AsyncLruCache<string, number>({ maxSize: 8 });
    let calls = 0;
    const fetch = () => {
      calls += 1;
      return Promise.resolve(42);
    };

    const [a, b] = await Promise.all([
      cache.getOrFetch("x", fetch),
      cache.getOrFetch("x", fetch),
    ]);

    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(calls).toBe(1);
  });

  it("returns cached values without refetching", async () => {
    const cache = new AsyncLruCache<string, number>({ maxSize: 8 });
    let calls = 0;
    const fetch = () => {
      calls += 1;
      return Promise.resolve(7);
    };

    await cache.getOrFetch("x", fetch);
    await cache.getOrFetch("x", fetch);

    expect(calls).toBe(1);
  });

  it("caches null results", async () => {
    const cache = new AsyncLruCache<string, string | null>({ maxSize: 8 });
    let calls = 0;
    const fetch = () => {
      calls += 1;
      return Promise.resolve(null);
    };

    expect(await cache.getOrFetch("miss", fetch)).toBeNull();
    expect(await cache.getOrFetch("miss", fetch)).toBeNull();
    expect(calls).toBe(1);
  });

  it("does not cache failed fetches", async () => {
    const cache = new AsyncLruCache<string, number>({ maxSize: 8 });
    let calls = 0;
    const fetch = () => {
      calls += 1;
      return Promise.reject(new Error("fail"));
    };

    await expect(cache.getOrFetch("x", fetch)).rejects.toThrow("fail");
    await expect(cache.getOrFetch("x", fetch)).rejects.toThrow("fail");
    expect(calls).toBe(2);
  });
});
