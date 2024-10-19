import { Model } from "../models/model";
import { SelectableType } from "../models/model_manager/model_manager_types";
import whereTemplate, {
  BaseValues,
  WhereOperatorType,
} from "../resources/query/WHERE";
import { SqlDataSource } from "../sql_data_source";

export abstract class WhereQueryBuilder<T extends Model> {
  protected sqlDataSource: SqlDataSource;
  protected whereQuery: string = "";
  protected params: BaseValues[] = [];
  protected model: typeof Model;
  protected table: string;
  protected logs: boolean;

  protected whereTemplate: ReturnType<typeof whereTemplate>;
  protected isNestedCondition = false;

  /**
   * @description Constructs a query_builder instance.
   * @param model - The model class associated with the table.
   * @param table - The name of the table.
   * @param logs - A boolean indicating whether to log queries.
   * @param isNestedCondition - A boolean indicating whether the query is nested in another query.
   */
  public constructor(
    model: typeof Model,
    table: string,
    logs: boolean,
    isNestedCondition = false,
    sqlDataSource: SqlDataSource,
  ) {
    this.model = model;
    this.sqlDataSource = sqlDataSource;
    this.logs = logs;
    this.table = table;
    this.whereTemplate = whereTemplate(
      this.sqlDataSource.getDbType(),
      this.model,
    );
    this.params = [];
    this.isNestedCondition = isNestedCondition;
  }

  /**
   * @description Accepts a value and executes a callback only of the value exists
   * @param {any} value
   * @param callback
   */
  public when(
    value: any,
    cb: (value: any, query: WhereQueryBuilder<T>) => void,
  ): this {
    if (value === undefined || value === null) {
      return this;
    }

    cb(value, this);
    return this;
  }

  /**
   * @description Adds a WHERE condition to the query.
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The query_builder instance for chaining.
   */
  public where(
    column: SelectableType<T>,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public where(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public where(column: SelectableType<T> | string, value: BaseValues): this;
  public where(
    column: SelectableType<T> | string,
    operatorOrValue: WhereOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: WhereOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue as WhereOperatorType;
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
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The query_builder instance for chaining.
   */
  public andWhere(
    column: SelectableType<T>,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public andWhere(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public andWhere(column: SelectableType<T> | string, value: BaseValues): this;
  public andWhere(
    column: SelectableType<T> | string,
    operatorOrValue: WhereOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: WhereOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue as WhereOperatorType;
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
   * @param column - The column to filter.
   * @param operator - The comparison operator.
   * @param value - The value to compare against.
   * @returns The query_builder instance for chaining.
   */
  public orWhere(
    column: SelectableType<T>,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public orWhere(
    column: string,
    operator: WhereOperatorType,
    value: BaseValues,
  ): this;
  public orWhere(column: SelectableType<T> | string, value: BaseValues): this;
  public orWhere(
    column: SelectableType<T> | string,
    operatorOrValue: WhereOperatorType | BaseValues,
    value?: BaseValues,
  ): this {
    let operator: WhereOperatorType = "=";
    let actualValue: BaseValues;

    if (typeof operatorOrValue === "string" && value) {
      operator = operatorOrValue as WhereOperatorType;
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
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The query_builder instance for chaining.
   */
  public whereBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public whereBetween(column: string, min: BaseValues, max: BaseValues): this;
  public whereBetween(
    column: SelectableType<T> | string,
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
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The query_builder instance for chaining.
   */
  public andWhereBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public andWhereBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public andWhereBetween(
    column: SelectableType<T> | string,
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
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The query_builder instance for chaining.
   */
  public orWhereBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public orWhereBetween(column: string, min: BaseValues, max: BaseValues): this;
  public orWhereBetween(
    column: SelectableType<T> | string,
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
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The query_builder instance for chaining.
   */
  public whereNotBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public whereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public whereNotBetween(
    column: SelectableType<T> | string,
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
   * @param column - The column to filter.
   * @param min - The minimum value for the range.
   * @param max - The maximum value for the range.
   * @returns The query_builder instance for chaining.
   */
  public orWhereNotBetween(
    column: SelectableType<T>,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public orWhereNotBetween(
    column: string,
    min: BaseValues,
    max: BaseValues,
  ): this;
  public orWhereNotBetween(
    column: SelectableType<T> | string,
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
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The query_builder instance for chaining.
   */
  public whereIn(column: SelectableType<T>, values: BaseValues[]): this;
  public whereIn(column: string, values: BaseValues[]): this;
  public whereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The query_builder instance for chaining.
   */
  public andWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
  public andWhereIn(column: string, values: BaseValues[]): this;
  public andWhereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @param values - An array of values to match against.
   * @returns The query_builder instance for chaining.
   */
  public orWhereIn(column: SelectableType<T>, values: BaseValues[]): this;
  public orWhereIn(column: string, values: BaseValues[]): this;
  public orWhereIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The query_builder instance for chaining.
   */
  public whereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
  public whereNotIn(column: string, values: BaseValues[]): this;
  public whereNotIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @param values - An array of values to exclude.
   * @returns The query_builder instance for chaining.
   */
  public orWhereNotIn(column: SelectableType<T>, values: BaseValues[]): this;
  public orWhereNotIn(column: string, values: BaseValues[]): this;
  public orWhereNotIn(
    column: SelectableType<T> | string,
    values: BaseValues[],
  ): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @returns The query_builder instance for chaining.
   */
  public whereNull(column: SelectableType<T>): this;
  public whereNull(column: string): this;
  public whereNull(column: SelectableType<T> | string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @returns The query_builder instance for chaining.
   */
  public andWhereNull(column: SelectableType<T>): this;
  public andWhereNull(column: string): this;
  public andWhereNull(column: SelectableType<T> | string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @returns The query_builder instance for chaining.
   */
  public orWhereNull(column: SelectableType<T>): this;
  public orWhereNull(column: string): this;
  public orWhereNull(column: SelectableType<T> | string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @returns The query_builder instance for chaining.
   */
  public whereNotNull(column: SelectableType<T>): this;
  public whereNotNull(column: string): this;
  public whereNotNull(column: SelectableType<T> | string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @returns The query_builder instance for chaining.
   */
  public andWhereNotNull(column: SelectableType<T>): this;
  public andWhereNotNull(column: string): this;
  public andWhereNotNull(column: SelectableType<T> | string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @param column - The column to filter.
   * @returns The query_builder instance for chaining.
   */
  public orWhereNotNull(column: SelectableType<T>): this;
  public orWhereNotNull(column: string): this;
  public orWhereNotNull(column: SelectableType<T> | string): this {
    if (!this.whereQuery || !this.isNestedCondition) {
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
   * @description Adds a raw WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The query_builder instance for chaining.
   */
  public rawWhere(query: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a raw AND WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The query_builder instance for chaining.
   */
  public rawAndWhere(query: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawAndWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }

  /**
   * @description Adds a raw OR WHERE condition to the query.
   * @param query - The raw SQL WHERE condition.
   * @returns The query_builder instance for chaining.
   */
  public rawOrWhere(query: string) {
    if (!this.whereQuery || !this.isNestedCondition) {
      const { query: rawQuery, params } = this.whereTemplate.rawWhere(query);
      this.whereQuery = rawQuery;
      this.params.push(...params);
      return this;
    }

    const { query: rawQuery, params } = this.whereTemplate.rawOrWhere(query);
    this.whereQuery += rawQuery;
    this.params.push(...params);
    return this;
  }
}
