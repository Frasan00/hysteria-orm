import { RawNode } from "../ast/query/node/raw/raw_node";
import { SqlFuncNode } from "../ast/query/node/sqlfunc/sqlfunc";
import type { Model } from "../models/model";
import type { WhereType } from "../models/model_manager/model_manager_types";
import type { WhereOnlyQueryBuilder } from "./query_builder_types";
import type { WhereQueryBuilder } from "./where_query_builder";

/**
 * @description The `{ column: value }` / `{ column: { op, value } }` shorthand, with
 * `$and` and `$or` keys for grouping. Shared by `find()` and the builder's `where()`.
 * @description Typed against the model's columns; a raw table builder passes `any`,
 * which accepts every key and value.
 */
export type ObjectWhereCondition<T = any> = WhereType<T>;

/**
 * @description One argument holding a plain object, and no second argument: the only
 * shape `where` accepts that is neither a callback nor a column reference.
 */
export const isObjectWhere = (
  columnOrCb: unknown,
  operatorOrValue: unknown,
): boolean => {
  if (operatorOrValue !== undefined || columnOrCb === null) {
    return false;
  }

  if (typeof columnOrCb !== "object") {
    return false;
  }

  return !(
    Array.isArray(columnOrCb) ||
    columnOrCb instanceof RawNode ||
    columnOrCb instanceof SqlFuncNode
  );
};

const pushCondition = <T extends Model>(
  query: WhereOnlyQueryBuilder<T>,
  useOr: boolean,
  column: string,
  operator: string | null,
  value: unknown,
  rawCondition: unknown,
): void => {
  // the shorthand carries plain column strings, which the Pick-based column types reject
  const builder = query as any;

  if (operator === null) {
    value === null
      ? useOr
        ? builder.orWhereNull(column)
        : builder.whereNull(column)
      : useOr
        ? builder.orWhere(column, "=", value as any)
        : builder.where(column, "=", value as any);
    return;
  }

  const withOperator = (target: string, operand?: unknown): void => {
    useOr
      ? builder.orWhere(column, target, operand as any)
      : builder.where(column, target, operand as any);
  };

  switch (operator) {
    case "$eq":
      value === null
        ? useOr
          ? builder.orWhereNull(column)
          : builder.whereNull(column)
        : withOperator("=", value);
      break;
    case "$ne":
      value === null
        ? useOr
          ? builder.orWhereNotNull(column)
          : builder.whereNotNull(column)
        : withOperator("!=", value);
      break;
    case "$gt":
      withOperator(">", value);
      break;
    case "$gte":
      withOperator(">=", value);
      break;
    case "$lt":
      withOperator("<", value);
      break;
    case "$lte":
      withOperator("<=", value);
      break;
    case "$between": {
      const [min, max] = value as [unknown, unknown];
      useOr
        ? builder.orWhereBetween(column, min as any, max as any)
        : builder.whereBetween(column, min as any, max as any);
      break;
    }
    case "$not between": {
      const [notMin, notMax] = value as [unknown, unknown];
      useOr
        ? builder.orWhereNotBetween(column, notMin as any, notMax as any)
        : builder.whereNotBetween(column, notMin as any, notMax as any);
      break;
    }
    case "$regexp":
      useOr
        ? builder.orWhereRegexp(column, value as RegExp)
        : builder.whereRegexp(column, value as RegExp);
      break;
    case "$not regexp":
      useOr
        ? builder.orWhereNotRegexp(column, value as RegExp)
        : builder.whereNotRegexp(column, value as RegExp);
      break;
    case "$is null":
      useOr ? builder.orWhereNull(column) : builder.whereNull(column);
      break;
    case "$is not null":
      useOr ? builder.orWhereNotNull(column) : builder.whereNotNull(column);
      break;
    case "$like":
      useOr
        ? builder.orWhereLike(column, value as string)
        : builder.whereLike(column, value as string);
      break;
    case "$not like":
      useOr
        ? builder.orWhereNotLike(column, value as string)
        : builder.whereNotLike(column, value as string);
      break;
    case "$ilike":
      useOr
        ? builder.orWhereILike(column, value as string)
        : builder.whereILike(column, value as string);
      break;
    case "$not ilike":
      useOr
        ? builder.orWhereNotILike(column, value as string)
        : builder.whereNotILike(column, value as string);
      break;
    case "$in":
      useOr
        ? builder.orWhereIn(column, value as any[])
        : builder.whereIn(column, value as any[]);
      break;
    case "$nin":
      useOr
        ? builder.orWhereNotIn(column, value as any[])
        : builder.whereNotIn(column, value as any[]);
      break;
    default:
      withOperator("=", rawCondition);
  }
};

const applyFieldCondition = <T extends Model>(
  query: WhereOnlyQueryBuilder<T>,
  column: string,
  condition: unknown,
  useOr: boolean,
): void => {
  if (
    condition === null ||
    condition === undefined ||
    typeof condition !== "object"
  ) {
    pushCondition(query, useOr, column, null, condition, condition);
    return;
  }

  const opCondition = condition as { op: string; value?: unknown };
  pushCondition(
    query,
    useOr,
    column,
    opCondition.op,
    opCondition.value,
    condition,
  );
};

export const applyObjectWhere = <T extends Model>(
  query: WhereOnlyQueryBuilder<T>,
  where: ObjectWhereCondition<T>,
  useOr = false,
): void => {
  if (!where) {
    return;
  }

  for (const [key, condition] of Object.entries(where)) {
    if (key === "$and" && Array.isArray(condition)) {
      const groupMethod = useOr ? "orWhere" : "where";
      (query as any)[groupMethod]((builder: WhereQueryBuilder<T>) => {
        for (const subCondition of condition) {
          applyObjectWhere(
            builder as unknown as WhereOnlyQueryBuilder<T>,
            subCondition,
            false,
          );
        }
      });
    } else if (key === "$or" && Array.isArray(condition)) {
      const groupMethod = useOr ? "orWhere" : "where";
      (query as any)[groupMethod]((builder: WhereQueryBuilder<T>) => {
        let isFirst = true;
        for (const subCondition of condition) {
          applyObjectWhere(
            builder as unknown as WhereOnlyQueryBuilder<T>,
            subCondition,
            !isFirst,
          );
          isFirst = false;
        }
      });
    } else {
      applyFieldCondition(query, key, condition, useOr);
    }
  }
};
