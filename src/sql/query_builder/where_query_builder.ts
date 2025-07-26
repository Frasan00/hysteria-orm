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
  where(column: string, operator: BinaryOperatorType, value: BaseValues): this;
  where(column: ModelKey<T> | string, value: BaseValues): this;
  where(
    column: ModelKey<T> | string,
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
    column: string,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  andWhere(column: ModelKey<T> | string, value: BaseValues): this;
  andWhere(
    column: ModelKey<T> | string,
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
  orWhere(
    column: string,
    operator: BinaryOperatorType,
    value: BaseValues,
  ): this;
  orWhere(column: ModelKey<T> | string, value: BaseValues): this;
  orWhere(
    column: ModelKey<T> | string,
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
  whereBetween(column: string, min: BaseValues, max: BaseValues): this;
  whereBetween(
    column: ModelKey<T> | string,
    min: BaseValues,
    max: BaseValues,
  ): this {
    return this.andWhereBetween(column as ModelKey<T>, min, max);
  }

  /**
   * @description Adds an AND WHERE BETWEEN condition to the query.
   */
  andWhereBetween(column: ModelKey<T>, min: BaseValues, max: BaseValues): this;
  andWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
  andWhereBetween(
    column: ModelKey<T> | string,
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
  orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
  orWhereBetween(
    column: ModelKey<T> | string,
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
  whereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
  whereNotBetween(
    column: ModelKey<T> | string,
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
  andWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
  andWhereNotBetween(
    column: ModelKey<T> | string,
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
  orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this;
  orWhereNotBetween(
    column: ModelKey<T> | string,
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
  whereLike(column: string, value: string): this;
  whereLike(column: ModelKey<T> | string, value: string): this {
    return this.andWhereLike(column as ModelKey<T>, value);
  }

  /**
   * @description Adds an AND WHERE LIKE condition to the query.
   */
  andWhereLike(column: ModelKey<T>, value: string): this;
  andWhereLike(column: string, value: string): this;
  andWhereLike(column: ModelKey<T> | string, value: string): this {
    this.where(column as string, "like", value);
    return this;
  }

  /**
   * @description Adds an OR WHERE LIKE condition to the query.
   */
  orWhereLike(column: ModelKey<T>, value: string): this;
  orWhereLike(column: string, value: string): this;
  orWhereLike(column: ModelKey<T> | string, value: string): this {
    this.orWhere(column as string, "like", value);
    return this;
  }

  /**
   * @description Adds a WHERE ILIKE condition to the query.
   */
  whereILike(column: ModelKey<T>, value: string): this;
  whereILike(column: string, value: string): this;
  whereILike(column: ModelKey<T> | string, value: string): this {
    return this.andWhereILike(column as ModelKey<T>, value);
  }

  /**
   * @description Adds an AND WHERE ILIKE condition to the query.
   */
  andWhereILike(column: ModelKey<T>, value: string): this;
  andWhereILike(column: string, value: string): this;
  andWhereILike(column: ModelKey<T> | string, value: string): this {
    this.where(column as string, "ilike", value);
    return this;
  }

  /**
   * @description Adds an OR WHERE ILIKE condition to the query.
   */
  orWhereILike(column: ModelKey<T>, value: string): this;
  orWhereILike(column: string, value: string): this;
  orWhereILike(column: ModelKey<T> | string, value: string): this {
    this.orWhere(column as string, "ilike", value);
    return this;
  }

  /**
   * @description Adds a WHERE NOT LIKE condition to the query.
   */
  whereNotLike(column: ModelKey<T>, value: string): this;
  whereNotLike(column: string, value: string): this;
  whereNotLike(column: ModelKey<T> | string, value: string): this {
    return this.andWhereNotLike(column as ModelKey<T>, value);
  }

  /**
   * @description Adds an AND WHERE NOT LIKE condition to the query.
   */
  andWhereNotLike(column: ModelKey<T>, value: string): this;
  andWhereNotLike(column: string, value: string): this;
  andWhereNotLike(column: ModelKey<T> | string, value: string): this {
    this.where(column as string, "not like", value);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT LIKE condition to the query.
   */
  orWhereNotLike(column: ModelKey<T>, value: string): this;
  orWhereNotLike(column: string, value: string): this;
  orWhereNotLike(column: ModelKey<T> | string, value: string): this {
    this.orWhere(column as string, "not like", value);
    return this;
  }

  /**
   * @description Adds a WHERE NOT ILIKE condition to the query.
   */
  whereNotILike(column: ModelKey<T>, value: string): this;
  whereNotILike(column: string, value: string): this;
  whereNotILike(column: ModelKey<T> | string, value: string): this {
    return this.andWhereNotILike(column as ModelKey<T>, value);
  }

  /**
   * @description Adds an AND WHERE NOT ILIKE condition to the query.
   */
  andWhereNotILike(column: ModelKey<T>, value: string): this;
  andWhereNotILike(column: string, value: string): this;
  andWhereNotILike(column: ModelKey<T> | string, value: string): this {
    this.where(column as string, "not ilike", value);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT ILIKE condition to the query.
   */
  orWhereNotILike(column: ModelKey<T>, value: string): this;
  orWhereNotILike(column: string, value: string): this;
  orWhereNotILike(column: ModelKey<T> | string, value: string): this {
    this.orWhere(column as string, "not ilike", value);
    return this;
  }

  /**
   * @description Adds a WHERE IN condition to the query.
   * @warning If the array is empty, it will add an impossible condition.
   */
  whereIn(column: ModelKey<T>, values: BaseValues[]): this;
  whereIn(column: string, values: BaseValues[]): this;
  whereIn(column: ModelKey<T> | string, values: BaseValues[]): this {
    return this.andWhereIn(column as ModelKey<T>, values);
  }

  /**
   * @description Adds an AND WHERE IN condition to the query.
   * @warning If the array is empty, it will add an impossible condition.
   */
  andWhereIn(column: ModelKey<T>, values: BaseValues[]): this;
  andWhereIn(column: string, values: BaseValues[]): this;
  andWhereIn(column: ModelKey<T> | string, values: BaseValues[]): this {
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
  orWhereIn(column: string, values: BaseValues[]): this;
  orWhereIn(column: ModelKey<T> | string, values: BaseValues[]): this {
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
  whereNotIn(column: string, values: BaseValues[]): this;
  whereNotIn(column: ModelKey<T> | string, values: BaseValues[]): this {
    return this.andWhereNotIn(column as ModelKey<T>, values);
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   * @warning If the array is empty, it will add an obvious condition to make it true.
   */
  andWhereNotIn(column: ModelKey<T>, values: BaseValues[]): this;
  andWhereNotIn(column: string, values: BaseValues[]): this;
  andWhereNotIn(column: ModelKey<T> | string, values: BaseValues[]): this {
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
  orWhereNotIn(column: string, values: BaseValues[]): this;
  orWhereNotIn(column: ModelKey<T> | string, values: BaseValues[]): this {
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
  whereNull(column: string): this;
  whereNull(column: ModelKey<T> | string): this {
    return this.andWhereNull(column as ModelKey<T>);
  }

  /**
   * @description Adds an AND WHERE NULL condition to the query.
   */
  andWhereNull(column: ModelKey<T>): this;
  andWhereNull(column: string): this;
  andWhereNull(column: ModelKey<T> | string): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "is null", undefined),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NULL condition to the query.
   */
  orWhereNull(column: ModelKey<T>): this;
  orWhereNull(column: string): this;
  orWhereNull(column: ModelKey<T> | string): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "is null", undefined),
    );
    return this;
  }

  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   */
  whereNotNull(column: ModelKey<T>): this;
  whereNotNull(column: string): this;
  whereNotNull(column: ModelKey<T> | string): this {
    return this.andWhereNotNull(column as ModelKey<T>);
  }

  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   */
  andWhereNotNull(column: ModelKey<T>): this;
  andWhereNotNull(column: string): this;
  andWhereNotNull(column: ModelKey<T> | string): this {
    this.whereNodes.push(
      new WhereNode(column as string, "and", false, "is not null", undefined),
    );
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   */
  orWhereNotNull(column: ModelKey<T>): this;
  orWhereNotNull(column: string): this;
  orWhereNotNull(column: ModelKey<T> | string): this {
    this.whereNodes.push(
      new WhereNode(column as string, "or", false, "is not null", undefined),
    );
    return this;
  }

  /**
   * @description Adds a WHERE REGEXP condition to the query.
   */
  whereRegexp(column: ModelKey<T>, regexp: RegExp): this;
  whereRegexp(column: string, regexp: RegExp): this;
  whereRegexp(column: ModelKey<T> | string, regexp: RegExp): this {
    return this.andWhereRegexp(column as ModelKey<T>, regexp);
  }

  /**
   * @description Adds an AND WHERE REGEXP condition to the query.
   */
  andWhereRegexp(column: ModelKey<T>, regexp: RegExp): this;
  andWhereRegexp(column: string, regexp: RegExp): this;
  andWhereRegexp(column: ModelKey<T> | string, regexp: RegExp): this {
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
  orWhereRegexp(column: string, regexp: RegExp): this;
  orWhereRegexp(column: ModelKey<T> | string, regexp: RegExp): this {
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
  whereNotRegexp(column: string, regexp: RegExp): this;
  whereNotRegexp(column: ModelKey<T> | string, regexp: RegExp): this {
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
  andWhereNotRegexp(column: string, regexp: RegExp): this;
  andWhereNotRegexp(column: ModelKey<T> | string, regexp: RegExp): this {
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
  orWhereNotRegexp(column: string, regexp: RegExp): this;
  orWhereNotRegexp(column: ModelKey<T> | string, regexp: RegExp): this {
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
  rawWhere(query: string, queryParams: any[] = []) {
    return this.rawAndWhere(query, queryParams);
  }

  /**
   * @description Adds a raw AND WHERE condition to the query.
   */
  rawAndWhere(query: string, queryParams: any[] = []) {
    this.whereNodes.push(
      new WhereNode(query, "and", false, "=", queryParams, true),
    );
    return this;
  }

  /**
   * @description Adds a raw OR WHERE condition to the query.
   */
  rawOrWhere(query: string, queryParams: any[] = []) {
    this.whereNodes.push(
      new WhereNode(query, "or", false, "=", queryParams, true),
    );
    return this;
  }

  /**
   * @description Adds a HAVING condition to the query.
   */
  having(column: string, value: any): this;
  having(column: string, operator: BinaryOperatorType, value: any): this;
  having(
    column: string,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    return this.andHaving(column, operatorOrValue as BinaryOperatorType, value);
  }

  /**
   * @description Adds an AND HAVING condition to the query.
   */
  andHaving(column: string, value: any): this;
  andHaving(column: string, operator: BinaryOperatorType, value: any): this;
  andHaving(
    column: string,
    operatorOrValue: BinaryOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    return this.having(column, operatorOrValue as BinaryOperatorType, value);
  }

  /**
   * @description Adds an OR HAVING condition to the query.
   */
  orHaving(column: string, value: any): this;
  orHaving(column: string, operator: BinaryOperatorType, value: any): this;
  orHaving(
    column: string,
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
      new HavingNode(column, "or", false, operator as any, actualValue as any),
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
