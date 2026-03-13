import { Collection } from "./mongo_collection";
import { property } from "./mongo_collection_decorators";
import type {
  CollectionDefinition,
  DefinedCollection,
  PropertyDef,
  PropNamespace,
} from "./define_collection_types";

// ---------------------------------------------------------------------------
// Internal helper — creates a PropertyDef wrapping a decorator apply function
// ---------------------------------------------------------------------------

function makePropertyDef<T>(
  apply: (target: Object, propertyKey: string) => void,
): PropertyDef<T> {
  return {
    _phantom: undefined as unknown as T,
    _apply: apply,
  };
}

// ---------------------------------------------------------------------------
// prop — property descriptor namespace
// ---------------------------------------------------------------------------

function makeProp<T>(): PropertyDef<T> {
  return makePropertyDef<T>((target, key) => {
    property()(target, key);
  });
}

export const prop: PropNamespace = {
  string: () => makeProp<string>(),
  number: () => makeProp<number>(),
  boolean: () => makeProp<boolean>(),
  date: () => makeProp<Date>(),
  object: <T = Record<string, unknown>>() => makeProp<T>(),
  any: () => makeProp<any>(),
};

// ---------------------------------------------------------------------------
// defineCollection
// ---------------------------------------------------------------------------

/**
 * Creates a fully-typed Collection subclass programmatically without decorators.
 *
 * @example
 * ```typescript
 * import { defineCollection, prop } from "hysteria-orm";
 *
 * const User = defineCollection("users", {
 *   properties: {
 *     name: prop.string(),
 *     email: prop.string(),
 *     age: prop.number(),
 *     isActive: prop.boolean(),
 *     profile: prop.object<{ bio: string; avatar: string }>(),
 *   },
 * });
 * ```
 */
export function defineCollection<
  T extends string,
  P extends Record<string, PropertyDef>,
>(name: T, definition: CollectionDefinition<P>): DefinedCollection<T, P> {
  const { properties, hooks } = definition;

  // 1. Create the anonymous Collection subclass
  class DefinedCollectionClass extends Collection {}

  // 2. Set the collection name
  DefinedCollectionClass._collection = name;

  // 3. Register properties
  for (const [propertyName, propDef] of Object.entries(properties)) {
    propDef._apply(DefinedCollectionClass.prototype, propertyName);
  }

  // 4. Attach hooks
  if (hooks) {
    if (hooks.beforeFetch) {
      DefinedCollectionClass.beforeFetch = hooks.beforeFetch;
    }
    if (hooks.afterFetch) {
      DefinedCollectionClass.afterFetch = hooks.afterFetch;
    }
    if (hooks.beforeInsert) {
      DefinedCollectionClass.beforeInsert = hooks.beforeInsert;
    }
    if (hooks.beforeUpdate) {
      DefinedCollectionClass.beforeUpdate = hooks.beforeUpdate;
    }
    if (hooks.beforeDelete) {
      DefinedCollectionClass.beforeDelete = hooks.beforeDelete;
    }
  }

  return DefinedCollectionClass as unknown as DefinedCollection<T, P>;
}
