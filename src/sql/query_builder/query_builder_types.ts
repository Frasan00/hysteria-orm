import { PickMethods } from "../../utils/types";
import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import { QueryBuilder } from "./query_builder";

export type PluckReturnType<
  T extends Model,
  K extends ModelKey<T>,
> = T[K] extends infer U ? U[] : never;

export type QueryBuilderWithOnlyWhereConditions<T extends Model> = PickMethods<
  QueryBuilder<T>,
  | "where"
  | "andWhere"
  | "orWhere"
  | "whereSubQuery"
  | "andWhereSubQuery"
  | "orWhereSubQuery"
  | "whereBuilder"
  | "andWhereBuilder"
  | "orWhereBuilder"
  | "whereIn"
  | "andWhereIn"
  | "orWhereIn"
  | "whereNotIn"
  | "andWhereNotIn"
  | "orWhereNotIn"
  | "whereNull"
  | "andWhereNull"
  | "orWhereNull"
  | "whereNotNull"
  | "andWhereNotNull"
  | "orWhereNotNull"
  | "whereRegexp"
  | "andWhereRegexp"
  | "orWhereRegexp"
  | "whereBetween"
  | "andWhereBetween"
  | "orWhereBetween"
  | "whereNotBetween"
  | "andWhereNotBetween"
  | "orWhereNotBetween"
  | "whereIn"
  | "andWhereIn"
  | "orWhereIn"
  | "whereNotIn"
  | "andWhereNotIn"
  | "orWhereNotIn"
  | "whereNull"
  | "andWhereNull"
  | "orWhereNull"
  | "whereNotNull"
  | "andWhereNotNull"
  | "orWhereNotNull"
  | "whereRegexp"
  | "andWhereRegexp"
  | "orWhereRegexp"
  | "whereBetween"
  | "andWhereBetween"
  | "orWhereBetween"
  | "whereNotBetween"
  | "andWhereNotBetween"
  | "orWhereNotBetween"
>;

export type RelationRetrieveMethod<P extends any> = P extends any[]
  ? "many"
  : "one";

export type SelectableColumn<T extends string = string> =
  T extends `${infer Table}.${infer Column}.${string}`
    ? never // Reject multiple dots
    : T extends `${string} ${string}`
      ? never // Reject spaces
      : T extends `.${string}` | `${string}.`
        ? never // Reject leading/trailing dots
        : T extends `${string}-${string}`
          ? never // Reject hyphens
          : T extends `${string}.${string}`
            ? T // Accept table.column format
            : T;

/**
 * @description A column that can be used in a join statement e.g. `users.id`
 */
export type JoinableColumn = `${string}.${string}`;

/**
 * @description Options for streaming queries
 * @sqlite Ignores the options below
 */
export type StreamOptions = {
  highWaterMark?: number;

  /** Postgres only */
  rowMode?: "array";

  /** Postgres only */
  batchSize?: number;

  /** Postgres only */
  types?: any;

  /** Mysql only */
  objectMode?: boolean;
};
