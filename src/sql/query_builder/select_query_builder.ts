import { convertCase } from "../../utils/case_utils";
import { JsonPathInput } from "../../utils/json_path_utils";
import { DistinctNode } from "../ast/query/node/distinct/distinct";
import { DistinctOnNode } from "../ast/query/node/distinct/distinct_on";
import { FromNode } from "../ast/query/node/from/from";
import { SelectNode } from "../ast/query/node/select/basic_select";
import { SelectJsonNode } from "../ast/query/node/select/select_json";
import { Model } from "../models/model";
import { ModelKey } from "../models/model_manager/model_manager_types";
import { SqlDataSource } from "../sql_data_source";
import { SqlDataSourceType, TableFormat } from "../sql_data_source_types";
import { JoinQueryBuilder } from "./join_query_builder";
import { SelectableColumn } from "./query_builder_types";

export class SelectQueryBuilder<T extends Model> extends JoinQueryBuilder<T> {
  protected dbType: SqlDataSourceType;
  protected modelSelectedColumns: string[] = [];
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
   * @description Supports: "column", "table.column", "column as alias", "*", "table.*"
   * @example
   * ```ts
   * const user = await User.query().select("name", "age").one(); // SELECT name, age FROM users
   * const user = await User.query().select("name", "users.age").one(); // SELECT name, users.age FROM users
   * const user = await User.query().select("name as userName").one(); // SELECT name as userName FROM users
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

    columns.forEach((column) => {
      const columnStr = column as string;
      const { columnPart, aliasPart } = this.parseColumnAlias(columnStr);

      const casedColumn = convertCase(
        columnPart,
        this.model.databaseCaseConvention,
      );

      this.selectNodes.push(new SelectNode(casedColumn, aliasPart));
    });

    return this;
  }

  /**
   * @description Parses a column string that may contain an alias (e.g., "column as alias")
   * @returns The column part and optional alias part
   */
  private parseColumnAlias(column: string): {
    columnPart: string;
    aliasPart: string | undefined;
  } {
    const normalized = column.replace(/\s+/g, " ").trim();
    const asMatch = normalized.match(/^(.+?)\s+as\s+(.+)$/i);

    if (asMatch) {
      return {
        columnPart: asMatch[1].trim(),
        aliasPart: asMatch[2].trim(),
      };
    }

    return {
      columnPart: normalized,
      aliasPart: undefined,
    };
  }

  /**
   * @description Adds a raw SELECT statement to the query
   * @description Useful for SQL functions, expressions, or complex selections
   * @example
   * ```ts
   * const result = await User.query().selectRaw("count(*) as total").one();
   * const result = await User.query().selectRaw("sum(amount) as total_amount").one();
   * ```
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
   * @example
   * ```ts
   * // All databases accept the same path format:
   * const user = await User.query().selectJson("data", "$.user.name", "userName").one();
   *
   * await User.query().selectJson("data", "user.name", "userName").one(); // $ is optional
   * await User.query().selectJson("data", ["user", "name"], "userName").one();
   *
   * // Array indices:
   * await User.query().selectJson("data", "items.0.name", "firstItemName").one();
   * await User.query().selectJson("data", ["items", 0, "name"], "firstItemName").one();
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
    return this;
  }

  /**
   * @description Selects a JSON value at the specified path and returns it as text
   * @param column The column containing JSON data
   * @param path The JSON path to extract (standardized format)
   * @param alias The alias for the selected value
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @example
   * ```ts
   * // All databases accept the same path format:
   * const user = await User.query().selectJsonText("data", "$.user.name", "userName").one();
   *
   * await User.query().selectJsonText("data", ["user", "name"], "userName").one();
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
    return this;
  }

  /**
   * @description Selects the length of a JSON array
   * @param column The column containing JSON array data
   * @param path The JSON path to the array (standardized format, use "$" or "" for root)
   * @param alias The alias for the length value
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @example
   * ```ts
   * // All databases accept the same path format:
   * const user = await User.query().selectJsonArrayLength("data", "$.items", "itemCount").one();
   *
   * await User.query().selectJsonArrayLength("data", "items", "itemCount").one();
   * await User.query().selectJsonArrayLength("data", "$", "totalCount").one(); // root array
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
    return this;
  }

  /**
   * @description Selects the keys of a JSON object
   * @param column The column containing JSON object data
   * @param path The JSON path to the object (standardized format, use "$" or "" for root)
   * @param alias The alias for the keys
   * @description Path format is standardized across all databases - ORM converts to DB-specific syntax
   * @postgres Returns an array of keys
   * @mysql Returns a JSON array of keys
   * @example
   * ```ts
   * // All databases accept the same path format:
   * const user = await User.query().selectJsonKeys("data", "$.user", "userKeys").one();
   *
   * await User.query().selectJsonKeys("data", "user", "userKeys").one();
   * await User.query().selectJsonKeys("data", "$", "rootKeys").one(); // root object
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
    return this;
  }

  /**
   * @description Adds a raw JSON select expression
   * @param raw The raw SQL expression
   * @param alias The alias for the selected value
   * @example
   * ```ts
   * const user = await User.query().selectJsonRaw("data->>'email'", "userEmail").one();
   * ```
   */
  selectJsonRaw<A extends string>(raw: string, alias: A): this {
    this.selectNodes.push(new SelectJsonNode(raw, "", alias, "raw", true));
    return this;
  }

  /**
   * @description Selects COUNT(column) with an alias
   * @param column The column to count (use "*" for COUNT(*))
   * @param alias The alias for the count result
   * @example
   * ```ts
   * const result = await User.query().selectCount("id", "totalUsers").one();
   *
   * const result = await User.query().selectCount("*", "total").one();
   * ```
   */
  selectCount<A extends string>(column: ModelKey<T> | "*", alias: A): this;
  selectCount<A extends string>(column: string, alias: A): this;
  selectCount<A extends string>(
    column: ModelKey<T> | "*" | string,
    alias: A,
  ): this {
    const casedColumn =
      column === "*"
        ? "*"
        : convertCase(column as string, this.model.databaseCaseConvention);
    this.selectNodes.push(new SelectNode(casedColumn, alias, "count"));
    return this;
  }

  /**
   * @description Selects SUM(column) with an alias
   * @param column The column to sum
   * @param alias The alias for the sum result
   * @example
   * ```ts
   * const result = await Order.query().selectSum("amount", "totalAmount").one();
   * console.log(result?.totalAmount); // number
   * ```
   */
  selectSum<A extends string>(column: ModelKey<T>, alias: A): this;
  selectSum<A extends string>(column: string, alias: A): this;
  selectSum<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "sum"));
    return this;
  }

  /**
   * @description Selects AVG(column) with an alias
   * @param column The column to average
   * @param alias The alias for the average result
   * @example
   * ```ts
   * const result = await User.query().selectAvg("age", "averageAge").one();
   * console.log(result?.averageAge); // number
   * ```
   */
  selectAvg<A extends string>(column: ModelKey<T>, alias: A): this;
  selectAvg<A extends string>(column: string, alias: A): this;
  selectAvg<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "avg"));
    return this;
  }

  /**
   * @description Selects MIN(column) with an alias
   * @param column The column to get minimum value
   * @param alias The alias for the min result
   * @example
   * ```ts
   * const result = await User.query().selectMin("age", "youngestAge").one();
   * console.log(result?.youngestAge); // number
   * ```
   */
  selectMin<A extends string>(column: ModelKey<T>, alias: A): this;
  selectMin<A extends string>(column: string, alias: A): this;
  selectMin<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "min"));
    return this;
  }

  /**
   * @description Selects MAX(column) with an alias
   * @param column The column to get maximum value
   * @param alias The alias for the max result
   * @example
   * ```ts
   * const result = await User.query().selectMax("age", "oldestAge").one();
   * console.log(result?.oldestAge); // number
   * ```
   */
  selectMax<A extends string>(column: ModelKey<T>, alias: A): this;
  selectMax<A extends string>(column: string, alias: A): this;
  selectMax<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "max"));
    return this;
  }
}
