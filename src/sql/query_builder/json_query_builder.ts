import type { BinaryOperatorType } from "../ast/query/node/where";
import { WhereJsonNode } from "../ast/query/node/where";
import type { JsonPathInput } from "../../utils/json_path_utils";
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

  /**
   * @description Filters records where the JSON column equals an exact JSON object value.
   */
  whereJsonObject<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereJsonObject(column as string, value);
  }

  /**
   * @description Filters records where the JSON column equals an exact JSON object value (AND).
   */
  andWhereJsonObject<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "and", false, "=", value as any),
    );
    return this;
  }

  /**
   * @description Filters records where the JSON column equals an exact JSON object value (OR).
   */
  orWhereJsonObject<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "or", false, "=", value as any),
    );
    return this;
  }

  /**
   * @description Filters records where the JSON column does NOT equal an exact JSON object value.
   */
  whereNotJsonObject<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereNotJsonObject(column as string, value);
  }

  /**
   * @description Filters records where the JSON column does NOT equal an exact JSON object value (AND).
   */
  andWhereNotJsonObject<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "and", true, "=", value as any),
    );
    return this;
  }

  /**
   * @description Filters records where the JSON column does NOT equal an exact JSON object value (OR).
   */
  orWhereNotJsonObject<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "or", true, "=", value as any),
    );
    return this;
  }

  /**
   * @description Compares the value at a JSON path using the given operator.
   * @example whereJsonPath("meta", "address.city", "=", "Rome")
   */
  whereJsonPath<K extends string>(
    column: K,
    path: JsonPathInput,
    operator: BinaryOperatorType,
    value: any,
  ): this {
    return this.andWhereJsonPath(column as string, path, operator, value);
  }

  /**
   * @description Compares the value at a JSON path (AND).
   */
  andWhereJsonPath<K extends string>(
    column: K,
    path: JsonPathInput,
    operator: BinaryOperatorType,
    value: any,
  ): this {
    this.pushJsonPath("and", column as string, path, operator, value, false);
    return this;
  }

  /**
   * @description Compares the value at a JSON path (OR).
   */
  orWhereJsonPath<K extends string>(
    column: K,
    path: JsonPathInput,
    operator: BinaryOperatorType,
    value: any,
  ): this {
    this.pushJsonPath("or", column as string, path, operator, value, false);
    return this;
  }

  /**
   * @description Filters records where the JSON column is a superset of the value (contains it).
   */
  whereJsonSupersetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereJsonSupersetOf(column as string, value);
  }

  andWhereJsonSupersetOf<K extends string>(
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

  orWhereJsonSupersetOf<K extends string>(
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
   * @description Filters records where the JSON column is NOT a superset of the value.
   */
  whereJsonNotSupersetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereJsonNotSupersetOf(column as string, value);
  }

  andWhereJsonNotSupersetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "and",
        true,
        "contains",
        value as any,
      ),
    );
    return this;
  }

  orWhereJsonNotSupersetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "or", true, "contains", value as any),
    );
    return this;
  }

  /**
   * @description Filters records where the JSON column is a subset of the value.
   * @postgres/cockroachdb/mysql/mariadb only
   */
  whereJsonSubsetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereJsonSubsetOf(column as string, value);
  }

  andWhereJsonSubsetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "and", false, "subset", value as any),
    );
    return this;
  }

  orWhereJsonSubsetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "or", false, "subset", value as any),
    );
    return this;
  }

  /**
   * @description Filters records where the JSON column is NOT a subset of the value.
   * @postgres/cockroachdb/mysql/mariadb only
   */
  whereJsonNotSubsetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    return this.andWhereJsonNotSubsetOf(column as string, value);
  }

  andWhereJsonNotSubsetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "and", true, "subset", value as any),
    );
    return this;
  }

  orWhereJsonNotSubsetOf<K extends string>(
    column: K,
    value: JsonValueForColumn<T, K>,
  ): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "or", true, "subset", value as any),
    );
    return this;
  }

  /**
   * @description Filters records where the JSON column has none of the given keys.
   * @postgres/cockroachdb only
   */
  whereJsonHasNone<K extends string>(column: K, keys: string[]): this {
    return this.andWhereJsonHasNone(column as string, keys);
  }

  andWhereJsonHasNone<K extends string>(column: K, keys: string[]): this {
    this.whereNodes.push(
      new WhereJsonNode(
        column as string,
        "and",
        false,
        "has none",
        keys as any,
      ),
    );
    return this;
  }

  orWhereJsonHasNone<K extends string>(column: K, keys: string[]): this {
    this.whereNodes.push(
      new WhereJsonNode(column as string, "or", false, "has none", keys as any),
    );
    return this;
  }

  private pushJsonPath(
    chain: "and" | "or",
    column: string,
    path: JsonPathInput,
    operator: BinaryOperatorType,
    value: any,
    negated: boolean,
  ): void {
    const node = new WhereJsonNode(
      column,
      chain,
      negated,
      "path",
      value as any,
      false,
      path,
      operator,
    );
    this.whereNodes.push(node);
  }
}
