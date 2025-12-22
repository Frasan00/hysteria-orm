import { CacheAdapter } from "../cache_adapter";

const inMemoryCache = new Map<string, any>();
const timers = new Map<string, NodeJS.Timeout>();

export class InMemoryAdapter implements CacheAdapter {
  async get<T = void>(key: string): Promise<T> {
    return inMemoryCache.get(key);
  }

  async set<T = any>(key: string, data: T, ttl?: number): Promise<void> {
    const existingTimer = timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timers.delete(key);
    }

    inMemoryCache.set(key, data);
    if (ttl) {
      const timer = setTimeout(() => {
        inMemoryCache.delete(key);
        timers.delete(key);
      }, ttl);
      timers.set(key, timer);
    }
  }

  async invalidate(key: string): Promise<void> {
    const existingTimer = timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
      timers.delete(key);
    }
    inMemoryCache.delete(key);
  }

  async invalidateAll(key: string): Promise<void> {
    const keys = inMemoryCache.keys();
    for (const cacheKey of keys) {
      if (cacheKey.startsWith(key)) {
        const existingTimer = timers.get(cacheKey);
        if (existingTimer) {
          clearTimeout(existingTimer);
          timers.delete(cacheKey);
        }
        inMemoryCache.delete(cacheKey);
      }
    }
  }
}
