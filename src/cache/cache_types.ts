export type CacheKeys = Record<string, (...args: any[]) => Promise<any>>;

export type UseCacheReturnType<
  C extends CacheKeys,
  K extends keyof C,
> = K extends never ? never : Awaited<ReturnType<C[K]>>;
