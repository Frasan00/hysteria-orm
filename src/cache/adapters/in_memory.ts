import { CacheAdapter } from "../cache_adapter";

const inMemoryCache = new Map<string, any>();

export class InMemoryAdapter implements CacheAdapter {
  async get<T = void>(key: string): Promise<T> {
    return inMemoryCache.get(key);
  }

  async set<T = any>(key: string, data: T, ttl?: number): Promise<void> {
    inMemoryCache.set(key, data);
    if (ttl) {
      setTimeout(() => {
        inMemoryCache.delete(key);
      }, ttl);
    }
  }

  async invalidate(key: string): Promise<void> {
    inMemoryCache.delete(key);
  }

  async invalidateAll(key: string): Promise<void> {
    const keys = inMemoryCache.keys();
    for (const cacheKey of keys) {
      if (cacheKey.startsWith(key)) {
        inMemoryCache.delete(cacheKey);
      }
    }
  }
}
