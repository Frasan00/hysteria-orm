import { WhereJsonNode } from "../ast/query/node/where";
import { Model } from "../models/model";
import {
  ModelKey,
  StripTablePrefix,
} from "../models/model_manager/model_manager_types";
import { WhereQueryBuilder } from "./where_query_builder";

type DefaultJsonParam = Record<string, any> | any[];

type JsonValueForColumn<T extends Model, K extends string> =
  K extends ModelKey<T>
    ? NonNullable<T[StripTablePrefix<K> & keyof T]>
    : DefaultJsonParam;

export class JsonQueryBuilder<
  T extends Model,
  S extends Record<string, any> = Record<string, any>,
> extends WhereQueryBuilder<T, S> {
  /**
   * @description Filters records matching exact JSON value.
   */
  whereJson<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereJson(column as string, value);
  }

  /**
   * @description Filters records matching the given JSON value.
   * @mssql Partial JSON matching not supported - only exact matches work
   */
  andWhereJson<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
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
  orWhereJson<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
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
  whereJsonNotContains<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereJsonNotContains(column as string, value);
  }

  /**
   * @description Filters records where JSON column does NOT contain the given value (AND).
   * @sqlite might not work for all cases, suggest using the whereJsonRaw method instead
   * @mssql not supported - CHARINDEX cannot do partial JSON containment
   */
  andWhereJsonNotContains<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
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
  orWhereJsonNotContains<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
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
  whereJsonContains<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereJsonContains(column as string, value);
  }

  /**
   * @description Filters records where JSON column contains the given value (AND).
   * @sqlite might not work for all cases, suggest using the whereJsonRaw method instead
   * @mssql not supported - CHARINDEX cannot do partial JSON containment
   */
  andWhereJsonContains<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
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
  orWhereJsonContains<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
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
  whereNotJson<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereNotJson(column as string, value);
  }

  /**
   * @description Filters records where JSON column does NOT match the given value (AND).
   */
  andWhereNotJson<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
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
   * @description Filters records where JSON column does NOT match the given value (OR).
   */
  orWhereNotJson<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
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
