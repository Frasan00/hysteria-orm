import { convertCase } from "../../utils/case_utils";
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

export class InterpreterUtils {
  private readonly modelColumnsMap: Map<string, ColumnType>;
  // Pre-computed at construction: columns that always need processing during writes.
  // Avoids scanning all model columns on every prepareColumns() call.
  private readonly autoInsertColumns: ColumnType[];
  private readonly autoUpdateColumns: ColumnType[];

  constructor(private readonly model: typeof Model) {
    // Raw models (from sql.from("table")) are plain objects without Model methods.
    // Fall back to an empty Map — prepareColumns will JSON-stringify plain objects
    // and skip all prepare/autoUpdate logic (correct for schema-less raw queries).
    this.modelColumnsMap =
      typeof model.getColumnsByName === "function"
        ? model.getColumnsByName()
        : new Map();

    const autoInsert: ColumnType[] = [];
    const autoUpdate: ColumnType[] = [];
    for (const col of this.modelColumnsMap.values()) {
      // Insert auto-columns: those with prepare OR autoUpdate (mirrors the original condition)
      if (col.prepare || col.autoUpdate) autoInsert.push(col);
      // Update auto-columns: only autoUpdate ones (prepare-only columns are not auto-added on update)
      if (col.autoUpdate) autoUpdate.push(col);
    }
    this.autoInsertColumns = autoInsert;
    this.autoUpdateColumns = autoUpdate;
  }

  formatStringColumn(dbType: SqlDataSourceType, column: string): string {
    if (column === "*") {
      return "*";
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
          case "oracledb":
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
        case "oracledb":
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
      case "oracledb":
        return `"${casedColumn}"`;
      case "mssql":
        return `[${casedColumn}]`;
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
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
      case "oracledb":
        return `"${table}"${alias ? ` as "${alias}"` : ""}`;
      case "mssql":
        return `[${table}]${alias ? ` as [${alias}]` : ""}`;
      default:
        return `${table}${alias ? ` as ${alias}` : ""}`;
    }
  }

  async prepareColumns(
    columns: string[],
    values: any[],
    mode: "insert" | "update" = "insert",
  ): Promise<{ columns: string[]; values: any[] }> {
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

    // Track which columns are already present for O(1) lookup when adding auto-columns
    const presentColumnsSet = new Set<string>(filteredColumns);

    // Deferred async prepare calls — avoids Promise overhead for sync prepare functions
    let deferredAsync: Array<{ index: number; promise: Promise<any> }> | null =
      null;

    for (let i = 0; i < filteredColumns.length; i++) {
      const column = filteredColumns[i];
      const value = filteredValues[i];

      const modelColumn = this.modelColumnsMap.get(column);

      if (modelColumn) {
        if (modelColumn.prepare) {
          const prepared =
            mode === "insert"
              ? modelColumn.prepare(value)
              : (modelColumn.prepare(value) ?? value);

          if (
            prepared !== null &&
            typeof (prepared as any)?.then === "function"
          ) {
            if (!deferredAsync) deferredAsync = [];
            deferredAsync.push({ index: i, promise: prepared as Promise<any> });
          } else {
            filteredValues[i] = prepared;
          }
        }
      } else if (isPlainObjectOrArray(value)) {
        filteredValues[i] = JSON.stringify(value);
      }
    }

    // Resolve any async prepare calls collected during the sync pass all at once
    if (deferredAsync) {
      const resolved = await Promise.all(deferredAsync.map((d) => d.promise));
      for (let i = 0; i < deferredAsync.length; i++) {
        filteredValues[deferredAsync[i].index] = resolved[i];
      }
    }

    // Add columns that need automatic processing but weren't in the provided payload.
    // Uses pre-computed lists to avoid scanning all model columns on every call.
    const primaryKey = (this.model as typeof Model).primaryKey;
    const autoColumns =
      mode === "insert" ? this.autoInsertColumns : this.autoUpdateColumns;

    for (const modelColumn of autoColumns) {
      const column = modelColumn.columnName;
      if (presentColumnsSet.has(column)) {
        continue;
      }

      if (mode === "insert" && column === primaryKey && !modelColumn.prepare) {
        continue;
      }

      filteredColumns.push(column);
      const preparedValue = modelColumn.prepare
        ? await modelColumn.prepare(undefined)
        : undefined;
      filteredValues.push(preparedValue ?? undefined);
    }

    return { columns: filteredColumns, values: filteredValues };
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
