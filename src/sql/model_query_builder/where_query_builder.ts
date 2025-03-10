import { Model } from "../models/model";
import type { ModelKey } from "../models/model_manager/model_manager_types";
import whereTemplate, {
  BaseValues,
  BinaryOperatorType,
} from "../resources/query/WHERE";
import { SqlDataSource } from "../sql_data_source";
import { JoinQueryBuilder } from "./join_query_builder";

export abstract class WhereQueryBuilder<
  T extends Model,
> extends JoinQueryBuilder<T> {
  protected whereQuery: string = "";
  protected params: BaseValues[] = [];
  protected table: string;
  protected whereTemplate: ReturnType<typeof whereTemplate>;
  protected isNestedCondition = false;

  constructor(
    model: typeof Model,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
  ) {
    super(model, sqlDataSource);
    this.model = model;
    this.sqlDataSource = sqlDataSource;
    this.logs = this.sqlDataSource.logs;
    this.table = this.model.table;
    this.whereTemplate = whereTemplate(
      this.sqlDataSource.getDbType(),
      this.model,
    );

    this.params = [];
    this.isNestedCondition = isNestedCondition;
  }

  /**
   * @description Accepts a value and executes a callback only of the value is not null or undefined.
   */
  when(value: any, cb: (value: any, query: this) => void): this {
    if (value === undefined || value === null) {
      return this;
    }

    cb(value, this);
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
    let operator: BinaryOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue as BinaryOperatorType;
      actualValue = value;
    } else {
      actualValue = operatorOrValue as BaseValues;
      operator = "=";
    }

    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereTemplate.andWhere(
        column as string,
        actualValue,
        operator,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.where(
      column as string,
      actualValue,
      operator,
    );
    this.whereQuery = query;
    this.params.push(...params);
    return this;
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

    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.where(
        column as string,
        actualValue,
        operator,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhere(
      column as string,
      actualValue,
      operator,
    );
    this.whereQuery += query;
    this.params.push(...params);
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

    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.where(
        column as string,
        actualValue,
        operator,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhere(
      column as string,
      actualValue,
      operator,
    );
    this.whereQuery += query;
    this.params.push(...params);
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
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
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
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
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
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
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
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNotBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
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
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotBetween(
        column as string,
        min,
        max,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereNotBetween(
      column as string,
      min,
      max,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE IN condition to the query.
   */
  whereIn(column: ModelKey<T>, values: BaseValues[]): this;
  whereIn(column: string, values: BaseValues[]): this;
  whereIn(column: ModelKey<T> | string, values: BaseValues[]): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an AND WHERE IN condition to the query.
   */
  andWhereIn(column: ModelKey<T>, values: BaseValues[]): this;
  andWhereIn(column: string, values: BaseValues[]): this;
  andWhereIn(column: ModelKey<T> | string, values: BaseValues[]): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE IN condition to the query.
   */
  orWhereIn(column: ModelKey<T>, values: BaseValues[]): this;
  orWhereIn(column: string, values: BaseValues[]): this;
  orWhereIn(column: ModelKey<T> | string, values: BaseValues[]): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE NOT IN condition to the query.
   */
  whereNotIn(column: ModelKey<T>, values: BaseValues[]): this;
  whereNotIn(column: string, values: BaseValues[]): this;
  whereNotIn(column: ModelKey<T> | string, values: BaseValues[]): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNotIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT IN condition to the query.
   */
  orWhereNotIn(column: ModelKey<T>, values: BaseValues[]): this;
  orWhereNotIn(column: string, values: BaseValues[]): this;
  orWhereNotIn(column: ModelKey<T> | string, values: BaseValues[]): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotIn(
        column as string,
        values,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereNotIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE NULL condition to the query.
   */
  whereNull(column: ModelKey<T>): this;
  whereNull(column: string): this;
  whereNull(column: ModelKey<T> | string): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNull(column as string);
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNull(column as string);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an AND WHERE NULL condition to the query.
   */
  andWhereNull(column: ModelKey<T>): this;
  andWhereNull(column: string): this;
  andWhereNull(column: ModelKey<T> | string): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNull(column as string);
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNull(column as string);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE NULL condition to the query.
   */
  orWhereNull(column: ModelKey<T>): this;
  orWhereNull(column: string): this;
  orWhereNull(column: ModelKey<T> | string): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNull(column as string);
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereNull(column as string);
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE NOT NULL condition to the query.
   */
  whereNotNull(column: ModelKey<T>): this;
  whereNotNull(column: string): this;
  whereNotNull(column: ModelKey<T> | string): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotNull(
        column as string,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNotNull(
      column as string,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an AND WHERE NOT NULL condition to the query.
   */
  andWhereNotNull(column: ModelKey<T>): this;
  andWhereNotNull(column: string): this;
  andWhereNotNull(column: ModelKey<T> | string): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotNull(
        column as string,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereNotNull(
      column as string,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE NOT NULL condition to the query.
   */
  orWhereNotNull(column: ModelKey<T>): this;
  orWhereNotNull(column: string): this;
  orWhereNotNull(column: ModelKey<T> | string): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereNotNull(
        column as string,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereNotNull(
      column as string,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a WHERE REGEXP condition to the query.
   */
  whereRegexp(column: ModelKey<T>, regexp: RegExp): this;
  whereRegexp(column: string, regexp: RegExp): this;
  whereRegexp(column: ModelKey<T> | string, regexp: RegExp): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereRegex(
        column as string,
        regexp,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereRegex(
      column as string,
      regexp,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an AND WHERE REGEXP condition to the query.
   */
  andWhereRegexp(column: ModelKey<T>, regexp: RegExp): this;
  andWhereRegexp(column: string, regexp: RegExp): this;
  andWhereRegexp(column: ModelKey<T> | string, regexp: RegExp): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereRegex(
        column as string,
        regexp,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.andWhereRegex(
      column as string,
      regexp,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds an OR WHERE REGEXP condition to the query.
   */
  orWhereRegexp(column: ModelKey<T>, regexp: RegExp): this;
  orWhereRegexp(column: string, regexp: RegExp): this;
  orWhereRegexp(column: ModelKey<T> | string, regexp: RegExp): this {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query, params } = this.whereTemplate.whereRegex(
        column as string,
        regexp,
      );
      this.whereQuery = query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereTemplate.orWhereRegex(
      column as string,
      regexp,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a raw WHERE condition to the query.
   */
  rawWhere(query: string, queryParams: any[] = []) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(
        query,
        queryParams,
      );
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(
      query,
      queryParams,
    );
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a raw AND WHERE condition to the query.
   */
  rawAndWhere(query: string, queryParams: any[] = []) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(
        query,
        queryParams,
      );
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(
      query,
      queryParams,
    );
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a raw OR WHERE condition to the query.
   */
  rawOrWhere(query: string, queryParams: any[] = []) {
    if (!this.whereQuery && !this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(
        query,
        queryParams,
      );
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(
      query,
      queryParams,
    );
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
}
