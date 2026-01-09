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

export class SelectQueryBuilder<
  T extends Model,
  S extends Record<string, any> = Record<string, any>,
> extends JoinQueryBuilder<T, S> {
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
   */
  select<C extends string>(...columns: SelectableColumn<C>[]): this;
  select(...columns: (ModelKey<T> | "*")[]): this;
  select<C extends string>(
    ...columns: (ModelKey<T> | "*" | SelectableColumn<C>)[]
  ): this {
    this.modelSelectedColumns = [
      ...this.modelSelectedColumns,
      ...(columns as string[]),
    ];

    columns.forEach((column) => {
      const columnStr = column as string;
      const { columnPart, aliasPart } = this.parseColumnAlias(columnStr);

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
  protected parseColumnAlias(column: string): {
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
   */
  from<F extends string>(table: TableFormat<F>): this {
    this.fromNode = new FromNode(table);
    return this;
  }

  /**
   * @description Sets the table to select from, by default is the table defined in the Model
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
  distinctOn<C extends string>(...columns: SelectableColumn<C>[]): this;
  distinctOn<C extends string>(
    ...columns: (ModelKey<T> | SelectableColumn<C>)[]
  ): this {
    this.distinctOnNode = new DistinctOnNode(columns as string[]);
    return this;
  }

  /**
   * @description Selects a JSON value at the specified path and returns it as JSON
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
   */
  selectJsonRaw<A extends string>(raw: string, alias: A): this {
    this.selectNodes.push(new SelectJsonNode(raw, "", alias, "raw", true));
    return this;
  }

  /**
   * @description Selects COUNT(column) with an alias
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
   * @note MSSQL uses LEN() instead of LENGTH()
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
   * @description Selects CEIL(column) with an alias
   * @mssql Uses CEILING instead of CEIL
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
   * @description Selects FLOOR(column) with an alias
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
   * @description Selects SQRT(column) with an alias
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
