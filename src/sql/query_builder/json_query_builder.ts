import { WhereJsonNode } from "../ast/query/node/where";
import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import { WhereQueryBuilder } from "./where_query_builder";

type JsonParam = Record<string, unknown> | any[];

export class JsonQueryBuilder<
  T extends Model,
  S extends Record<string, any> = Record<string, any>,
> extends WhereQueryBuilder<T, S> {
  /**
   * @description Filters records matching exact JSON value.
   */
  whereJson(column: ModelKey<T>, value: JsonParam): this;
  whereJson(column: string, value: JsonParam): this;
  whereJson(column: ModelKey<T> | string, value: JsonParam): this {
    return this.andWhereJson(column as string, value);
  }

  /**
   * @description Filters records matching the given JSON value.
   * @mssql Partial JSON matching not supported - only exact matches work
   */
  andWhereJson(column: ModelKey<T>, value: JsonParam): this;
  andWhereJson(column: string, value: JsonParam): this;
  andWhereJson(column: ModelKey<T> | string, value: JsonParam): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "and",
        false,
        "contains",
        value as any,
      ),
    );
    return this;
  }

  /**
   * @description Filters records matching the given JSON value.
   * @mssql Partial JSON matching not supported - only exact matches work
   */
  orWhereJson(column: ModelKey<T>, value: JsonParam): this;
  orWhereJson(column: string, value: JsonParam): this;
  orWhereJson(column: ModelKey<T> | string, value: JsonParam): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "or",
        false,
        "contains",
        value as any,
      ),
    );
    return this;
  }

  /**
   * @description Filters records where JSON column does NOT contain the given value.
   * @sqlite might not work for all cases, suggest using the whereJsonRaw method instead
   * @mssql not supported - CHARINDEX cannot do partial JSON containment
   */
  whereJsonNotContains(column: ModelKey<T>, value: JsonParam): this;
  whereJsonNotContains(column: string, value: JsonParam): this;
  whereJsonNotContains(column: ModelKey<T> | string, value: JsonParam): this {
    return this.andWhereJsonNotContains(column as string, value);
  }

  /**
   * @description Filters records where JSON column does NOT contain the given value (AND).
   * @sqlite might not work for all cases, suggest using the whereJsonRaw method instead
   * @mssql not supported - CHARINDEX cannot do partial JSON containment
   */
  andWhereJsonNotContains(column: ModelKey<T>, value: JsonParam): this;
  andWhereJsonNotContains(column: string, value: JsonParam): this;
  andWhereJsonNotContains(
    column: ModelKey<T> | string,
    value: JsonParam,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "and",
        true,
        "not contains",
        value as any,
      ),
    );
    return this;
  }

  /**
   * @description Filters records where JSON column does NOT contain the given value (OR).
   * @sqlite might not work for all cases, suggest using the whereJsonRaw method instead
   * @mssql not supported - CHARINDEX cannot do partial JSON containment
   */
  orWhereJsonNotContains(column: ModelKey<T>, value: JsonParam): this;
  orWhereJsonNotContains(column: string, value: JsonParam): this;
  orWhereJsonNotContains(column: ModelKey<T> | string, value: JsonParam): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "or",
        true,
        "not contains",
        value as any,
      ),
    );
    return this;
  }

  /**
   * @description Filters records where JSON column contains the given value.
   * @sqlite might not work for all cases, suggest using the whereJsonRaw method instead
   * @mssql not supported - CHARINDEX cannot do partial JSON containment
   */
  whereJsonContains(column: ModelKey<T>, value: JsonParam): this;
  whereJsonContains(column: string, value: JsonParam): this;
  whereJsonContains(column: ModelKey<T> | string, value: JsonParam): this {
    return this.andWhereJsonContains(column as string, value);
  }

  /**
   * @description Filters records where JSON column contains the given value (AND).
   * @sqlite might not work for all cases, suggest using the whereJsonRaw method instead
   * @mssql not supported - CHARINDEX cannot do partial JSON containment
   */
  andWhereJsonContains(column: ModelKey<T>, value: JsonParam): this;
  andWhereJsonContains(column: string, value: JsonParam): this;
  andWhereJsonContains(column: ModelKey<T> | string, value: JsonParam): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "and",
        false,
        "contains",
        value as any,
      ),
    );
    return this;
  }

  /**
   * @description Filters records where JSON column contains the given value (OR).
   * @sqlite might not work for all cases, suggest using the whereJsonRaw method instead
   * @mssql not supported - CHARINDEX cannot do partial JSON containment
   */
  orWhereJsonContains(column: ModelKey<T>, value: JsonParam): this;
  orWhereJsonContains(column: string, value: JsonParam): this;
  orWhereJsonContains(column: ModelKey<T> | string, value: JsonParam): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "or",
        false,
        "contains",
        value as any,
      ),
    );
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
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "and",
        true,
        "not contains",
        value as any,
      ),
    );
    return this;
  }

  /**
   * @description Filters records where JSON column does NOT match the given value (OR).
   */
  orWhereNotJson(column: ModelKey<T>, value: JsonParam): this;
  orWhereNotJson(column: string, value: JsonParam): this;
  orWhereNotJson(column: ModelKey<T> | string, value: JsonParam): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "or",
        true,
        "not contains",
        value as any,
      ),
    );
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
    this.whereNodes.push(
      new WhereJsonNode(raw, "and", false, "raw", params as any),
    );
    return this;
  }

  /**
   * @description Add a raw JSON filter expression (OR).
   */
  orWhereJsonRaw(raw: string, params?: any[]): this {
    this.whereNodes.push(
      new WhereJsonNode(raw, "or", false, "raw", params as any),
    );
    return this;
  }
}
