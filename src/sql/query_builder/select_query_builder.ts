import { convertCase } from "../../utils/case_utils";
import { JsonPathInput } from "../../utils/json_path_utils";
import { DistinctNode } from "../ast/query/node/distinct/distinct";
import { DistinctOnNode } from "../ast/query/node/distinct/distinct_on";
import { FromNode } from "../ast/query/node/from/from";
import { SelectNode } from "../ast/query/node/select/basic_select";
import { SelectJsonNode } from "../ast/query/node/select/select_json";
import { SqlMethod } from "../ast/query/node/select/select_types";
import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import { SqlDataSource } from "../sql_data_source";
import { SqlDataSourceType, TableFormat } from "../sql_data_source_types";
import { JoinQueryBuilder } from "./join_query_builder";
import { SelectableColumn } from "./query_builder_types";

export class SelectQueryBuilder<T extends Model> extends JoinQueryBuilder<T> {
  protected dbType: SqlDataSourceType;
  protected modelSelectedColumns: string[] = [];
  protected modelAnnotatedColumns: string[] = [];
  protected withQuery?: string;
  protected fromNode: FromNode;
  protected distinctNode: DistinctNode | null;
  protected distinctOnNode: DistinctOnNode | null;
  protected selectNodes: SelectNode[];

  constructor(model: typeof Model, sqlDataSource: SqlDataSource) {
    super(model, sqlDataSource);
    this.dbType = sqlDataSource.getDbType();
    this.fromNode = new FromNode(this.model.table || "");
    this.distinctNode = null;
    this.distinctOnNode = null;
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
  select<S extends string>(...columns: SelectableColumn<S>[]): this;
  select(...columns: (ModelKey<T> | "*")[]): this;
  select<S extends string>(
    ...columns: (ModelKey<T> | "*" | SelectableColumn<S>)[]
  ): this {
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
   * @warning For models, only annotated columns are available and will be added to the `$annotations` property of the model. Everything else will be ignored, if you need a query like `selectRaw` you can use the `QueryBuilder` instead.
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
    this.distinctOnNode = null;
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
  annotate<A extends string>(column: string, alias: A): this;
  annotate<A extends string>(
    sqlMethod: SqlMethod,
    column: string,
    alias: A,
  ): this;
  annotate<A extends string>(sqlMethod: string, column: string, alias: A): this;
  annotate<A extends string>(
    sqlMethodOrColumn: string | SqlMethod,
    columnOrAlias: string,
    maybeAlias?: A,
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
    this.modelAnnotatedColumns.push(alias);

    return this;
  }

  /**
   * @description Sets the table to select from, by default is the table defined in the Model
   * @description Can be used on non select queries too, it will only specify the table name (es. INSERT INTO $table)
   * @param table The table name to query from, must be in valid sql format `table` or `table as alias`
   */
  from<S extends string>(table: TableFormat<S>): this {
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
   * @description Adds a DISTINCT ON clause to the query, does not stack, only the last one will be used
   * @warning Cannot use both DISTINCT and DISTINCT ON in the same query, only the DISTINCT ON will be used
   * @postgresql Only usable with PostgreSQL
   */
  distinctOn(...columns: ModelKey<T>[]): this;
  distinctOn<S extends string>(...columns: SelectableColumn<S>[]): this;
  distinctOn<S extends string>(
    ...columns: (ModelKey<T> | SelectableColumn<S>)[]
  ): this {
    this.distinctOnNode = new DistinctOnNode(columns as string[]);
    return this;
  }

  /**
   * @description Selects a JSON value at the specified path and returns it as JSON
   * @param column The column containing JSON data
   * @param path The JSON path to extract (standardized format: "$.user.name", "user.name", or ["user", "name"])
   * @param alias The alias for the selected value
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @description Result will be available in model.$annotations[alias]
   * @example
   * ```ts
   * // All databases accept the same path format:
   * const user = await User.query().selectJson("data", "$.user.name", "userName").first();
   * console.log(user?.$annotations?.userName); // Typed!
   *
   * await User.query().selectJson("data", "user.name", "userName").first(); // $ is optional
   * await User.query().selectJson("data", ["user", "name"], "userName").first();
   *
   * // Array indices:
   * await User.query().selectJson("data", "items.0.name", "firstItemName").first();
   * await User.query().selectJson("data", ["items", 0, "name"], "firstItemName").first();
   * ```
   */
  selectJson<A extends string>(
    column: ModelKey<T>,
    path: JsonPathInput,
    alias: A,
  ): this;
  selectJson<A extends string>(
    column: string,
    path: JsonPathInput,
    alias: A,
  ): this;
  selectJson<A extends string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: A,
  ): this {
    this.selectNodes.push(
      new SelectJsonNode(column as string, path, alias, "extract"),
    );
    this.modelAnnotatedColumns.push(alias);
    return this;
  }

  /**
   * @description Selects a JSON value at the specified path and returns it as text
   * @param column The column containing JSON data
   * @param path The JSON path to extract (standardized format)
   * @param alias The alias for the selected value
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @description Result will be available in model.$annotations[alias]
   * @example
   * ```ts
   * // All databases accept the same path format:
   * const user = await User.query().selectJsonText("data", "$.user.name", "userName").first();
   * console.log(user?.$annotations?.userName); // Typed!
   *
   * await User.query().selectJsonText("data", ["user", "name"], "userName").first();
   * ```
   */
  selectJsonText<A extends string>(
    column: ModelKey<T>,
    path: JsonPathInput,
    alias: A,
  ): this;
  selectJsonText<A extends string>(
    column: string,
    path: JsonPathInput,
    alias: A,
  ): this;
  selectJsonText<A extends string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: A,
  ): this {
    this.selectNodes.push(
      new SelectJsonNode(column as string, path, alias, "extract_text"),
    );
    this.modelAnnotatedColumns.push(alias);
    return this;
  }

  /**
   * @description Selects the length of a JSON array
   * @param column The column containing JSON array data
   * @param path The JSON path to the array (standardized format, use "$" or "" for root)
   * @param alias The alias for the length value
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @description Result will be available in model.$annotations[alias]
   * @example
   * ```ts
   * // All databases accept the same path format:
   * const user = await User.query().selectJsonArrayLength("data", "$.items", "itemCount").first();
   * console.log(user?.$annotations?.itemCount); // Typed!
   *
   * await User.query().selectJsonArrayLength("data", "items", "itemCount").first();
   * await User.query().selectJsonArrayLength("data", "$", "totalCount").first(); // root array
   * ```
   */
  selectJsonArrayLength<A extends string>(
    column: ModelKey<T>,
    path: JsonPathInput,
    alias: A,
  ): this;
  selectJsonArrayLength<A extends string>(
    column: string,
    path: JsonPathInput,
    alias: A,
  ): this;
  selectJsonArrayLength<A extends string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: A,
  ): this {
    this.selectNodes.push(
      new SelectJsonNode(column as string, path, alias, "array_length"),
    );
    this.modelAnnotatedColumns.push(alias);
    return this;
  }

