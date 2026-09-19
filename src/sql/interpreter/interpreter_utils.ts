import { convertCase } from "../../utils/case_utils";
import { getDate } from "../../utils/date_utils";
import { AstParser } from "../ast/parser";
import { FromNode } from "../ast/query/node/from";
import { QueryNode } from "../ast/query/query";
import { ColumnType } from "../models/decorators/model_decorators_types";
import { Model } from "../models/model";
import { SqlDataSourceType } from "../sql_data_source_types";

const isPlainObjectOrArray = (value: unknown): boolean => {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value !== "object") {
    return false;
  }

  if (value instanceof Date) {
    return false;
  }

  if (Array.isArray(value)) {
    return true;
  }

  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * @description Whether a column holds a date/time value, i.e. one whose
 * `prepare` may legitimately hand the driver a `Date`. Computed and non-date
 * columns are excluded so an unrelated Date is never rewritten.
 */
const isDateColumnType = (modelColumn: ColumnType): boolean =>
  !modelColumn.expression &&
  (modelColumn.type === "date" ||
    modelColumn.type === "datetime" ||
    modelColumn.type === "timestamp");

export class InterpreterUtils {
  private readonly modelColumnsMap: Map<string, ColumnType>;
  // Pre-computed at construction: columns that MUST be generated in JS when absent
  // from an INSERT payload because no DB default covers them (ulid, custom fns).
  // Avoids scanning all model columns on every prepareColumns() call.
  private readonly jsInsertColumns: ColumnType[];
  // Pre-computed: columns re-prepared on every UPDATE even when the caller omitted
  // them (`autoUpdate`), e.g. an `updated_at` timestamp.
  private readonly autoUpdateColumns: ColumnType[];

  constructor(private readonly model: typeof Model) {
    // Raw models (from sql.from("table")) are plain objects without Model methods.
    // Fall back to an empty Map — prepareColumns will JSON-stringify plain objects
    // and skip all prepare/autoUpdate logic (correct for schema-less raw queries).
    this.modelColumnsMap =
      typeof model.getColumnsByName === "function"
        ? model.getColumnsByName()
        : new Map();

    const jsInsert: ColumnType[] = [];
    const autoUpdate: ColumnType[] = [];
    for (const col of this.modelColumnsMap.values()) {
      if (col.expression) continue;
      if (col.type === "ulid" || col.autoCreate === "js") jsInsert.push(col);
      if (col.autoUpdate) autoUpdate.push(col);
    }
    this.jsInsertColumns = jsInsert;
    this.autoUpdateColumns = autoUpdate;
  }

