export interface CacheAdapter {
  get<T = void>(key: string): Promise<T>;
  set<T = any>(key: string, data: T, ttl?: number): Promise<void>;
  invalidate(key: string): Promise<void>;
  disconnect?(): Promise<void>;
}
