import type { Model } from "../../model";
import { ModelQueryBuilder } from "../model_query_builder";

/**
 * @description Due to query limitations some query builder methods may not be available in a RelationQueryBuilder
 */
export type RelationQueryBuilderType<
  T extends Model,
  A extends Record<string, any> = {},
  R extends Record<string, any> = {},
> = Omit<
  ModelQueryBuilder<T, A, R>,
  | "increment"
  | "decrement"
  | "first"
  | "firstOrFail"
  | "paginate"
  | "pluck"
  | "truncate"
  | "limit"
  | "offset"
  | "many"
  | "one"
  | "oneOrFail"
  | "insert"
  | "insertMany"
  | "update"
  | "delete"
  | "softDelete"
  | "getSum"
  | "getAvg"
  | "getMin"
  | "getMax"
  | "getCount"
  | "getMin"
  | "getMax"
  | "getCount"
>;
