import { CaseConvention } from "../../utils/case_utils";
import { Model } from "../models/model";
import joinTemplate from "../resources/query/JOIN";
import selectTemplate from "../resources/query/SELECT";
import whereTemplate, {
  BaseValues,
  BinaryOperatorType,
} from "../resources/query/WHERE";
import { SqlDataSourceType } from "../sql_data_source";

export class StandaloneQueryBuilder {
  protected selectQuery: string;
  protected joinQuery: string;
  protected relations: string[];
  protected dynamicColumns: string[];
  protected groupByQuery: string;
  protected orderByQuery: string;
  protected limitQuery: string;
  protected offsetQuery: string;
  protected whereQuery: string = "";
  protected havingQuery: string = "";
  protected dbType: SqlDataSourceType;

  protected params: any[] = [];
  protected model: typeof Model;

  protected whereTemplate: ReturnType<typeof whereTemplate>;
  protected isNestedCondition = false;
  protected selectTemplate: ReturnType<typeof selectTemplate>;

  /**
   * @description Constructs a Mysql_query_builder instance.
   */
  constructor(
    dbType: SqlDataSourceType,
    table: string,
    modelCaseConvention: CaseConvention = "camel",
    databaseCaseConvention: CaseConvention = "snake",
    isNestedCondition: boolean = false,
  ) {
    this.dbType = dbType;
    this.isNestedCondition = isNestedCondition;
    this.model = {
      modelCaseConvention,
      databaseCaseConvention,
      table: table,
    } as typeof Model;
    this.selectQuery = selectTemplate(this.dbType, this.model).selectAll;
    this.selectTemplate = selectTemplate(this.dbType, this.model);
    this.whereTemplate = whereTemplate(this.dbType, this.model);
    this.whereQuery = "";
    this.joinQuery = "";
    this.relations = [];
    this.dynamicColumns = [];
    this.groupByQuery = "";
    this.orderByQuery = "";
    this.limitQuery = "";
    this.offsetQuery = "";
    this.havingQuery = "";
    this.params = [];
  }

  select(...columns: string[]): StandaloneQueryBuilder {
    this.selectQuery = this.selectTemplate.selectColumns(
      ...(columns as string[]),
    );
    return this;
  }

  /**
   * @description Selects all columns from the table.
   */
  joinRaw(query: string): StandaloneQueryBuilder {
    this.joinQuery += ` ${query} `;
    return this;
  }

