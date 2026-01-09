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

      // Detect SQL expression patterns:
      // - Function calls: count(...), COALESCE(...), etc.
      // - Nested functions: COALESCE(COUNT(*), 0)
      // - Arithmetic with functions: count(*) + 1
      const isSqlExpression = /[a-zA-Z_]\w*\s*\(/.test(columnPart);

      if (isSqlExpression) {
        this.selectNodes.push(
          new SelectNode(
            aliasPart ? `${columnPart} as ${aliasPart}` : columnPart,
            undefined,
            undefined,
            true,
          ),
        );
        return;
      }

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

  /**
   * @description Selects COUNT(DISTINCT column) with an alias
   * @param column The column to count distinct values
   * @param alias The alias for the count result
   * @example
   * ```ts
   * const result = await User.query().selectCountDistinct("email", "uniqueEmails").one();
   * console.log(result?.uniqueEmails); // number
   * ```
   */
  selectCountDistinct<A extends string>(column: ModelKey<T>, alias: A): this;
  selectCountDistinct<A extends string>(column: string, alias: A): this;
  selectCountDistinct<A extends string>(
    column: ModelKey<T> | string,
    alias: A,
  ): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(
      new SelectNode(
        `count(distinct ${casedColumn}) as ${alias}`,
        undefined,
        undefined,
        true,
      ),
    );
    return this;
  }

  /**
   * @description Selects UPPER(column) with an alias
   * @param column The column to convert to uppercase
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await User.query().selectUpper("name", "upperName").one();
   * console.log(result?.upperName); // "JOHN"
   * ```
   */
  selectUpper<A extends string>(column: ModelKey<T>, alias: A): this;
  selectUpper<A extends string>(column: string, alias: A): this;
  selectUpper<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "upper"));
    return this;
  }

  /**
   * @description Selects LOWER(column) with an alias
   * @param column The column to convert to lowercase
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await User.query().selectLower("name", "lowerName").one();
   * console.log(result?.lowerName); // "john"
   * ```
   */
  selectLower<A extends string>(column: ModelKey<T>, alias: A): this;
  selectLower<A extends string>(column: string, alias: A): this;
  selectLower<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "lower"));
    return this;
  }

  /**
   * @description Selects LENGTH(column) with an alias
   * @param column The column to get the length of
   * @param alias The alias for the result
   * @note MSSQL uses LEN() instead of LENGTH(), handled automatically
   * @example
   * ```ts
   * const result = await User.query().selectLength("name", "nameLength").one();
   * console.log(result?.nameLength); // 4
   * ```
   */
  selectLength<A extends string>(column: ModelKey<T>, alias: A): this;
  selectLength<A extends string>(column: string, alias: A): this;
  selectLength<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    const fn = this.dbType === "mssql" ? "len" : "length";
    this.selectNodes.push(new SelectNode(casedColumn, alias, fn));
    return this;
  }

  /**
   * @description Selects TRIM(column) with an alias
   * @param column The column to trim whitespace from
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await User.query().selectTrim("name", "trimmedName").one();
   * console.log(result?.trimmedName); // "John" (without leading/trailing spaces)
   * ```
   */
  selectTrim<A extends string>(column: ModelKey<T>, alias: A): this;
  selectTrim<A extends string>(column: string, alias: A): this;
  selectTrim<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "trim"));
    return this;
  }

  /**
   * @description Selects ABS(column) with an alias
   * @param column The column to get absolute value of
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await Order.query().selectAbs("balance", "absoluteBalance").one();
   * console.log(result?.absoluteBalance); // 100 (even if balance was -100)
   * ```
   */
  selectAbs<A extends string>(column: ModelKey<T>, alias: A): this;
  selectAbs<A extends string>(column: string, alias: A): this;
  selectAbs<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "abs"));
    return this;
  }

  /**
   * @description Selects ROUND(column, decimals) with an alias
   * @param column The column to round
   * @param decimals Number of decimal places (default: 0)
   * @param alias The alias for the result
ga   * @postgres Not fully supported - ROUND with precision requires NUMERIC type, not REAL/FLOAT
   * @cockroachdb Not fully supported - ROUND with precision requires NUMERIC type, not REAL/FLOAT
   * @example
   * ```ts
   * const result = await Order.query().selectRound("price", 2, "roundedPrice").one();
   * console.log(result?.roundedPrice); // 19.99
   * ```
   */
  selectRound<A extends string>(
    column: ModelKey<T>,
    decimals: number,
    alias: A,
  ): this;
  selectRound<A extends string>(
    column: string,
    decimals: number,
    alias: A,
  ): this;
  selectRound<A extends string>(
    column: ModelKey<T> | string,
    decimals: number,
    alias: A,
  ): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(
      new SelectNode(
        `round(${casedColumn}, ${decimals}) as ${alias}`,
        undefined,
        undefined,
        true,
      ),
    );
    return this;
  }

  /**
   * @description Selects COALESCE(column, defaultValue) with an alias
   * @param column The column to check for NULL
   * @param defaultValue The value to use if column is NULL
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await User.query().selectCoalesce("nickname", "'Unknown'", "displayName").one();
   * console.log(result?.displayName); // "John" or "Unknown" if null
   * ```
   */
  selectCoalesce<A extends string>(
    column: ModelKey<T>,
    defaultValue: string | number,
    alias: A,
  ): this;
  selectCoalesce<A extends string>(
    column: string,
    defaultValue: string | number,
    alias: A,
  ): this;
  selectCoalesce<A extends string>(
    column: ModelKey<T> | string,
    defaultValue: string | number,
    alias: A,
  ): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(
      new SelectNode(
        `coalesce(${casedColumn}, ${defaultValue}) as ${alias}`,
        undefined,
        undefined,
        true,
      ),
    );
    return this;
  }

  /**
   * @description Selects CEIL(column) with an alias (rounds up to nearest integer)
   * @param column The column to round up
   * @param alias The alias for the result
   * @sqlite Not supported - SQLite does not have a native CEIL function
   * @mssql Uses CEILING instead of CEIL (handled automatically)
   * @example
   * ```ts
   * const result = await Order.query().selectCeil("price", "ceilPrice").one();
   * console.log(result?.ceilPrice); // 20 (if price was 19.1)
   * ```
   */
  selectCeil<A extends string>(column: ModelKey<T>, alias: A): this;
  selectCeil<A extends string>(column: string, alias: A): this;
  selectCeil<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    const fn = this.dbType === "mssql" ? "ceiling" : "ceil";
    this.selectNodes.push(new SelectNode(casedColumn, alias, fn));
    return this;
  }

  /**
   * @description Selects FLOOR(column) with an alias (rounds down to nearest integer)
   * @param column The column to round down
   * @param alias The alias for the result
   * @sqlite Not supported - SQLite does not have a native FLOOR function
   * @example
   * ```ts
   * const result = await Order.query().selectFloor("price", "floorPrice").one();
   * console.log(result?.floorPrice); // 19 (if price was 19.9)
   * ```
   */
  selectFloor<A extends string>(column: ModelKey<T>, alias: A): this;
  selectFloor<A extends string>(column: string, alias: A): this;
  selectFloor<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "floor"));
    return this;
  }

  /**
   * @description Selects SQRT(column) with an alias (square root)
   * @param column The column to get square root of
   * @param alias The alias for the result
   * @example
   * ```ts
   * const result = await Data.query().selectSqrt("value", "sqrtValue").one();
   * console.log(result?.sqrtValue); // 10 (if value was 100)
   * ```
   */
  selectSqrt<A extends string>(column: ModelKey<T>, alias: A): this;
  selectSqrt<A extends string>(column: string, alias: A): this;
  selectSqrt<A extends string>(column: ModelKey<T> | string, alias: A): this {
    const casedColumn = convertCase(
      column as string,
      this.model.databaseCaseConvention,
    );
    this.selectNodes.push(new SelectNode(casedColumn, alias, "sqrt"));
    return this;
  }
}