  formatStringColumn(dbType: SqlDataSourceType, column: string): string {
    if (column === "*") {
      return "*";
    }

    // Computed (virtual) columns resolve to their raw SQL expression so that
    // references in WHERE / ORDER BY / GROUP BY / HAVING / JOIN ON evaluate the
    // expression at query time instead of referencing a non-existent column.
    const computedExpression = this.resolveComputedExpression(column);
    if (computedExpression !== undefined) {
      return `(${computedExpression})`;
    }

    const hasTable = column.includes(".");
    if (hasTable) {
      const [table, foundColumn] = column.split(".");

      if (foundColumn === "*") {
        switch (dbType) {
          case "mysql":
          case "mariadb":
            return `\`${table}\`.*`;
          case "postgres":
          case "cockroachdb":
          case "sqlite":
            return `"${table}".*`;
          case "mssql":
            return `[${table}].*`;
          default:
            throw new Error(`Unsupported database type: ${dbType}`);
        }
      }

      const casedColumn =
        this.modelColumnsMap.get(foundColumn)?.databaseName ??
        convertCase(foundColumn, this.model.databaseCaseConvention);

      switch (dbType) {
        case "mysql":
        case "mariadb":
          return `\`${table}\`.\`${casedColumn}\``;
        case "postgres":
        case "cockroachdb":
        case "sqlite":
          return `"${table}"."${casedColumn}"`;
        case "mssql":
          return `[${table}].[${casedColumn}]`;
        default:
          throw new Error(`Unsupported database type: ${dbType}`);
      }
    }

    const casedColumn =
      this.modelColumnsMap.get(column)?.databaseName ??
      convertCase(column, this.model.databaseCaseConvention);

    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\`${casedColumn}\``;
      case "postgres":
      case "cockroachdb":
      case "sqlite":
        return `"${casedColumn}"`;
      case "mssql":
        return `[${casedColumn}]`;
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  /**
   * @description Returns the raw SQL expression of a computed column, if the given
   * reference points to one. Strips an optional table prefix before looking up the
   * model column metadata. Returns `undefined` for non-computed columns.
   * @internal
   */
  resolveComputedExpression(column: string): string | undefined {
    const bareColumn = column.includes(".")
      ? (column.split(".").pop() as string)
      : column;
    const meta = this.modelColumnsMap.get(bareColumn);
    return meta?.expression;
  }

  /**
   * @description Returns true if the given column name (model property name)
   * refers to a computed (virtual) column.
   * @internal
   */
  isComputedColumn(column: string): boolean {
    return !!this.modelColumnsMap.get(column)?.expression;
  }

  /**
   * @description Removes computed (virtual) columns from a list of column names.
   * Computed columns are never persisted and must not appear in INSERT, UPDATE,
   * or ON CONFLICT / ON DUPLICATE KEY UPDATE clauses.
   * @internal
   */
  filterComputedColumns(columns: string[]): string[] {
    if (this.modelColumnsMap.size === 0) return columns;
    return columns.filter((col) => !this.isComputedColumn(col));
  }

  /**
   * @description Strips computed (virtual) columns from a data object.
   * Used before building AST nodes so computed columns never appear in
   * generated SQL (neither in execution nor in `toSql()` / `unWrap()` previews).
   * @internal
   */
  stripComputedFromData<T extends Record<string, any>>(data: T): T {
    if (this.modelColumnsMap.size === 0) return data;
    const result: Record<string, any> = {};
    for (const key of Object.keys(data)) {
      if (!this.isComputedColumn(key)) {
        result[key] = data[key];
      }
    }
    return result as T;
  }

  /**
   * @description Formats a column WITHOUT table qualification.
   * ON CONFLICT target lists (Postgres/SQLite) and `excluded.<col>` refs require
   * bare column names; table-qualified ModelKey refs like "sets.id" must reduce to
   * "id". Mirrors formatStringColumn's qualified branch (split(".")[1]) so the
   * bare output is identical minus the "table". prefix.
   */
  formatStringColumnBare(dbType: SqlDataSourceType, column: string): string {
    const bareColumn = column.includes(".") ? column.split(".")[1] : column;
    return this.formatStringColumn(dbType, bareColumn);
  }

  /**
   * @description Whether the dialect has a returning clause for UPDATE/DELETE at all.
   * Pure syntax capability — no model involved. MariaDB has RETURNING for
   * INSERT/DELETE only, and MySQL never has it.
   */
  dialectEmitsReturning(dbType: SqlDataSourceType): boolean {
    switch (dbType) {
      case "postgres":
      case "cockroachdb":
      case "sqlite":
      case "mssql":
        return true;
      default:
        return false;
    }
  }

  /**
   * @description Whether a write may skip its follow-up re-fetch by using the
   * dialect's returning clause.
   *
   * Two dialects are excluded on correctness rather than syntax: sqlite (UPDATE
   * only) because the ORM's autoUpdate trigger is AFTER UPDATE, so RETURNING hands
   * back the pre-trigger value while a re-fetch sees the new one; and mssql
   * entirely, because OUTPUT without INTO is rejected on any table with an enabled
   * trigger — which includes every model with an autoUpdate column.
   */
  shouldFetchNatively(
    dbType: SqlDataSourceType,
    op: "update" | "delete",
  ): boolean {
    if (!this.dialectEmitsReturning(dbType)) {
      return false;
    }

    if (dbType === "mssql") {
      return false;
    }

    if (dbType === "sqlite" && op === "update") {
      for (const column of this.modelColumnsMap.values()) {
        if (column.autoUpdate) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * @description A computed column has no stored value — formatStringColumn would
   * emit its raw expression and the returned key could not be mapped back.
   */
  hasComputedColumn(columns: string[]): boolean {
    return columns.some((column) => this.isComputedColumn(column));
  }

  /**
   * @description Returns the model-property name the given model-property column
   * resolves to in the database, or undefined for non-model / unqualified refs.
   * @internal
   */
  resolveColumnAlias(dbType: SqlDataSourceType, column: string): string {
    const meta = this.modelColumnsMap.get(column);
    if (!meta || meta.columnName === meta.databaseName) {
      return "";
    }
    switch (dbType) {
      case "mssql":
        return ` as [${meta.columnName}]`;
      case "mysql":
      case "mariadb":
        return ` as \`${meta.columnName}\``;
      case "postgres":
      case "cockroachdb":
      case "sqlite":
        return ` as "${meta.columnName}"`;
      default:
        return "";
    }
  }

  /**
   * @description Formats the table name for the database type, idempotent for quoting
   */
  formatStringTable(dbType: SqlDataSourceType, table: string): string {
    // Table normalization
    table = table.replace(/\s+/g, " ").trim();
    let alias = "";
    if (table.toLowerCase().includes(" as ")) {
      [table, alias] = table.split(" as ");
    }

    switch (dbType) {
      case "mysql":
      case "mariadb":
        return `\`${table}\`${alias ? ` as \`${alias}\`` : ""}`;
      case "postgres":
      case "cockroachdb":
      case "sqlite":
        return `"${table}"${alias ? ` as "${alias}"` : ""}`;
      case "mssql":
        return `[${table}]${alias ? ` as [${alias}]` : ""}`;
      default:
        return `${table}${alias ? ` as ${alias}` : ""}`;
    }
  }

  prepareColumns(
    columns: string[],
    values: any[],
    mode: "insert" | "update" = "insert",
    dbType: SqlDataSourceType = "postgres",
  ): { columns: string[]; values: any[] } {
    if (!columns.length) {
      return { columns, values };
    }

    const filteredColumns: string[] = [];
    const filteredValues: any[] = [];

    for (let i = 0; i < columns.length; i++) {
      const column = columns[i];
      const value = values[i];

      if (column === "*") {
        continue;
      }

      filteredColumns.push(column);
      filteredValues.push(value);
    }

    // MySQL/MariaDB uuid primary keys are generated in JS so handleMysqlInsert can
    // re-fetch by the explicit id; every other uuid column defers to the DB default.
    const jsUuidPrimaryKey = dbType === "mysql" || dbType === "mariadb";

    for (let i = 0; i < filteredColumns.length; i++) {
      const column = filteredColumns[i];
      const value = filteredValues[i];

      const modelColumn = this.modelColumnsMap.get(column);

      // Computed columns are never persisted — drop them silently from insert/update.
      if (modelColumn?.expression) {
        filteredColumns.splice(i, 1);
        filteredValues.splice(i, 1);
        i--;
        continue;
      }

      if (!modelColumn) {
        if (isPlainObjectOrArray(value)) {
          filteredValues[i] = JSON.stringify(value);
        }
        continue;
      }

      // Columns with a DB-side default are omitted when nullish so the database
      // generates them (uuid → gen_random_uuid()/NEWID()/…, datetime autoCreate → now).
      // MySQL/MariaDB have no uuid DB default (see mysql column_type), so uuid must
      // stay in the payload (NULL for nullable columns, same as 11.x).
      if (value === null || value === undefined) {
        const dbDefaulted =
          modelColumn.autoCreate === true ||
          (modelColumn.type === "uuid" &&
            dbType !== "mysql" &&
            dbType !== "mariadb");
        if (dbDefaulted) {
          filteredColumns.splice(i, 1);
          filteredValues.splice(i, 1);
          i--;
          continue;
        }
      }

      if (modelColumn.prepare) {
        const prepared =
          mode === "insert"
            ? modelColumn.prepare(value)
            : (modelColumn.prepare(value) ?? value);

        if (prepared !== null && typeof prepared?.then === "function") {
          throw new Error(
            `hysteria-orm: prepare on column "${column}" on model "${this.model.name}" returned a Promise, but prepare must be synchronous.`,
          );
        }

        filteredValues[i] = prepared;
      }

      // SQLite has no date type: the column is TEXT and the value is stored as
      // written. Neither `node-sqlite3` nor `bun:sqlite` can bind a Date, so a
      // Date reaching the driver is coerced to epoch milliseconds
      // (`1577934245000.0`), which the read path cannot parse back — the model
      // receives an Invalid Date. The column decorator's prepare() returns a Date
      // by design (it is driver-agnostic), so the conversion happens here, right
      // before the value is bound.
      //
      // The format matches what the database itself writes for an autoCreate
      // column (`default current_timestamp`), so a column never mixes
      // representations, which would break ordering and comparisons. The column's
      // `timezone` option is not retained on ColumnType, so UTC is used — also the
      // decorator's default. Other drivers bind Dates correctly and are untouched.
      if (
        dbType === "sqlite" &&
        filteredValues[i] instanceof Date &&
        isDateColumnType(modelColumn)
      ) {
        filteredValues[i] = getDate(filteredValues[i] as Date, "ISO", "UTC");
      }
    }

    // Columns with only JS-side generation (ulid, custom autoCreate callbacks, and
    // MySQL/MariaDB uuid PKs) are added when absent from the payload.
    if (mode === "insert") {
      const presentColumnsSet = new Set<string>(columns);
      for (const modelColumn of this.jsInsertColumns) {
        if (presentColumnsSet.has(modelColumn.columnName)) continue;
        this.generateJsInsertColumn(
          modelColumn,
          filteredColumns,
          filteredValues,
          dbType,
        );
      }

      if (jsUuidPrimaryKey) {
        const primaryKey = (this.model as typeof Model).primaryKey;
        if (primaryKey) {
          const pkColumn = this.modelColumnsMap.get(primaryKey);
          if (
            pkColumn &&
            pkColumn.type === "uuid" &&
            pkColumn.isPrimary &&
            !presentColumnsSet.has(primaryKey)
          ) {
            this.generateJsInsertColumn(
              pkColumn,
              filteredColumns,
              filteredValues,
              dbType,
            );
          }
        }
      }
    } else {
      // `autoUpdate` columns are re-prepared on every UPDATE, whether or not the
      // caller supplied them — that is the whole point of the flag (its `prepare`
      // returns the update timestamp). 12.0.0 dropped this when it removed the
      // autoUpdateColumns list, which left `col.datetime({ autoUpdate: true })`
      // inert and `updated_at` frozen. The ORM cannot know which rows a bulk
      // UPDATE touches, so this applies to payload-driven updates only.
      const presentColumnsSet = new Set<string>(columns);
      for (const modelColumn of this.autoUpdateColumns) {
        if (presentColumnsSet.has(modelColumn.columnName)) continue;

        // The column decorator's prepare() branches on whether it was handed a
        // value: falsy → the create value (or null), truthy → the update value.
        // An autoUpdate-only column has no autoCreate, so prepare(undefined)
        // yields null and would null the column out; hand it a value instead so
        // it takes the update branch, which is what the flag promises.
        const prepared = modelColumn.prepare?.(new Date());
        if (prepared === null || prepared === undefined) {
          continue;
        }
        if (typeof (prepared as { then?: unknown })?.then === "function") {
          throw new Error(
            `hysteria-orm: prepare on column "${modelColumn.columnName}" on model "${this.model.name}" returned a Promise, but prepare must be synchronous.`,
          );
        }

        filteredColumns.push(modelColumn.columnName);
        filteredValues.push(
          // Same sqlite Date limitation as the supplied-value path above.
          dbType === "sqlite" &&
            prepared instanceof Date &&
            isDateColumnType(modelColumn)
            ? getDate(prepared, "ISO", "UTC")
            : prepared,
        );
      }
    }

    return { columns: filteredColumns, values: filteredValues };
  }

  private generateJsInsertColumn(
    modelColumn: ColumnType,
    columns: string[],
    values: any[],
    dbType: SqlDataSourceType,
  ): void {
    const prepared = modelColumn.prepare?.(undefined);
    if (prepared !== null && typeof prepared?.then === "function") {
      throw new Error(
        `hysteria-orm: prepare on column "${modelColumn.columnName}" on model "${this.model.name}" returned a Promise, but prepare must be synchronous.`,
      );
    }
    columns.push(modelColumn.columnName);
    values.push(
      dbType === "sqlite" &&
        prepared instanceof Date &&
        isDateColumnType(modelColumn)
        ? getDate(prepared, "ISO", "UTC")
        : (prepared ?? undefined),
    );
  }

  /**
   * @description Formats the from node for write operations removing the "from" keyword
   */
  getFromForWriteOperations(
    dbType: SqlDataSourceType,
    fromNode: FromNode,
  ): string {
    if (typeof fromNode.table === "string") {
      return this.formatStringTable(dbType, fromNode.table);
    }

    const astParser = new AstParser(this.model, dbType);
    if (Array.isArray(fromNode.table)) {
      return `(${astParser.parse(fromNode.table).sql})`;
    }

    return `(${astParser.parse([fromNode.table as QueryNode]).sql})`;
  }
}