  /**
   * @description Selects the keys of a JSON object
   * @param column The column containing JSON object data
   * @param path The JSON path to the object (standardized format, use "$" or "" for root)
   * @param alias The alias for the keys
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @description Result will be available in model.$annotations[alias]
   * @postgres Returns an array of keys
   * @mysql Returns a JSON array of keys
   * @example
   * ```ts
   * // All databases accept the same path format:
   * const user = await User.query().selectJsonKeys("data", "$.user", "userKeys").first();
   * console.log(user?.$annotations?.userKeys); // Typed!
   *
   * await User.query().selectJsonKeys("data", "user", "userKeys").first();
   * await User.query().selectJsonKeys("data", "$", "rootKeys").first(); // root object
   * ```
   */
  selectJsonKeys<A extends string>(
    column: ModelKey<T>,
    path: JsonPathInput,
    alias: A,
  ): this;
  selectJsonKeys<A extends string>(
    column: string,
    path: JsonPathInput,
    alias: A,
  ): this;
  selectJsonKeys<A extends string>(
    column: ModelKey<T> | string,
    path: JsonPathInput,
    alias: A,
  ): this {
    this.selectNodes.push(
      new SelectJsonNode(column as string, path, alias, "object_keys"),
    );
    this.modelAnnotatedColumns.push(alias);
    return this;
  }

  /**
   * @description Adds a raw JSON select expression
   * @param raw The raw SQL expression
   * @param alias The alias for the selected value
   * @description Result will be available in model.$annotations[alias]
   * @example
   * ```ts
   * const user = await User.query().selectJsonRaw("data->>'email'", "userEmail").first();
   * console.log(user?.$annotations?.userEmail); // Typed!
   * ```
   */
  selectJsonRaw<A extends string>(raw: string, alias: A): this {
    this.selectNodes.push(new SelectJsonNode(raw, "", alias, "raw", true));
    this.modelAnnotatedColumns.push(alias);
    return this;
  }
}
