import type { Collection } from "./mongo_collection";
import type { MongoQueryBuilder } from "../query_builder/mongo_query_builder";

// ---------------------------------------------------------------------------
// Property definitions
// ---------------------------------------------------------------------------

export interface PropertyDef<T = unknown> {
  _phantom: T;
  _apply: (target: Object, propertyKey: string) => void;
}

// ---------------------------------------------------------------------------
// InferProperties — maps property defs to their runtime types
// ---------------------------------------------------------------------------

export type InferProperties<P extends Record<string, PropertyDef>> = {
  [K in keyof P]: P[K] extends PropertyDef<infer T> ? T : never;
};

// ---------------------------------------------------------------------------
// Collection definition input
// ---------------------------------------------------------------------------

export interface CollectionDefinition<P extends Record<string, PropertyDef>> {
  properties: P;
  hooks?: {
    beforeFetch?: (queryBuilder: MongoQueryBuilder<any>) => void;
    afterFetch?: (data: any[]) => Promise<Collection[]>;
    beforeInsert?: (data: any) => void;
    beforeUpdate?: (queryBuilder: MongoQueryBuilder<any>) => void;
    beforeDelete?: (queryBuilder: MongoQueryBuilder<any>) => void;
  };
}

// ---------------------------------------------------------------------------
// DefinedCollection — the return type of defineCollection
// ---------------------------------------------------------------------------

type HiddenCollectionStatics =
  | "query"
  | "find"
  | "findOne"
  | "findOneOrFail"
  | "insert"
  | "insertMany"
  | "updateRecord"
  | "deleteRecord"
  | "rawCollection"
  | "mongoInstance"
  | "establishConnection"
  | "dispatchModelManager"
  | "property";

export type DefinedCollection<
  T extends string,
  P extends Record<string, PropertyDef>,
> = Omit<typeof Collection, "new" | "prototype" | HiddenCollectionStatics> & {
  readonly _collection: T;
  new (): { readonly __collectionName: T } & InferProperties<P> & Collection;
  prototype: { readonly __collectionName: T } & InferProperties<P> & Collection;
};

// ---------------------------------------------------------------------------
// PropNamespace — the prop.string(), prop.number() etc. namespace
// ---------------------------------------------------------------------------

export interface PropNamespace {
  /** String property */
  string(): PropertyDef<string>;
  /** Number property */
  number(): PropertyDef<number>;
  /** Boolean property */
  boolean(): PropertyDef<boolean>;
  /** Date property */
  date(): PropertyDef<Date>;
  /** Typed object property */
  object<T = Record<string, unknown>>(): PropertyDef<T>;
  /** Any type (untyped) */
  any(): PropertyDef<any>;
}
