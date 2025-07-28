import { Model } from "../../../../models/model";
import { QueryBuilder } from "../../../../query_builder/query_builder";

export type UnionCallBack<T extends Model> = (
  queryBuilder: QueryBuilder<T>,
) => QueryBuilder<T>;

export type SqlMethod =
  // Aggregates
  | "sum"
  | "avg"
  | "max"
  | "min"
  | "count"
  // String
  | "upper"
  | "lower"
  | "trim"
  | "length"
  // Type conversion
  | "cast"
  | "convert"
  // Other
  | "abs"
  | "round"
  | "floor"
  | "ceil";
