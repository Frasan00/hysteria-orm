type MetadataKey = string | symbol;
type Property = string | symbol | undefined;

type MetadataMap = Map<MetadataKey, unknown>;
type PropertyStore = Map<Property, MetadataMap>;

/* Own version of reflect-metadata with only the features we need and without having to rely on the original package */
export class Reflect {
  private static store: WeakMap<object, PropertyStore> = new WeakMap();

  static defineMetadata(
    metadataKey: MetadataKey,
    metadataValue: unknown,
    target: object,
    propertyKey?: string | symbol,
  ): void {
    if (
      (typeof target !== "object" || target === null) &&
      typeof target !== "function"
    ) {
      throw new TypeError("target must be an object or function");
    }

    let propStore = this.store.get(target);
    if (!propStore) {
      propStore = new Map();
      this.store.set(target, propStore);
    }

    let metaMap = propStore.get(propertyKey);
    if (!metaMap) {
      metaMap = new Map();
      propStore.set(propertyKey, metaMap);
    }

    metaMap.set(metadataKey, metadataValue);
  }

  static getMetadata<T = unknown>(
    metadataKey: MetadataKey,
    target: object,
    propertyKey?: string | symbol,
  ): T | undefined {
    if (
      (typeof target !== "object" || target === null) &&
      typeof target !== "function"
    ) {
      throw new TypeError("target must be an object or function");
    }

    let current: object | null = target;
    while (current) {
      const propStore = this.store.get(current);
      if (propStore) {
        const metaMap = propStore.get(propertyKey);
        if (metaMap && metaMap.has(metadataKey)) {
          return metaMap.get(metadataKey) as T;
        }
      }

      current = Object.getPrototypeOf(current);
    }

    return;
  }
}
