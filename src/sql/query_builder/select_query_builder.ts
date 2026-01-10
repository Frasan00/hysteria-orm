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
import {
  Selectable,
  SelectableColumn,
  SqlFunction,
} from "./query_builder_types";

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
   * @description Supports: "column", "table.column", "*", "table.*", or [column, alias] tuples
   * @example
   * .select("id", "name")                           // Simple columns
   * .select(["id", "userId"], ["name", "userName"]) // Columns with aliases
   * .select("id", ["name", "userName"])             // Mixed
   */
  select<C extends string>(
    ...columns: (SelectableColumn<C> | Selectable)[]
  ): this;
  select(...columns: (ModelKey<T> | "*" | Selectable)[]): this;
  select<C extends string>(
    ...columns: (ModelKey<T> | "*" | SelectableColumn<C> | Selectable)[]
  ): this {
    columns.forEach((column) => {
      if (Array.isArray(column)) {
        const [columnPart, alias] = column as [string, string];
        this.modelSelectedColumns.push(alias);
        const casedColumn = convertCase(
          columnPart,
          this.model.databaseCaseConvention,
        );
        this.selectNodes.push(new SelectNode(casedColumn, alias));
        return;
      }

      const columnStr = column as string;
      this.modelSelectedColumns.push(columnStr);
      const casedColumn = convertCase(
        columnStr,
        this.model.databaseCaseConvention,
      );
      this.selectNodes.push(new SelectNode(casedColumn));
    });

    return this;
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
   * @description Selects a SQL function applied to a column with a typed alias.
   * @description Provides intellisense for common SQL functions while accepting any custom function.
   * @param func The SQL function name (count, sum, avg, min, max, upper, lower, etc.)
   * @param column The column to apply the function to (use "*" for count(*))
   * @param alias The alias for the result
   * @example
   * .selectFunc("count", "*", "total")
   * .selectFunc("upper", "name", "upperName")
   * .selectFunc("custom_fn", "column", "result")
   */
  selectFunc<A extends string>(
    sqlFunc: SqlFunction,
    column: string,
    alias: A,
  ): this {
    const casedColumn =
      column === "*"
        ? "*"
        : convertCase(column, this.model.databaseCaseConvention);
    this.selectNodes.push(
      new SelectNode(
        `${sqlFunc.toLowerCase()}(${casedColumn}) as ${alias}`,
        undefined,
        undefined,
        true,
      ),
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
}
