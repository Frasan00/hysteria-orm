import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import whereJsonTemplate, { JsonParam } from "../resources/query/WHEREJSON";
import { SqlDataSource } from "../sql_data_source";
import { WhereQueryBuilder } from "./where_query_builder";

export class JsonQueryBuilder<T extends Model> extends WhereQueryBuilder<T> {
  private whereJsonTemplate: ReturnType<typeof whereJsonTemplate>;

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.whereJsonTemplate = whereJsonTemplate(
      sqlDataSource.getDbType(),
      model,
    );
  }

  /**
   * @description Filters records matching exact JSON value.
   */
  whereJson(column: ModelKey<T>, value: JsonParam): this;
  whereJson(column: string, value: JsonParam): this;
  whereJson(column: ModelKey<T> | string, value: JsonParam): this {
    return this.andWhereJson(column as string, value);
  }

  /**
   * @description Filters records matching any JSON value.
   */
  andWhereJson(column: ModelKey<T>, value: JsonParam): this;
  andWhereJson(column: string, value: JsonParam): this;
  andWhereJson(column: ModelKey<T> | string, value: JsonParam): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.andWhereJson(
        column as string,
        value,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereJsonTemplate.whereJson(
      column as string,
      value,
    );

    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records matching any JSON value.
   */
  orWhereJson(column: ModelKey<T>, value: JsonParam): this;
  orWhereJson(column: string, value: JsonParam): this;
  orWhereJson(column: ModelKey<T> | string, value: JsonParam): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.orWhereJson(
        column as string,
        value,
      );

      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }

    const { query, params } = this.whereJsonTemplate.whereJson(
      column as string,
      value,
    );

    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column does NOT contain the given value.
   */
  whereJsonNotContains(column: ModelKey<T>, value: JsonParam): this;
  whereJsonNotContains(column: string, value: JsonParam): this;
  whereJsonNotContains(column: ModelKey<T> | string, value: JsonParam): this {
    return this.andWhereJsonNotContains(column as string, value);
  }

  /**
   * @description Filters records where JSON column does NOT contain the given value (AND).
   */
  andWhereJsonNotContains(column: ModelKey<T>, value: JsonParam): this;
  andWhereJsonNotContains(column: string, value: JsonParam): this;
  andWhereJsonNotContains(
    column: ModelKey<T> | string,
    value: JsonParam,
  ): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.andWhereJsonNotContains(
        column as string,
        value,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereJsonNotContains(
      column as string,
      value,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column does NOT contain the given value (OR).
   */
  orWhereJsonNotContains(column: ModelKey<T>, value: JsonParam): this;
  orWhereJsonNotContains(column: string, value: JsonParam): this;
  orWhereJsonNotContains(column: ModelKey<T> | string, value: JsonParam): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.orWhereJsonNotContains(
        column as string,
        value,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereJsonNotContains(
      column as string,
      value,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column contains the given value.
   */
  whereJsonContains(column: ModelKey<T>, value: JsonParam): this;
  whereJsonContains(column: string, value: JsonParam): this;
  whereJsonContains(column: ModelKey<T> | string, value: JsonParam): this {
    return this.andWhereJsonContains(column as string, value);
  }

  /**
   * @description Filters records where JSON column contains the given value (AND).
   */
  andWhereJsonContains(column: ModelKey<T>, value: JsonParam): this;
  andWhereJsonContains(column: string, value: JsonParam): this;
  andWhereJsonContains(column: ModelKey<T> | string, value: JsonParam): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.andWhereJsonContains(
        column as string,
        value,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereJsonContains(
      column as string,
      value,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column contains the given value (OR).
   */
  orWhereJsonContains(column: ModelKey<T>, value: JsonParam): this;
  orWhereJsonContains(column: string, value: JsonParam): this;
  orWhereJsonContains(column: ModelKey<T> | string, value: JsonParam): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.orWhereJsonContains(
        column as string,
        value,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereJsonContains(
      column as string,
      value,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column does NOT match the given value.
   */
  whereNotJson(column: ModelKey<T>, value: JsonParam): this;
  whereNotJson(column: string, value: JsonParam): this;
  whereNotJson(column: ModelKey<T> | string, value: JsonParam): this {
    return this.andWhereNotJson(column as string, value);
  }

  /**
   * @description Filters records where JSON column does NOT match the given value (AND).
   */
  andWhereNotJson(column: ModelKey<T>, value: JsonParam): this;
  andWhereNotJson(column: string, value: JsonParam): this;
  andWhereNotJson(column: ModelKey<T> | string, value: JsonParam): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.andWhereNotJson(
        column as string,
        value,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereNotJson(
      column as string,
      value,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column does NOT match the given value (OR).
   */
  orWhereNotJson(column: ModelKey<T>, value: JsonParam): this;
  orWhereNotJson(column: string, value: JsonParam): this;
  orWhereNotJson(column: ModelKey<T> | string, value: JsonParam): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.orWhereNotJson(
        column as string,
        value,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereNotJson(
      column as string,
      value,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column matches any of the given values.
   */
  whereJsonIn(column: ModelKey<T>, values: JsonParam[]): this;
  whereJsonIn(column: string, values: JsonParam[]): this;
  whereJsonIn(column: ModelKey<T> | string, values: JsonParam[]): this {
    return this.andWhereJsonIn(column as string, values);
  }

  /**
   * @description Filters records where JSON column matches any of the given values (AND).
   */
  andWhereJsonIn(column: ModelKey<T>, values: JsonParam[]): this;
  andWhereJsonIn(column: string, values: JsonParam[]): this;
  andWhereJsonIn(column: ModelKey<T> | string, values: JsonParam[]): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.andWhereJsonIn(
        column as string,
        values,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereJsonIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column matches any of the given values (OR).
   */
  orWhereJsonIn(column: ModelKey<T>, values: JsonParam[]): this;
  orWhereJsonIn(column: string, values: JsonParam[]): this;
  orWhereJsonIn(column: ModelKey<T> | string, values: JsonParam[]): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.orWhereJsonIn(
        column as string,
        values,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereJsonIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column does NOT match any of the given values.
   */
  whereJsonNotIn(column: ModelKey<T>, values: JsonParam[]): this;
  whereJsonNotIn(column: string, values: JsonParam[]): this;
  whereJsonNotIn(column: ModelKey<T> | string, values: JsonParam[]): this {
    return this.andWhereJsonNotIn(column as string, values);
  }

  /**
   * @description Filters records where JSON column does NOT match any of the given values (AND).
   */
  andWhereJsonNotIn(column: ModelKey<T>, values: JsonParam[]): this;
  andWhereJsonNotIn(column: string, values: JsonParam[]): this;
  andWhereJsonNotIn(column: ModelKey<T> | string, values: JsonParam[]): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.andWhereJsonNotIn(
        column as string,
        values,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereJsonNotIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Filters records where JSON column does NOT match any of the given values (OR).
   */
  orWhereJsonNotIn(column: ModelKey<T>, values: JsonParam[]): this;
  orWhereJsonNotIn(column: string, values: JsonParam[]): this;
  orWhereJsonNotIn(column: ModelKey<T> | string, values: JsonParam[]): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params } = this.whereJsonTemplate.orWhereJsonNotIn(
        column as string,
        values,
      );
      this.whereQuery += query;
      this.params.push(...params);
      return this;
    }
    const { query, params } = this.whereJsonTemplate.whereJsonNotIn(
      column as string,
      values,
    );
    this.whereQuery += query;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Add a raw JSON filter expression.
   */
  whereJsonRaw(raw: string, params?: any[]): this {
    return this.andWhereJsonRaw(raw, params);
  }

  /**
   * @description Add a raw JSON filter expression (AND).
   */
  andWhereJsonRaw(raw: string, params?: any[]): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params: p } = this.whereJsonTemplate.andWhereJsonRaw(
        raw,
        params,
      );
      this.whereQuery += query;
      this.params.push(...p);
      return this;
    }
    const { query, params: p } = this.whereJsonTemplate.whereJsonRaw(
      raw,
      params,
    );
    this.whereQuery += query;
    this.params.push(...p);
    return this;
  }

  /**
   * @description Add a raw JSON filter expression (OR).
   */
  orWhereJsonRaw(raw: string, params?: any[]): this {
    if (this.whereQuery || this.isNestedCondition) {
      const { query, params: p } = this.whereJsonTemplate.orWhereJsonRaw(
        raw,
        params,
      );
      this.whereQuery += query;
      this.params.push(...p);
      return this;
    }
    const { query, params: p } = this.whereJsonTemplate.whereJsonRaw(
      raw,
      params,
    );
    this.whereQuery += query;
    this.params.push(...p);
    return this;
  }
}
