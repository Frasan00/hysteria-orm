import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import selectTemplate, { SqlMethod } from "../resources/query/SELECT";
import { SqlDataSource } from "../sql_data_source";
import { SqlDataSourceType } from "../sql_data_source_types";
import { JoinQueryBuilder } from "./join_query_builder";

export class SelectQueryBuilder<T extends Model> extends JoinQueryBuilder<T> {
  protected dbType: SqlDataSourceType;
  protected modelSelectedColumns: string[] = [];
  protected selectQuery: string;
  protected withQuery?: string;
  protected fromTable: string;
  protected selectTemplate: ReturnType<typeof selectTemplate>;

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.dbType = sqlDataSource.getDbType();
    this.selectTemplate = selectTemplate(this.dbType, this.model);
    this.fromTable = this.model.table || "";
    this.selectQuery = "";
  }

  /**
   * @description Adds a SELECT condition to the query.
   * @description Can be stacked multiple times
   * @warning For annotations, use the `annotate` method instead, aliases and methods are not supported in the select method and will give error `column "${columnName} as ${alias}" does not exist`
   * @example
   * ```ts
   * const user = await User.query().select("name", "age").first(); // SELECT name, age FROM users
   * const user = await User.query().select("name", "users.age").first(); // SELECT name, users.age FROM users
   * ```
   */
  select(...columns: string[]): this;
  select(...columns: (ModelKey<T> | "*")[]): this;
  select(...columns: (ModelKey<T> | "*" | string)[]): this {
    this.modelSelectedColumns = [
      ...this.modelSelectedColumns,
      ...(columns as string[]),
    ];

    this.selectQuery = this.selectTemplate.selectColumns([
      ...this.modelSelectedColumns,
    ]);

    return this;
  }

  /**
   * @description Adds a raw select statement to the query
   */
  selectRaw(statement: string): this {
    if (!this.selectQuery) {
      this.selectQuery = `SELECT ${statement}`;
      return this;
    }

    this.selectQuery += `, ${statement}`;

    if (!this.selectQuery.toLowerCase().includes("select")) {
      this.selectQuery = `SELECT ${this.selectQuery}`;
    }

    return this;
  }

  /**
   * @description Clears the SELECT clause
   */
  clearSelect(): this {
    this.modelSelectedColumns = [];
    this.selectQuery = this.selectTemplate.selectAll(this.fromTable);
    return this;
  }

  /**
   * @description Annotates a column with a SQL method or a simple alias
   * @description If using a model, the result will be available in the $annotations property of the model, else it will be available in the result of the query
   * @example
   * ```ts
   * const user = await User.query().annotate("max", "id", "maxId").first(); // max(id) as maxId
   * const user = await User.query().annotate("id", "superId").first(); // id as superId
   * const user = await User.query().annotate("id", "superId").first(); // id as superId
   * ```
   */
  annotate(column: string, alias: string): this;
  annotate(sqlMethod: SqlMethod, column: string, alias: string): this;
  annotate(sqlMethod: string, column: string, alias: string): this;
  annotate(
    sqlMethodOrColumn: string | SqlMethod,
    columnOrAlias: string,
    maybeAlias?: string,
  ): this {
    let sqlMethod: string | undefined;
    let column: string;
    let alias: string;

    if (maybeAlias) {
      sqlMethod = sqlMethodOrColumn;
      column = columnOrAlias;
      alias = maybeAlias;
    } else {
      sqlMethod = undefined;
      column = sqlMethodOrColumn as string;
      alias = columnOrAlias;
    }

    const annotationStatement = this.selectTemplate.annotate(
      column,
      alias,
      sqlMethod,
    );

    if (!this.selectQuery) {
      this.selectQuery = `SELECT ${annotationStatement}`;
      return this;
    }

    this.selectQuery += `, ${annotationStatement}`;

    if (!this.selectQuery.toLowerCase().includes("select")) {
      this.selectQuery = `SELECT ${this.selectQuery}`;
    }

    return this;
  }

  /**
   * @description Sets the table to select from, by default is the table defined in the Model
   * @description Can be used on non select queries too, it will only specify the table name (es. INSERT INTO $table)
   */
  from(table: string): this {
    this.fromTable = table;
    this.selectQuery = this.selectQuery.replace(
      /(?:FROM|INTO|UPDATE)\s+([a-zA-Z0-9_]+)/i,
      `FROM ${this.fromTable}`,
    );

    return this;
  }

  /**
   * @description Adds a DISTINCT clause to the query
   */
  distinct(): this {
    const distinct = this.selectTemplate.distinct;
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinct}`,
    );

    return this;
  }

  /**
   * @description Adds a DISTINCT ON clause to the query
   * @postgresql Only
   */
  distinctOn(...columns: ModelKey<T>[]): this;
  distinctOn(...columns: string[]): this;
  distinctOn(...columns: (string | ModelKey<T>)[]): this {
    const distinctOn = this.selectTemplate.distinctOn(...(columns as string[]));
    this.selectQuery = this.selectQuery.replace(
      /select/i,
      `SELECT ${distinctOn}`,
    );

    return this;
  }
}
