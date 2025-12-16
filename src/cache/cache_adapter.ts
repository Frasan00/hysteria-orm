export interface CacheAdapter {
  /**
   * @description Gets a value from the cache
   * @param key The key to get the value from
   * @returns The value from the cache
   */
  get<T = void>(key: string): Promise<T>;
  /**
   * @description Sets a value in the cache
   * @param key The key to set the value to
   * @param data The value to set in the cache
   * @param ttl The time to live for the value in milliseconds
   */
  set<T = any>(key: string, data: T, ttl?: number): Promise<void>;
  /**
   * @description Invalidates a value from the cache
   * @param key The key to invalidate the value from
   */
  invalidate(key: string): Promise<void>;
  /**
   * @description Invalidates all values from the cache starting with the given key
   * @param key The key to invalidate the values from
   */
  invalidateAll(key: string): Promise<void>;
  /**
   * @description Disconnects from the cache adapter if needed when the data source disconnects
   */
  disconnect?(): Promise<void>;
}
