import { convertCase } from "../../utils/case_utils";
import { AstParser } from "../ast/parser";
import { FromNode } from "../ast/query/node/from";
import { QueryNode } from "../ast/query/query";
import { getModelColumns } from "../models/decorators/model_decorators";
import { ColumnType } from "../models/decorators/model_decorators_types";
import { Model } from "../models/model";
import { SqlDataSourceType } from "../sql_data_source_types";

export class InterpreterUtils {
  private readonly modelColumnsMap: Map<string, ColumnType>;

  constructor(private readonly model: typeof Model) {
    const modelColumns = getModelColumns(model);
    this.modelColumnsMap = new Map(
      modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
    );
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

    await Promise.all(
      filteredColumns.map(async (_, i) => {
        const column = filteredColumns[i];
        const value = filteredValues[i];

        const modelColumn = this.modelColumnsMap.get(column);

        let preparedValue = value;
        if (modelColumn) {
          if (mode === "insert" && modelColumn.prepare) {
            preparedValue = await modelColumn.prepare(value);
          } else if (mode === "update") {
            preparedValue = (await modelColumn.prepare?.(value)) ?? value;
          }
        }

        filteredValues[i] = preparedValue;
      }),
    );

    for (const column of this.modelColumnsMap.keys()) {
      if (!filteredColumns.includes(column)) {
        const modelColumn = this.modelColumnsMap.get(column);
        if (!modelColumn) {
          continue;
        }

        if (
          mode === "insert" &&
          column === (this.model as typeof Model).primaryKey &&
          !modelColumn.prepare
        ) {
          continue;
        }

        if (mode === "insert" || modelColumn.autoUpdate) {
          filteredColumns.push(column);
          const preparedValue = modelColumn.prepare
            ? await modelColumn.prepare(undefined)
            : undefined;
          filteredValues.push(preparedValue ?? undefined);
        }
      }
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