  /**
   * @description Adds a JOIN condition to the query.
   */
  join(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): StandaloneQueryBuilder {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn,
    );
    this.joinQuery += join.innerJoin();
    return this;
  }

  /**
   * @description Adds a LEFT JOIN condition to the query.
   */
  leftJoin(
    relationTable: string,
    primaryColumn: string,
    foreignColumn: string,
  ): StandaloneQueryBuilder {
    const join = joinTemplate(
      this.model,
      relationTable,
      primaryColumn,
      foreignColumn,
    );
    this.joinQuery += join.leftJoin();
    return this;
  }

  /**
   * @description Given a callback, it will execute the callback with a query builder instance.
   */
  whereBuilder(cb: (queryBuilder: StandaloneQueryBuilder) => void): this {
    const queryBuilder = new StandaloneQueryBuilder(
      this.dbType,
      this.model.table,
      this.model.modelCaseConvention,
      this.model.databaseCaseConvention,
      true,
    );
    cb(queryBuilder as unknown as StandaloneQueryBuilder);

    let whereCondition = queryBuilder.whereQuery.trim();
    if (whereCondition.startsWith("AND")) {
      whereCondition = whereCondition.substring(4); // 'AND '.length === 4 has to be removed from the beginning of the where condition
    } else if (whereCondition.startsWith("OR")) {
      whereCondition = whereCondition.substring(3); // 'OR '.length === 3 has to be removed from the beginning of the where condition
    }

    whereCondition = "(" + whereCondition + ")";

    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition
        ? whereCondition
        : `WHERE ${whereCondition}`;
    } else {
      this.whereQuery += ` AND ${whereCondition}`;
    }

    this.params.push(...queryBuilder.params);
    return this;
  }

  /**
   * @description Given a callback, it will execute the callback with a query builder instance.
   */
  orWhereBuilder(cb: (queryBuilder: StandaloneQueryBuilder) => void): this {
    const nestedBuilder = new StandaloneQueryBuilder(
      this.dbType,
      this.model.table,
      this.model.modelCaseConvention,
      this.model.databaseCaseConvention,
      true,
    );
    cb(nestedBuilder as unknown as StandaloneQueryBuilder);

    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }

    nestedCondition = `(${nestedCondition})`;

    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition
        ? nestedCondition
        : `WHERE ${nestedCondition}`;

      this.params.push(...nestedBuilder.params);
      return this;
    }

    this.whereQuery += ` OR ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);

    return this;
  }

  /**
   * @description Given a callback, it will execute the callback with a query builder instance.
   */
  andWhereBuilder(cb: (queryBuilder: StandaloneQueryBuilder) => void): this {
    const nestedBuilder = new StandaloneQueryBuilder(
      this.dbType,
      this.model.table,
      this.model.modelCaseConvention,
      this.model.databaseCaseConvention,
      true,
    );
    cb(nestedBuilder as unknown as StandaloneQueryBuilder);

    let nestedCondition = nestedBuilder.whereQuery.trim();
    if (nestedCondition.startsWith("AND")) {
      nestedCondition = nestedCondition.substring(4);
    } else if (nestedCondition.startsWith("OR")) {
      nestedCondition = nestedCondition.substring(3);
    }

    if (!this.whereQuery) {
      this.whereQuery = this.isNestedCondition
        ? nestedCondition
        : `WHERE ${nestedCondition}`;

      this.params.push(...nestedBuilder.params);
      return this;
    }

    this.whereQuery += ` AND ${nestedCondition}`;
    this.params.push(...nestedBuilder.params);

    return this;
  }

  /**
   * @description Accepts a value and executes a callback only of the value is not null or undefined.
   */
  when(
    value: any,
    cb: (value: any, query: StandaloneQueryBuilder) => void,
  ): this {
    if (value === undefined || value === null) {
      return this;
    }

    cb(value, this);
    return this;
  }

  /**
   * @description Adds a WHERE condition to the query.
   * @returns The query_builder instance for chaining.
   */
  where(
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
   * @returns The query_builder instance for chaining.
   */
  andWhere(
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
   * @returns The query_builder instance for chaining.
   */
  orWhere(
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
   * @returns The query_builder instance for chaining.
   */
  whereBetween(column: string, min: BaseValues, max: BaseValues): this {
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
   * @returns The query_builder instance for chaining.
   */
  andWhereBetween(column: string, min: BaseValues, max: BaseValues): this {
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
   * @returns The query_builder instance for chaining.
   */
  orWhereBetween(column: string, min: BaseValues, max: BaseValues): this {
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
   * @returns The query_builder instance for chaining.
   */
  whereNotBetween(column: string, min: BaseValues, max: BaseValues): this {
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
   * @returns The query_builder instance for chaining.
   */
  orWhereNotBetween(column: string, min: BaseValues, max: BaseValues): this {
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
   * @returns The query_builder instance for chaining.
   */
  whereIn(column: string, values: BaseValues[]): this {
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
   * @returns The query_builder instance for chaining.
   */
  andWhereIn(column: string, values: BaseValues[]): this {
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
   * @returns The query_builder instance for chaining.
   */
  orWhereIn(column: string, values: BaseValues[]): this {
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
   * @returns The query_builder instance for chaining.
   */
  whereNotIn(column: string, values: BaseValues[]): this {
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
   * @returns The query_builder instance for chaining.
   */
  orWhereNotIn(column: string, values: BaseValues[]): this {
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
   * @returns The query_builder instance for chaining.
   */
  whereNull(column: string): this {
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
   * @returns The query_builder instance for chaining.
   */
  andWhereNull(column: string): this {
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
   * @returns The query_builder instance for chaining.
   */
  orWhereNull(column: string): this {
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
   * @returns The query_builder instance for chaining.
   */
  whereNotNull(column: string): this {
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
   * @returns The query_builder instance for chaining.
   */
  andWhereNotNull(column: string): this {
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
   * @returns The query_builder instance for chaining.
   */
  orWhereNotNull(column: string): this {
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
   * @description Adds a raw WHERE condition to the query.
   * @returns The query_builder instance for chaining.
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
   * @returns The query_builder instance for chaining.
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
   * @returns The query_builder instance for chaining.
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

  groupBy(...columns: string[]): this {
    this.groupByQuery = this.selectTemplate.groupBy(...(columns as string[]));
    return this;
  }

  groupByRaw(query: string): this {
    query.replace("GROUP BY", "");
    this.groupByQuery = ` GROUP BY ${query}`;
    return this;
  }

  orderBy(columns: string, order: "ASC" | "DESC"): this {
    if (!this.orderByQuery) {
      this.orderByQuery = ` ORDER BY ${columns} ${order}`;
      return this;
    }

    this.orderByQuery += `, ${columns} ${order}`;
    return this;
  }

  orderByRaw(query: string): this {
    this.orderByQuery = ` ORDER BY ${query}`;
    return this;
  }

  limit(limit: number) {
    this.limitQuery = this.selectTemplate.limit(limit);
    return this;
  }

  offset(offset: number) {
    this.offsetQuery = this.selectTemplate.offset(offset);
    return this;
  }

  having(column: string, value: any): this;
  having(column: string, operator: BinaryOperatorType, value: any): this;
  having(
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

    if (this.havingQuery) {
      this.havingQuery += ` AND ${column} ${operator} ?`;
    } else {
      this.havingQuery = ` HAVING ${column} ${operator} ?`;
    }

    this.params.push(actualValue);
    return this;
  }

  havingRaw(query: string): this {
    if (this.havingQuery) {
      this.havingQuery += ` AND ${query}`;
    } else {
      this.havingQuery = ` HAVING ${query}`;
    }

    return this;
  }

  toSql(dbType?: SqlDataSourceType): {
    query: string;
    params: any[];
  } {
    const query =
      this.selectQuery +
      this.joinQuery +
      this.whereQuery +
      this.groupByQuery +
      this.havingQuery +
      this.orderByQuery +
      this.limitQuery +
      this.offsetQuery;

    function parsePlaceHolders(
      dbType: SqlDataSourceType,
      query: string,
      startIndex: number = 1,
    ): string {
      switch (dbType) {
        case "mysql":
        case "sqlite":
        case "mariadb":
          return query.replace(/PLACEHOLDER/g, () => "?");
        case "postgres":
          let index = startIndex;
          return query.replace(/PLACEHOLDER/g, () => `$${index++}`);
        default:
          throw new Error(
            "Unsupported database type, did you forget to set the dbType in the function params?",
          );
      }
    }

    const parsedQuery = parsePlaceHolders(dbType || this.dbType, query);
    return { query: parsedQuery, params: this.params };
  }
}
