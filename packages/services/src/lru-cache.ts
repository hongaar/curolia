export type LruCacheOptions = {
  maxSize: number;
};

/** Simple LRU map — `get`/`set` bump entries to most-recently used. */
export class LruCache<K, V> {
  private readonly maxSize: number;
  private readonly map = new Map<K, V>();

  constructor(options: LruCacheOptions) {
    this.maxSize = Math.max(1, options.maxSize);
  }

  get size(): number {
    return this.map.size;
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      const oldest = this.map.keys().next().value as K | undefined;
      if (oldest !== undefined) this.map.delete(oldest);
    }
    this.map.set(key, value);
  }

  clear(): void {
    this.map.clear();
  }
}

/**
 * LRU cache with in-flight request coalescing — parallel callers for the same
 * key share one fetch and only the resolved value is retained.
 */
export class AsyncLruCache<K, V> {
  private readonly cache: LruCache<K, V>;
  private readonly inflight = new Map<K, Promise<V>>();

  constructor(options: LruCacheOptions) {
    this.cache = new LruCache(options);
  }

  get size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.inflight.clear();
  }

  async getOrFetch(key: K, fetch: () => Promise<V>): Promise<V> {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;

    const pending = this.inflight.get(key);
    if (pending) return pending;

    const promise = fetch()
      .then((value) => {
        this.cache.set(key, value);
        this.inflight.delete(key);
        return value;
      })
      .catch((err: unknown) => {
        this.inflight.delete(key);
        throw err;
      });

    this.inflight.set(key, promise);
    return promise;
  }
}
