import { convertCase } from "../../utils/case_utils";
import { DistinctNode } from "../ast/query/node/distinct/distinct";
import { DistinctOnNode } from "../ast/query/node/distinct/distinct_on";
import { FromNode } from "../ast/query/node/from/from";
import { SelectNode } from "../ast/query/node/select/basic_select";
import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import { SqlMethod } from "../ast/query/node/select/select_types";
import { SqlDataSource } from "../sql_data_source";
import { SqlDataSourceType } from "../sql_data_source_types";
import { JoinQueryBuilder } from "./join_query_builder";

export class SelectQueryBuilder<T extends Model> extends JoinQueryBuilder<T> {
  protected dbType: SqlDataSourceType;
  protected modelSelectedColumns: string[] = [];
  protected withQuery?: string;
  protected fromNode: FromNode;
  protected distinctNode: DistinctNode | null;
  protected distinctOnNodes: DistinctOnNode[];
  protected selectNodes: SelectNode[];

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.dbType = sqlDataSource.getDbType();
    this.fromNode = new FromNode(this.model.table || "");
    this.distinctNode = null;
    this.distinctOnNodes = [];
    this.selectNodes = [];
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

    const casedColumns = columns.map((column) =>
      convertCase(column as string, this.model.databaseCaseConvention),
    );

    casedColumns.forEach((column) => {
      this.selectNodes.push(new SelectNode(column));
    });

    return this;
  }

  /**
   * @description Adds a raw select statement to the query
   */
  selectRaw(statement: string): this {
    this.selectNodes.push(
      new SelectNode(statement, undefined, undefined, true),
    );
    return this;
  }

  /**
   * @description Clears the SELECT clause
   */
  clearSelect(): this {
    this.modelSelectedColumns = [];
    this.selectNodes = [];
    return this;
  }

  /**
   * @description Clears the FROM clause
   */
  clearFrom(): this {
    this.fromNode = new FromNode(this.model.table || "");
    return this;
  }

  /**
   * @description Clears the DISTINCT clause
   */
  clearDistinct(): this {
    this.distinctNode = null;
    return this;
  }

  /**
   * @description Clears the DISTINCT ON clause
   */
  clearDistinctOn(): this {
    this.distinctOnNodes = [];
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

    this.selectNodes.push(new SelectNode(column, alias, sqlMethod));

    return this;
  }

  /**
   * @description Sets the table to select from, by default is the table defined in the Model
   * @description Can be used on non select queries too, it will only specify the table name (es. INSERT INTO $table)
   */
  from(table: string): this {
    this.fromNode = new FromNode(table);
    return this;
  }

  /**
   * @description Sets the table to select from, by default is the table defined in the Model
   * @description Better naming convention for non select queries
   * @alias from
   */
  table(table: string): this {
    this.fromNode = new FromNode(table);
    return this;
  }

  /**
   * @description Adds a DISTINCT clause to the query
   */
  distinct(): this {
    this.distinctNode = new DistinctNode();
    return this;
  }

  /**
   * @description Adds a DISTINCT ON clause to the query
   * @postgresql Only usable with PostgreSQL
   */
  distinctOn(...columns: ModelKey<T>[]): this;
  distinctOn(...columns: string[]): this;
  distinctOn(...columns: (string | ModelKey<T>)[]): this {
    this.distinctOnNodes.push(new DistinctOnNode(columns as string[]));
    return this;
  }
}
