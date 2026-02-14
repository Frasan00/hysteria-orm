import { HavingNode } from "../ast/query/node/having";
import type {
  BaseValues,
  BinaryOperatorType,
} from "../ast/query/node/where/where";
import { WhereNode } from "../ast/query/node/where/where";
import { WhereGroupNode } from "../ast/query/node/where/where_group";
import type { SubqueryOperatorType } from "../ast/query/node/where/where_subquery";
import { WhereSubqueryNode } from "../ast/query/node/where/where_subquery";
import { Model } from "../models/model";
import type {
  ModelKey,
  WhereColumnValue,
} from "../models/model_manager/model_manager_types";
import { SqlDataSource } from "../sql_data_source";
import { QueryBuilder } from "./query_builder";
import type { WhereOnlyQueryBuilder } from "./query_builder_types";
import { SelectableColumn } from "./query_builder_types";
import { SelectQueryBuilder } from "./select_query_builder";

export abstract class WhereQueryBuilder<
  T extends Model,
  S extends Record<string, any> = Record<string, any>,
> extends SelectQueryBuilder<T, S> {
  protected whereNodes: (WhereNode | WhereGroupNode | WhereSubqueryNode)[];
  protected havingNodes: HavingNode[];
  protected isNestedCondition = false;

  constructor(
    model: typeof Model,
    sqlDataSource: SqlDataSource,
    isNestedCondition = false,
  ) {
    super(model, sqlDataSource);
    this.whereNodes = [];
    this.havingNodes = [];
    this.isNestedCondition = isNestedCondition;
  }

  clearWhere(): this {
    this.whereNodes = [];
    return this;
  }

  clearHaving(): this {
    this.havingNodes = [];
    return this;
  }

  /**
   * @description Accepts a value and executes a callback only of the value is not null or undefined.
   * @warning The value is not checked for truthiness but existence, it is only checked for undefined or null. So false, 0, "", etc. will be considered truthy.
   */
  strictWhen(value: any, cb: (query: this) => void): this {
    if (value === undefined || value === null) {
      return this;
    }

    cb(this);
    return this;
  }

  /**
   * @description Accepts a value and executes a callback only of the value is not falsy.
   * @warning The value is checked for truthiness, so false, 0, "", etc. will be considered falsy. Use strictWhen for null or undefined only cases.
   */
  when(value: any, cb: (query: this) => void): this {
    if (!value) {
      return this;
    }

    cb(this);
    return this;
  }

  /**
   * @description Adds a WHERE condition to the query.
   */
  where(cb: (queryBuilder: WhereOnlyQueryBuilder<T>) => void): this;
  where(
    column: string,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  where(
    column: string,
    operator: SubqueryOperatorType,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  where<K extends ModelKey<T>>(
    column: K,
    operator: BinaryOperatorType,
    value: WhereColumnValue<T, K>,
  ): this;
  where<K extends ModelKey<T>>(column: K, value: WhereColumnValue<T, K>): this;
  where(
    column: `${string}.${string}`,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  where(column: `${string}.${string}`, value: BaseValues): this;
  where(
    columnOrCb:
      | ModelKey<T>
      | SelectableColumn<string>
      | ((queryBuilder: WhereOnlyQueryBuilder<T>) => void),
    operatorOrValue?:
      | BinaryOperatorType
      | BaseValues
      | SubqueryOperatorType
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
    value?:
      | BaseValues
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (typeof columnOrCb === "function") {
      return this.andWhereGroup(
        columnOrCb as unknown as (qb: WhereQueryBuilder<T>) => void,
      );
    }

    if (typeof operatorOrValue === "function" && value === undefined) {
      return this.andWhereSubQuery(
        columnOrCb as string,
        "in",
        operatorOrValue as (subQuery: QueryBuilder<T>) => void,
      );
    }

    if (operatorOrValue instanceof QueryBuilder && value === undefined) {
      return this.andWhereSubQuery(
        columnOrCb as string,
        "in",
        operatorOrValue as QueryBuilder<T>,
      );
    }

    if (
      typeof operatorOrValue === "string" &&
      (operatorOrValue as string) !== "=" &&
      value !== undefined &&
      (value instanceof QueryBuilder || typeof value === "function")
    ) {
      return this.andWhereSubQuery(
        columnOrCb as string,
        operatorOrValue as SubqueryOperatorType,
        value as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
      );
    }

    return this.andWhere(
      columnOrCb as ModelKey<T>,
      operatorOrValue as BinaryOperatorType,
      value as any,
    );
  }

  /**
   * @description Adds an AND WHERE condition to the query.
   */
  andWhere(cb: (queryBuilder: WhereOnlyQueryBuilder<T>) => void): this;
  andWhere(
    column: string,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  andWhere(
    column: string,
    operator: SubqueryOperatorType,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  andWhere<K extends ModelKey<T>>(
    column: K,
    operator: BinaryOperatorType,
    value: WhereColumnValue<T, K>,
  ): this;
  andWhere<K extends ModelKey<T>>(
    column: K,
    value: WhereColumnValue<T, K>,
  ): this;
  andWhere(
    column: `${string}.${string}`,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  andWhere(column: `${string}.${string}`, value: BaseValues): this;
  andWhere<S extends string>(
    columnOrCb:
      | ModelKey<T>
      | SelectableColumn<S>
      | ((queryBuilder: WhereQueryBuilder<T>) => void),
    operatorOrValue?:
      | BinaryOperatorType
      | BaseValues
      | SubqueryOperatorType
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
    value?:
      | BaseValues
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (typeof columnOrCb === "function") {
      return this.andWhereGroup(
        columnOrCb as (qb: WhereQueryBuilder<T>) => void,
      );
    }

    if (typeof operatorOrValue === "function" && value === undefined) {
      return this.andWhereSubQuery(
        columnOrCb as string,
        "in",
        operatorOrValue as (subQuery: QueryBuilder<T>) => void,
      );
    }

    if (operatorOrValue instanceof QueryBuilder && value === undefined) {
      return this.andWhereSubQuery(
        columnOrCb as string,
        "in",
        operatorOrValue as QueryBuilder<T>,
      );
    }

    if (
      typeof operatorOrValue === "string" &&
      (operatorOrValue as string) !== "=" &&
      value !== undefined &&
      (value instanceof QueryBuilder || typeof value === "function")
    ) {
      return this.andWhereSubQuery(
        columnOrCb as string,
        operatorOrValue as SubqueryOperatorType,
        value as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
      );
    }

    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (
      typeof operatorOrValue === "string" &&
      value !== undefined &&
      !(value instanceof QueryBuilder) &&
      typeof value !== "function"
    ) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(columnOrCb as string, "and", false, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE condition to the query.
   */
  orWhere(cb: (queryBuilder: WhereOnlyQueryBuilder<T>) => void): this;
  orWhere(
    column: string,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  orWhere(
    column: string,
    operator: SubqueryOperatorType,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  orWhere<K extends ModelKey<T>>(
    column: K,
    operator: BinaryOperatorType,
    value: WhereColumnValue<T, K>,
  ): this;
  orWhere<K extends ModelKey<T>>(
    column: K,
    value: WhereColumnValue<T, K>,
  ): this;
  orWhere(
    column: `${string}.${string}`,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  orWhere(column: `${string}.${string}`, value: BaseValues): this;
  orWhere<S extends string>(
    columnOrCb:
      | ModelKey<T>
      | SelectableColumn<S>
      | ((queryBuilder: WhereQueryBuilder<T>) => void),
    operatorOrValue?:
      | BinaryOperatorType
      | BaseValues
      | SubqueryOperatorType
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
    value?:
      | BaseValues
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (typeof columnOrCb === "function") {
      return this.orWhereGroup(
        columnOrCb as (qb: WhereQueryBuilder<T>) => void,
      );
    }

    if (typeof operatorOrValue === "function" && value === undefined) {
      return this.orWhereSubQuery(
        columnOrCb as string,
        "in",
        operatorOrValue as (subQuery: QueryBuilder<T>) => void,
      );
    }

    if (operatorOrValue instanceof QueryBuilder && value === undefined) {
      return this.orWhereSubQuery(
        columnOrCb as string,
        "in",
        operatorOrValue as QueryBuilder<T>,
      );
    }

    if (
      typeof operatorOrValue === "string" &&
      (operatorOrValue as string) !== "=" &&
      value !== undefined &&
      (value instanceof QueryBuilder || typeof value === "function")
    ) {
      return this.orWhereSubQuery(
        columnOrCb as string,
        operatorOrValue as SubqueryOperatorType,
        value as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
      );
    }

    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (
      typeof operatorOrValue === "string" &&
      value !== undefined &&
      !(value instanceof QueryBuilder) &&
      typeof value !== "function"
    ) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(columnOrCb as string, "or", false, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds a negated WHERE condition to the query.
   */
  whereNot(
    column: string,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  whereNot(
    column: string,
    operator: SubqueryOperatorType,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  whereNot<K extends ModelKey<T>>(
    column: K,
    operator: BinaryOperatorType,
    value: WhereColumnValue<T, K>,
  ): this;
  whereNot<K extends ModelKey<T>>(
    column: K,
    value: WhereColumnValue<T, K>,
  ): this;
  whereNot(
    column: `${string}.${string}`,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  whereNot(column: `${string}.${string}`, value: BaseValues): this;
  whereNot<S extends string>(
    column: ModelKey<T> | SelectableColumn<S>,
    operatorOrValue:
      | BinaryOperatorType
      | BaseValues
      | SubqueryOperatorType
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
    value?:
      | BaseValues
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (typeof operatorOrValue === "function" && value === undefined) {
      return this.andWhereSubQuery(
        column as string,
        "not in",
        operatorOrValue as (subQuery: QueryBuilder<T>) => void,
      );
    }

    if (operatorOrValue instanceof QueryBuilder && value === undefined) {
      return this.andWhereSubQuery(
        column as string,
        "not in",
        operatorOrValue as QueryBuilder<T>,
      );
    }

    if (
      typeof operatorOrValue === "string" &&
      value !== undefined &&
      (value instanceof QueryBuilder || typeof value === "function")
    ) {
      return this.andWhereSubQuery(
        column as string,
        operatorOrValue as SubqueryOperatorType,
        value as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
      );
    }

    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (
      typeof operatorOrValue === "string" &&
      value !== undefined &&
      !(value instanceof QueryBuilder) &&
      typeof value !== "function"
    ) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(column as string, "and", true, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds a negated AND WHERE condition to the query.
   */
  andWhereNot(
    column: string,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  andWhereNot(
    column: string,
    operator: SubqueryOperatorType,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  andWhereNot<K extends ModelKey<T>>(
    column: K,
    operator: BinaryOperatorType,
    value: WhereColumnValue<T, K>,
  ): this;
  andWhereNot<K extends ModelKey<T>>(
    column: K,
    value: WhereColumnValue<T, K>,
  ): this;
  andWhereNot(
    column: `${string}.${string}`,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  andWhereNot(column: `${string}.${string}`, value: BaseValues): this;
  andWhereNot<S extends string>(
    column: ModelKey<T> | SelectableColumn<S>,
    operatorOrValue:
      | BinaryOperatorType
      | BaseValues
      | SubqueryOperatorType
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
    value?:
      | BaseValues
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (typeof operatorOrValue === "function" && value === undefined) {
      return this.andWhereSubQuery(
        column as string,
        "not in",
        operatorOrValue as (subQuery: QueryBuilder<T>) => void,
      );
    }

    if (operatorOrValue instanceof QueryBuilder && value === undefined) {
      return this.andWhereSubQuery(
        column as string,
        "not in",
        operatorOrValue as QueryBuilder<T>,
      );
    }

    if (
      typeof operatorOrValue === "string" &&
      value !== undefined &&
      (value instanceof QueryBuilder || typeof value === "function")
    ) {
      return this.andWhereSubQuery(
        column as string,
        operatorOrValue as SubqueryOperatorType,
        value as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
      );
    }

    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (
      typeof operatorOrValue === "string" &&
      value !== undefined &&
      !(value instanceof QueryBuilder) &&
      typeof value !== "function"
    ) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(column as string, "and", true, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds a negated OR WHERE condition to the query.
   */
  orWhereNot(
    column: string,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  orWhereNot(
    column: string,
    operator: SubqueryOperatorType,
    subQuery: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  orWhereNot<K extends ModelKey<T>>(
    column: K,
    operator: BinaryOperatorType,
    value: WhereColumnValue<T, K>,
  ): this;
  orWhereNot<K extends ModelKey<T>>(
    column: K,
    value: WhereColumnValue<T, K>,
  ): this;
  orWhereNot(
    column: `${string}.${string}`,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  orWhereNot(column: `${string}.${string}`, value: BaseValues): this;
  orWhereNot<S extends string>(
    column: ModelKey<T> | SelectableColumn<S>,
    operatorOrValue:
      | BinaryOperatorType
      | BaseValues
      | SubqueryOperatorType
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
    value?:
      | BaseValues
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (typeof operatorOrValue === "function" && value === undefined) {
      return this.orWhereSubQuery(
        column as string,
        "not in",
        operatorOrValue as (subQuery: QueryBuilder<T>) => void,
      );
    }

    if (operatorOrValue instanceof QueryBuilder && value === undefined) {
      return this.orWhereSubQuery(
        column as string,
        "not in",
        operatorOrValue as QueryBuilder<T>,
      );
    }

    if (
      typeof operatorOrValue === "string" &&
      value !== undefined &&
      (value instanceof QueryBuilder || typeof value === "function")
    ) {
      return this.orWhereSubQuery(
        column as string,
        operatorOrValue as SubqueryOperatorType,
        value as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
      );
    }

    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (
      typeof operatorOrValue === "string" &&
      value !== undefined &&
      !(value instanceof QueryBuilder) &&
      typeof value !== "function"
    ) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.whereNodes.push(
      new WhereNode(column as string, "or", true, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds a WHERE BETWEEN condition to the query.
   */
  whereBetween<K extends ModelKey<T>>(column: K, min: T[K], max: T[K]): this;
  whereBetween(
    column: `${string}.${string}`,
    min: BaseValues,
    max: BaseValues,
  ): this;
  whereBetween(
    column: ModelKey<T> | SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    return this.andWhereBetween(column as ModelKey<T>, min as any, max as any);
  }

  /**
   * @description Adds an AND WHERE BETWEEN condition to the query.
   */
  andWhereBetween<K extends ModelKey<T>>(column: K, min: T[K], max: T[K]): this;
  andWhereBetween(
    column: `${string}.${string}`,
    min: BaseValues,
    max: BaseValues,
  ): this;
  andWhereBetween(
    column: ModelKey<T> | SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "between", [min, max]),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE BETWEEN condition to the query.
   */
  orWhereBetween<K extends ModelKey<T>>(column: K, min: T[K], max: T[K]): this;
  orWhereBetween(
    column: `${string}.${string}`,
    min: BaseValues,
    max: BaseValues,
  ): this;
  orWhereBetween(
    column: ModelKey<T> | SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "between", [min, max]),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT BETWEEN condition to the query.
   */
  whereNotBetween<K extends ModelKey<T>>(column: K, min: T[K], max: T[K]): this;
  whereNotBetween(
    column: `${string}.${string}`,
    min: BaseValues,
    max: BaseValues,
  ): this;
  whereNotBetween(
    column: ModelKey<T> | SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    return this.andWhereNotBetween(
      column as ModelKey<T>,
      min as any,
      max as any,
    );
  }

  /**
   * @description Adds an AND WHERE NOT BETWEEN condition to the query.
   */
  andWhereNotBetween<K extends ModelKey<T>>(
    column: K,
    min: T[K],
    max: T[K],
  ): this;
  andWhereNotBetween(
    column: `${string}.${string}`,
    min: BaseValues,
    max: BaseValues,
  ): this;
  andWhereNotBetween(
    column: ModelKey<T> | SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", true, "between", [min, max]),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT BETWEEN condition to the query.
   */
  orWhereNotBetween<K extends ModelKey<T>>(
    column: K,
    min: T[K],
    max: T[K],
  ): this;
  orWhereNotBetween(
    column: `${string}.${string}`,
    min: BaseValues,
    max: BaseValues,
  ): this;
  orWhereNotBetween(
    column: ModelKey<T> | SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", true, "between", [min, max]),
    );
    return this;
  }

  /**
   * @description Adds a WHERE LIKE condition to the query.
   */
  whereLike(column: ModelKey<T>, value: string): this;
  whereLike<S extends string>(column: SelectableColumn<S>, value: string): this;
  whereLike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    return this.andWhereLike(column as ModelKey<T>, value);
  }

  /**
   * @description Adds an AND WHERE LIKE condition to the query.
   */
  andWhereLike(column: ModelKey<T>, value: string): this;
  andWhereLike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  andWhereLike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    this.where(column as ModelKey<T>, "like" as any, value as any);
    return this;
  }

  /**
   * @description Adds an OR WHERE LIKE condition to the query.
   */
  orWhereLike(column: ModelKey<T>, value: string): this;
  orWhereLike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  orWhereLike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    this.orWhere(column as ModelKey<T>, "like" as any, value as any);
    return this;
  }

  /**
   * @description Adds a WHERE ILIKE condition to the query.
   */
  whereILike(column: ModelKey<T>, value: string): this;
  whereILike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  whereILike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    return this.andWhereILike(column as ModelKey<T>, value);
  }

  /**
   * @description Adds an AND WHERE ILIKE condition to the query.
   */
  andWhereILike(column: ModelKey<T>, value: string): this;
  andWhereILike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  andWhereILike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    this.where(column as ModelKey<T>, "ilike" as any, value as any);
    return this;
  }

  /**
   * @description Adds an OR WHERE ILIKE condition to the query.
   */
  orWhereILike(column: ModelKey<T>, value: string): this;
  orWhereILike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  orWhereILike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    this.orWhere(column as ModelKey<T>, "ilike" as any, value as any);
    return this;
  }

  /**
   * @description Adds a WHERE NOT LIKE condition to the query.
   */
  whereNotLike(column: ModelKey<T>, value: string): this;
  whereNotLike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  whereNotLike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    return this.andWhereNotLike(column as ModelKey<T>, value);
  }

  /**
   * @description Adds an AND WHERE NOT LIKE condition to the query.
   */
  andWhereNotLike(column: ModelKey<T>, value: string): this;
  andWhereNotLike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  andWhereNotLike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    this.where(column as ModelKey<T>, "not like" as any, value as any);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT LIKE condition to the query.
   */
  orWhereNotLike(column: ModelKey<T>, value: string): this;
  orWhereNotLike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  orWhereNotLike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    this.orWhere(column as ModelKey<T>, "not like" as any, value as any);
    return this;
  }

  /**
   * @description Adds a WHERE NOT ILIKE condition to the query.
   */
  whereNotILike(column: ModelKey<T>, value: string): this;
  whereNotILike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  whereNotILike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    return this.andWhereNotILike(column as ModelKey<T>, value);
  }

  /**
   * @description Adds an AND WHERE NOT ILIKE condition to the query.
   */
  andWhereNotILike(column: ModelKey<T>, value: string): this;
  andWhereNotILike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  andWhereNotILike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    this.where(column as ModelKey<T>, "not ilike" as any, value as any);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT ILIKE condition to the query.
   */
  orWhereNotILike(column: ModelKey<T>, value: string): this;
  orWhereNotILike<S extends string>(
    column: SelectableColumn<S>,
    value: string,
  ): this;
  orWhereNotILike(
    column: ModelKey<T> | SelectableColumn<string>,
    value: string,
  ): this {
    this.orWhere(column as ModelKey<T>, "not ilike" as any, value as any);
    return this;
  }

  /**
   * @description Adds a WHERE IN condition to the query.
   * @warning If the array is empty, it will add an impossible condition.
   */
  whereIn(
    column: string,
    values: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  whereIn<K extends ModelKey<T>>(column: K, values: T[K][]): this;
  whereIn(column: `${string}.${string}`, values: BaseValues[]): this;
  whereIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values:
      | BaseValues[]
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    return this.andWhereIn(column as ModelKey<T>, values as any);
  }

  /**
   * @description Adds an AND WHERE IN condition to the query.
   * @warning If the array is empty, it will add an impossible condition.
   */
  andWhereIn(
    column: string,
    values: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  andWhereIn<K extends ModelKey<T>>(column: K, values: T[K][]): this;
  andWhereIn(column: `${string}.${string}`, values: BaseValues[]): this;
  andWhereIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values:
      | BaseValues[]
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (Array.isArray(values)) {
      if (!values.length) {
        this.whereNodes.push(
          new WhereNode("false", "and", true, "=", [], true),
        );
        return this;
      }

      this.whereNodes.push(
        new WhereNode(column as string, "and", false, "in", values),
      );
      return this;
    }

    return this.andWhereSubQuery(
      column as string,
      "in",
      values as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
    );
  }

  /**
   * @description Adds an OR WHERE IN condition to the query.
   * @warning If the array is empty, it will add an impossible condition.
   */
  orWhereIn(
    column: string,
    values: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  orWhereIn<K extends ModelKey<T>>(column: K, values: T[K][]): this;
  orWhereIn(column: `${string}.${string}`, values: BaseValues[]): this;
  orWhereIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values:
      | BaseValues[]
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (Array.isArray(values)) {
      if (!values.length) {
        this.whereNodes.push(new WhereNode("false", "or", true, "=", [], true));
        return this;
      }

      this.whereNodes.push(
        new WhereNode(column as string, "or", false, "in", values),
      );
      return this;
    }

    return this.orWhereSubQuery(
      column as string,
      "in",
      values as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
    );
  }

  /**
   * @description Adds a WHERE NOT IN condition to the query.
   * @warning If the array is empty, it will add an obvious condition to make it true.
   */
  whereNotIn(
    column: string,
    values: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  whereNotIn<K extends ModelKey<T>>(column: K, values: T[K][]): this;
  whereNotIn(column: `${string}.${string}`, values: BaseValues[]): this;
  whereNotIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values:
      | BaseValues[]
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    return this.andWhereNotIn(column as ModelKey<T>, values as any);
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @warning If the array is empty, it will add an obvious condition to make it true.
   */
  andWhereNotIn(
    column: string,
    values: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  andWhereNotIn<K extends ModelKey<T>>(column: K, values: T[K][]): this;
  andWhereNotIn(column: `${string}.${string}`, values: BaseValues[]): this;
  andWhereNotIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values:
      | BaseValues[]
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (Array.isArray(values)) {
      if (!values.length) {
        this.whereNodes.push(new WhereNode("true", "and", true, "=", [], true));
        return this;
      }

      this.whereNodes.push(
        new WhereNode(column as string, "and", true, "in", values),
      );
      return this;
    }

    return this.andWhereSubQuery(
      column as string,
      "not in",
      values as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
    );
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @warning If the array is empty, it will add an obvious condition to make it true.
   */
  orWhereNotIn(
    column: string,
    values: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this;
  orWhereNotIn<K extends ModelKey<T>>(column: K, values: T[K][]): this;
  orWhereNotIn(column: `${string}.${string}`, values: BaseValues[]): this;
  orWhereNotIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values:
      | BaseValues[]
      | QueryBuilder<T>
      | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    if (Array.isArray(values)) {
      if (!values.length) {
        this.whereNodes.push(new WhereNode("true", "or", true, "=", [], true));
        return this;
      }

      this.whereNodes.push(
        new WhereNode(column as string, "or", true, "in", values),
      );
      return this;
    }

    return this.orWhereSubQuery(
      column as string,
      "not in",
      values as QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
    );
  }

  /**
   * @description Adds a WHERE NULL condition to the query.
   */
  whereNull(column: ModelKey<T>): this;
  whereNull<S extends string>(column: SelectableColumn<S>): this;
  whereNull(column: ModelKey<T> | SelectableColumn<string>): this {
    return this.andWhereNull(column as ModelKey<T>);
  }

  /**
   * @description Adds an AND WHERE NULL condition to the query.
   */
  andWhereNull(column: ModelKey<T>): this;
  andWhereNull<S extends string>(column: SelectableColumn<S>): this;
  andWhereNull(column: ModelKey<T> | SelectableColumn<string>): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "is null", undefined),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NULL condition to the query.
   */
  orWhereNull(column: ModelKey<T>): this;
  orWhereNull<S extends string>(column: SelectableColumn<S>): this;
  orWhereNull(column: ModelKey<T> | SelectableColumn<string>): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "is null", undefined),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   */
  whereNotNull(column: ModelKey<T>): this;
  whereNotNull<S extends string>(column: SelectableColumn<S>): this;
  whereNotNull(column: ModelKey<T> | SelectableColumn<string>): this {
    return this.andWhereNotNull(column as ModelKey<T>);
  }

  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   */
  andWhereNotNull(column: ModelKey<T>): this;
  andWhereNotNull<S extends string>(column: SelectableColumn<S>): this;
  andWhereNotNull(column: ModelKey<T> | SelectableColumn<string>): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "is not null", undefined),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   */
  orWhereNotNull(column: ModelKey<T>): this;
  orWhereNotNull<S extends string>(column: SelectableColumn<S>): this;
  orWhereNotNull(column: ModelKey<T> | SelectableColumn<string>): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "is not null", undefined),
    );
    return this;
  }

  /**
   * @description Adds a WHERE REGEXP condition to the query.
   * @mssql doesn't support REGEXP syntax
   * @sqlite doesn't support REGEXP syntax
   */
  whereRegexp(column: ModelKey<T>, regexp: RegExp): this;
  whereRegexp<S extends string>(
    column: SelectableColumn<S>,
    regexp: RegExp,
  ): this;
  whereRegexp(
    column: ModelKey<T> | SelectableColumn<string>,
    regexp: RegExp,
  ): this {
    return this.andWhereRegexp(column as ModelKey<T>, regexp);
  }

  /**
   * @description Adds an AND WHERE REGEXP condition to the query.
   * @mssql doesn't support REGEXP syntax
   * @sqlite doesn't support REGEXP syntax
   */
  andWhereRegexp(column: ModelKey<T>, regexp: RegExp): this;
  andWhereRegexp<S extends string>(
    column: SelectableColumn<S>,
    regexp: RegExp,
  ): this;
  andWhereRegexp(
    column: ModelKey<T> | SelectableColumn<string>,
    regexp: RegExp,
  ): this {
    const isPg =
      this.sqlDataSource.getDbType() === "postgres" ||
      this.sqlDataSource.getDbType() === "cockroachdb";

    this.whereNodes.push(
      new WhereNode(
        column as string,
        "and",
        false,
        isPg ? ("~" as BinaryOperatorType) : "regexp",
        regexp.source,
      ),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE REGEXP condition to the query.
   * @mssql doesn't support REGEXP syntax
   * @sqlite doesn't support REGEXP syntax
   */
  orWhereRegexp(column: ModelKey<T>, regexp: RegExp): this;
  orWhereRegexp<S extends string>(
    column: SelectableColumn<S>,
    regexp: RegExp,
  ): this;
  orWhereRegexp(
    column: ModelKey<T> | SelectableColumn<string>,
    regexp: RegExp,
  ): this {
    const isPg =
      this.sqlDataSource.getDbType() === "postgres" ||
      this.sqlDataSource.getDbType() === "cockroachdb";

    this.whereNodes.push(
      new WhereNode(
        column as string,
        "or",
        false,
        isPg ? ("~" as BinaryOperatorType) : "regexp",
        regexp.source,
      ),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT REGEXP condition to the query.
   * @mssql doesn't support REGEXP syntax
   * @sqlite doesn't support REGEXP syntax
   */
  whereNotRegexp(column: ModelKey<T>, regexp: RegExp): this;
  whereNotRegexp<S extends string>(
    column: SelectableColumn<S>,
    regexp: RegExp,
  ): this;
  whereNotRegexp(
    column: ModelKey<T> | SelectableColumn<string>,
    regexp: RegExp,
  ): this {
    const isPg = this.sqlDataSource.getDbType() === "postgres";
    this.whereNodes.push(
      new WhereNode(
        column as string,
        "and",
        true,
        isPg ? ("~" as BinaryOperatorType) : "regexp",
        regexp.source,
      ),
    );
    return this;
  }

  /**
   * @description Adds an AND WHERE NOT REGEXP condition to the query.
   * @mssql doesn't support REGEXP syntax
   * @sqlite doesn't support REGEXP syntax
   */
  andWhereNotRegexp(column: ModelKey<T>, regexp: RegExp): this;
  andWhereNotRegexp<S extends string>(
    column: SelectableColumn<S>,
    regexp: RegExp,
  ): this;
  andWhereNotRegexp(
    column: ModelKey<T> | SelectableColumn<string>,
    regexp: RegExp,
  ): this {
    const isPg = this.sqlDataSource.getDbType() === "postgres";
    this.whereNodes.push(
      new WhereNode(
        column as string,
        "and",
        true,
        isPg ? ("~" as BinaryOperatorType) : "regexp",
        regexp.source,
      ),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT REGEXP condition to the query.
   * @mssql doesn't support REGEXP syntax
   * @sqlite doesn't support REGEXP syntax
   */
  orWhereNotRegexp(column: ModelKey<T>, regexp: RegExp): this;
  orWhereNotRegexp<S extends string>(
    column: SelectableColumn<S>,
    regexp: RegExp,
  ): this;
  orWhereNotRegexp(
    column: ModelKey<T> | SelectableColumn<string>,
    regexp: RegExp,
  ): this {
    const isPg = this.sqlDataSource.getDbType() === "postgres";
    this.whereNodes.push(
      new WhereNode(
        column as string,
        "or",
        true,
        isPg ? ("~" as BinaryOperatorType) : "regexp",
        regexp.source,
      ),
    );
    return this;
  }

  /**
   * @description Adds a AND WHERE EXISTS condition to the query. By default uses the same table, you can use the `from` method to change the table.
   */
  whereExists(
    cbOrQueryBuilder: (queryBuilder: QueryBuilder<T>) => void | QueryBuilder<T>,
  ): this {
    return this.andWhereExists(cbOrQueryBuilder);
  }

  /**
   * @description Adds a AND WHERE EXISTS condition to the query. By default uses the same table, you can use the `from` method to change the table.
   */
  andWhereExists(
    cbOrQueryBuilder: (queryBuilder: QueryBuilder<T>) => void | QueryBuilder<T>,
  ): this {
    const nestedBuilder =
      cbOrQueryBuilder instanceof QueryBuilder
        ? cbOrQueryBuilder
        : new QueryBuilder(this.model, this.sqlDataSource);

    (nestedBuilder as WhereQueryBuilder<T>).isNestedCondition = true;
    if (typeof cbOrQueryBuilder === "function") {
      cbOrQueryBuilder(nestedBuilder as QueryBuilder<T>);
    }

    this.whereNodes.push(
      new WhereSubqueryNode(
        "",
        "exists",
        nestedBuilder.extractQueryNodes(),
        "and",
      ),
    );

    return this;
  }

  /**
   * @description Adds a OR WHERE EXISTS condition to the query. By default uses the same table, you can use the `from` method to change the table.
   */
  orWhereExists(
    cbOrQueryBuilder: (queryBuilder: QueryBuilder<T>) => void | QueryBuilder<T>,
  ): this {
    const nestedBuilder =
      cbOrQueryBuilder instanceof QueryBuilder
        ? cbOrQueryBuilder
        : new QueryBuilder(this.model, this.sqlDataSource);

    (nestedBuilder as WhereQueryBuilder<T>).isNestedCondition = true;
    if (typeof cbOrQueryBuilder === "function") {
      cbOrQueryBuilder(nestedBuilder as QueryBuilder<T>);
    }

    this.whereNodes.push(
      new WhereSubqueryNode(
        "",
        "exists",
        nestedBuilder.extractQueryNodes(),
        "or",
      ),
    );

    return this;
  }

  /**
   * @description Adds a WHERE NOT EXISTS condition to the query. By default uses the same table, you can use the `from` method to change the table.
   */
  whereNotExists(
    cbOrQueryBuilder: (queryBuilder: QueryBuilder<T>) => void | QueryBuilder<T>,
  ): this {
    return this.andWhereNotExists(cbOrQueryBuilder);
  }

  /**
   * @description Adds a WHERE NOT EXISTS condition to the query. By default uses the same table, you can use the `from` method to change the table.
   */
  andWhereNotExists(
    cbOrQueryBuilder: (queryBuilder: QueryBuilder<T>) => void | QueryBuilder<T>,
  ): this {
    const nestedBuilder =
      cbOrQueryBuilder instanceof QueryBuilder
        ? cbOrQueryBuilder
        : new QueryBuilder(this.model, this.sqlDataSource);

    (nestedBuilder as WhereQueryBuilder<T>).isNestedCondition = true;
    if (typeof cbOrQueryBuilder === "function") {
      cbOrQueryBuilder(nestedBuilder as QueryBuilder<T>);
    }

    this.whereNodes.push(
      new WhereSubqueryNode(
        "",
        "not exists",
        nestedBuilder.extractQueryNodes(),
        "and",
      ),
    );

    return this;
  }

  /**
   * @description Adds a WHERE NOT EXISTS condition to the query. By default uses the same table, you can use the `from` method to change the table.
   */
  orWhereNotExists(
    cbOrQueryBuilder: (queryBuilder: QueryBuilder<T>) => void | QueryBuilder<T>,
  ): this {
    const nestedBuilder =
      cbOrQueryBuilder instanceof QueryBuilder
        ? cbOrQueryBuilder
        : new QueryBuilder(this.model, this.sqlDataSource);

    (nestedBuilder as WhereQueryBuilder<T>).isNestedCondition = true;
    if (typeof cbOrQueryBuilder === "function") {
      cbOrQueryBuilder(nestedBuilder as QueryBuilder<T>);
    }

    this.whereNodes.push(
      new WhereSubqueryNode(
        "",
        "not exists",
        nestedBuilder.extractQueryNodes(),
        "or",
      ),
    );

    return this;
  }

  /**
   * @description Adds a raw WHERE condition to the query.
   */
  whereRaw(query: string, queryParams: any[] = []) {
    return this.andWhereRaw(query, queryParams);
  }

  /**
   * @description Adds a raw AND WHERE condition to the query.
   */
  andWhereRaw(query: string, queryParams: any[] = []) {
    this.whereNodes.push(
      new WhereNode(query, "and", false, "=", queryParams, true),
    );
    return this;
  }

  /**
   * @description Adds a raw OR WHERE condition to the query.
   */
  orWhereRaw(query: string, queryParams: any[] = []) {
    this.whereNodes.push(
      new WhereNode(query, "or", false, "=", queryParams, true),
    );
    return this;
  }

  /**
   * @description Adds a HAVING condition to the query.
   */
  having<K extends ModelKey<T>>(column: K, value: WhereColumnValue<T, K>): this;
  having<K extends ModelKey<T>>(
    column: K,
    operator: BinaryOperatorType,
    value: WhereColumnValue<T, K>,
  ): this;
  having(column: `${string}.${string}`, value: any): this;
  having(
    column: `${string}.${string}`,
    operator: BinaryOperatorType,
    value: any,
  ): this;
  having(
    column: ModelKey<T> | SelectableColumn<string>,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    return this.andHaving(
      column as ModelKey<T>,
      operatorOrValue as BinaryOperatorType,
      value,
    );
  }

  /**
   * @description Adds an AND HAVING condition to the query.
   */
  andHaving<K extends ModelKey<T>>(
    column: K,
    value: WhereColumnValue<T, K>,
  ): this;
  andHaving<K extends ModelKey<T>>(
    column: K,
    operator: BinaryOperatorType,
    value: WhereColumnValue<T, K>,
  ): this;
  andHaving(column: `${string}.${string}`, value: any): this;
  andHaving(
    column: `${string}.${string}`,
    operator: BinaryOperatorType,
    value: any,
  ): this;
  andHaving(
    column: ModelKey<T>,
    operator: BinaryOperatorType,
    value: any,
  ): this;
  andHaving(
    column: ModelKey<T> | SelectableColumn<string>,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value as BaseValues;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.havingNodes.push(
      new HavingNode(
        column as string,
        "and",
        false,
        operator as any,
        actualValue as any,
      ),
    );
    return this;
  }

  /**
   * @description Adds an OR HAVING condition to the query.
   */
  orHaving<K extends ModelKey<T>>(
    column: K,
    value: WhereColumnValue<T, K>,
  ): this;
  orHaving<K extends ModelKey<T>>(
    column: K,
    operator: BinaryOperatorType,
    value: WhereColumnValue<T, K>,
  ): this;
  orHaving(column: `${string}.${string}`, value: any): this;
  orHaving(
    column: `${string}.${string}`,
    operator: BinaryOperatorType,
    value: any,
  ): this;
  orHaving(
    column: ModelKey<T> | SelectableColumn<string>,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    this.havingNodes.push(
      new HavingNode(
        column as string,
        "or",
        false,
        operator as any,
        actualValue as any,
      ),
    );
    return this;
  }

  /**
   * @description Adds a raw HAVING condition to the query.
   */
  havingRaw(query: string): this {
    return this.andHavingRaw(query);
  }

  /**
   * @description Adds a raw OR HAVING condition to the query.
   */
  andHavingRaw(query: string): this {
    this.havingNodes.push(new HavingNode(query, "and", false, "=", [], true));

    return this;
  }

  /**
   * @description Adds a raw OR HAVING condition to the query.
   */
  orHavingRaw(query: string): this {
    this.havingNodes.push(new HavingNode(query, "or", false, "=", [], true));

    return this;
  }

  private buildSubQuery(
    subQueryOrCb: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): QueryBuilder<T> {
    if (subQueryOrCb instanceof QueryBuilder) {
      return subQueryOrCb;
    }
    const subQuery = new QueryBuilder(this.model, this.sqlDataSource);
    (subQueryOrCb as (qb: QueryBuilder<T>) => void)(subQuery);
    return subQuery;
  }

  private andWhereSubQuery(
    column: string,
    operator: SubqueryOperatorType,
    subQueryOrCb: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    const subQuery = this.buildSubQuery(subQueryOrCb);
    this.whereNodes.push(
      new WhereSubqueryNode(
        column,
        operator,
        (subQuery as any).extractQueryNodes(),
        "and",
      ),
    );
    return this;
  }

  private orWhereSubQuery(
    column: string,
    operator: SubqueryOperatorType,
    subQueryOrCb: QueryBuilder<T> | ((subQuery: QueryBuilder<T>) => void),
  ): this {
    const subQuery = this.buildSubQuery(subQueryOrCb);
    this.whereNodes.push(
      new WhereSubqueryNode(
        column,
        operator,
        (subQuery as any).extractQueryNodes(),
        "or",
      ),
    );
    return this;
  }

  private andWhereGroup(
    cb: (queryBuilder: WhereQueryBuilder<T>) => void,
  ): this {
    const nestedBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    (nestedBuilder as any).isNestedCondition = true;
    cb(nestedBuilder as unknown as WhereQueryBuilder<T>);
    const whereGroupNode = new WhereGroupNode(
      (nestedBuilder as any).whereNodes,
      "and",
    );
    this.whereNodes.push(whereGroupNode);
    return this;
  }

  private orWhereGroup(cb: (queryBuilder: WhereQueryBuilder<T>) => void): this {
    const nestedBuilder = new QueryBuilder(this.model, this.sqlDataSource);
    (nestedBuilder as any).isNestedCondition = true;
    cb(nestedBuilder as unknown as WhereQueryBuilder<T>);
    const whereGroupNode = new WhereGroupNode(
      (nestedBuilder as any).whereNodes,
      "or",
    );
    this.whereNodes.push(whereGroupNode);
    return this;
  }
}
