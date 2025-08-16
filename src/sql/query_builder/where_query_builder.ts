import { HavingNode } from "../ast/query/node/having";
import type {
  BaseValues,
  BinaryOperatorType,
} from "../ast/query/node/where/where";
import { WhereNode } from "../ast/query/node/where/where";
import { WhereGroupNode } from "../ast/query/node/where/where_group";
import { WhereSubqueryNode } from "../ast/query/node/where/where_subquery";
import { Model } from "../models/model";
import type { ModelKey } from "../models/model_manager/model_manager_types";
import { SqlDataSource } from "../sql_data_source";
import { SelectableColumn } from "./query_builder_types";
import { SelectQueryBuilder } from "./select_query_builder";

export abstract class WhereQueryBuilder<
  T extends Model,
> extends SelectQueryBuilder<T> {
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
   * @warning The value is checked for truthiness, so false, 0, "", etc. will be considered falsy.
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
  where(
    column: ModelKey<T>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  where<S extends string>(
    column: SelectableColumn<S>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  where(
    column: ModelKey<T> | SelectableColumn<string>,
    value: BaseValues,
  ): this;
  where(
    column: ModelKey<T> | SelectableColumn<string>,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    return this.andWhere(
      column as ModelKey<T>,
      operatorOrValue as BinaryOperatorType,
      value as BaseValues,
    );
  }

  /**
   * @description Adds an AND WHERE condition to the query.
   */
  andWhere(
    column: ModelKey<T>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  andWhere(
    column: SelectableColumn<string>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  andWhere(
    column: ModelKey<T> | SelectableColumn<string>,
    value: BaseValues,
  ): this;
  andWhere<S extends string>(
    column: ModelKey<T> | SelectableColumn<S>,
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

    this.whereNodes.push(
      new WhereNode(column as string, "and", false, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE condition to the query.
   */
  orWhere(
    column: ModelKey<T>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  orWhere<S extends string>(
    column: SelectableColumn<S>,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  orWhere<S extends string>(
    column: ModelKey<T> | SelectableColumn<S>,
    value: BaseValues,
  ): this;
  orWhere<S extends string>(
    column: ModelKey<T> | SelectableColumn<S>,
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

    this.whereNodes.push(
      new WhereNode(column as string, "or", false, operator, actualValue),
    );
    return this;
  }

  /**
   * @description Adds a WHERE BETWEEN condition to the query.
   */
  whereBetween(column: ModelKey<T>, min: BaseValues, max: BaseValues): this;
  whereBetween<S extends string>(
    column: SelectableColumn<S>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  whereBetween(
    column: ModelKey<T> | SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    return this.andWhereBetween(column as ModelKey<T>, min, max);
  }

  /**
   * @description Adds an AND WHERE BETWEEN condition to the query.
   */
  andWhereBetween(column: ModelKey<T>, min: BaseValues, max: BaseValues): this;
  andWhereBetween<S extends string>(
    column: SelectableColumn<S>,
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
  orWhereBetween(column: ModelKey<T>, min: BaseValues, max: BaseValues): this;
  orWhereBetween<S extends string>(
    column: SelectableColumn<S>,
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
  whereNotBetween(column: ModelKey<T>, min: BaseValues, max: BaseValues): this;
  whereNotBetween<S extends string>(
    column: SelectableColumn<S>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  whereNotBetween(
    column: ModelKey<T> | SelectableColumn<string>,
    min: BaseValues,
    max: BaseValues,
  ): this {
    return this.andWhereNotBetween(column as ModelKey<T>, min, max);
  }

  /**
   * @description Adds an AND WHERE NOT BETWEEN condition to the query.
   */
  andWhereNotBetween(
    column: ModelKey<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  andWhereNotBetween<S extends string>(
    column: SelectableColumn<S>,
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
  orWhereNotBetween(
    column: ModelKey<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  orWhereNotBetween<S extends string>(
    column: SelectableColumn<S>,
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
    this.where(column as string, "like", value);
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
    this.orWhere(column as string, "like", value);
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
    this.where(column as string, "ilike", value);
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
    this.orWhere(column as string, "ilike", value);
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
    this.where(column as string, "not like", value);
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
    this.orWhere(column as string, "not like", value);
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
    this.where(column as string, "not ilike", value);
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
    this.orWhere(column as string, "not ilike", value);
    return this;
  }

  /**
   * @description Adds a WHERE IN condition to the query.
   * @warning If the array is empty, it will add an impossible condition.
   */
  whereIn(column: ModelKey<T>, values: BaseValues[]): this;
  whereIn<S extends string>(
    column: SelectableColumn<S>,
    values: BaseValues[],
  ): this;
  whereIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values: BaseValues[],
  ): this {
    return this.andWhereIn(column as ModelKey<T>, values);
  }

  /**
   * @description Adds an AND WHERE IN condition to the query.
   * @warning If the array is empty, it will add an impossible condition.
   */
  andWhereIn(column: ModelKey<T>, values: BaseValues[]): this;
  andWhereIn<S extends string>(
    column: SelectableColumn<S>,
    values: BaseValues[],
  ): this;
  andWhereIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values: BaseValues[],
  ): this {
    if (!values.length) {
      this.whereNodes.push(new WhereNode("false", "and", true, "=", [], true));
      return this;
    }

    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "in", values),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE IN condition to the query.
   * @warning If the array is empty, it will add an impossible condition.
   */
  orWhereIn(column: ModelKey<T>, values: BaseValues[]): this;
  orWhereIn<S extends string>(
    column: SelectableColumn<S>,
    values: BaseValues[],
  ): this;
  orWhereIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values: BaseValues[],
  ): this {
    if (!values.length) {
      this.whereNodes.push(new WhereNode("false", "or", true, "=", [], true));
      return this;
    }

    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "in", values),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT IN condition to the query.
   * @warning If the array is empty, it will add an obvious condition to make it true.
   */
  whereNotIn(column: ModelKey<T>, values: BaseValues[]): this;
  whereNotIn<S extends string>(
    column: SelectableColumn<S>,
    values: BaseValues[],
  ): this;
  whereNotIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values: BaseValues[],
  ): this {
    return this.andWhereNotIn(column as ModelKey<T>, values);
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @warning If the array is empty, it will add an obvious condition to make it true.
   */
  andWhereNotIn(column: ModelKey<T>, values: BaseValues[]): this;
  andWhereNotIn<S extends string>(
    column: SelectableColumn<S>,
    values: BaseValues[],
  ): this;
  andWhereNotIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values: BaseValues[],
  ): this {
    if (!values.length) {
      this.whereNodes.push(new WhereNode("true", "and", true, "=", [], true));
      return this;
    }

    this.whereNodes.push(
      new WhereNode(column as string, "and", true, "in", values),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @warning If the array is empty, it will add an obvious condition to make it true.
   */
  orWhereNotIn(column: ModelKey<T>, values: BaseValues[]): this;
  orWhereNotIn<S extends string>(
    column: SelectableColumn<S>,
    values: BaseValues[],
  ): this;
  orWhereNotIn(
    column: ModelKey<T> | SelectableColumn<string>,
    values: BaseValues[],
  ): this {
    if (!values.length) {
      this.whereNodes.push(new WhereNode("true", "or", true, "=", [], true));
      return this;
    }

    this.whereNodes.push(
      new WhereNode(column as string, "or", true, "in", values),
    );
    return this;
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
  having<S extends string>(column: SelectableColumn<S>, value: any): this;
  having(column: ModelKey<T>, operator: BinaryOperatorType, value: any): this;
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
  andHaving<S extends string>(column: SelectableColumn<S>, value: any): this;
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
    return this.having(
      column as ModelKey<T>,
      operatorOrValue as BinaryOperatorType,
      value,
    );
  }

  /**
   * @description Adds an OR HAVING condition to the query.
   */
  orHaving<S extends string>(column: SelectableColumn<S>, value: any): this;
  orHaving(column: ModelKey<T>, operator: BinaryOperatorType, value: any): this;
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
}
