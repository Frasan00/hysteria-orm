import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { getModelColumns } from "../../models/decorators/model_decorators";
import { Model } from "../../models/model";
import { QueryBuilder } from "../../query_builder/query_builder";
import type { SqlDataSourceType } from "../../sql_data_source_types";

export type UnionCallBack<T extends Model> = (
  queryBuilder: QueryBuilder<T>,
) => QueryBuilder<T>;

export type SqlMethod =
  // Aggregates
  | "sum"
  | "avg"
  | "max"
  | "min"
  | "count"
  // String
  | "concat"
  | "substring"
  | "upper"
  | "lower"
  | "trim"
  | "replace"
  | "length"
  // Date/Time
  | "date"
  | "year"
  | "month"
  | "day"
  | "hour"
  | "minute"
  | "second"
  | "extract"
  | "now"
  | "current_date"
  | "current_time"
  | "current_timestamp"
  // Type conversion
  | "cast"
  | "convert"
  // Other
  | "coalesce"
  | "ifnull"
  | "nullif"
  | "abs"
  | "round"
  | "floor"
  | "ceil";

const selectTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const table = typeofModel.table;
  const escapeIdentifier = (identifier: string) => {
    if (identifier.includes("*")) {
      return identifier;
    }

    switch (dbType) {
      case "mysql":
      case "sqlite":
      case "mariadb":
        return `\`${identifier.replace(/`/g, "``")}\``;
      case "postgres":
      case "cockroachdb":
        return `"${identifier.replace(/"/g, '""')}"`;
      default:
        throw new HysteriaError(
          "SelectTemplate::escapeIdentifier",
          `UNSUPPORTED_DATABASE_TYPE_${dbType}`,
        );
    }
  };

  const modelColumns = getModelColumns(typeofModel);
  const modelColumnsMap = new Map(
    modelColumns.map((modelColumn) => [modelColumn.columnName, modelColumn]),
  );

  return {
    annotate: (column: string, alias: string, method?: string) => {
      let statement: string;

      if (column.includes(".")) {
        const [tableName, columnName] = column.split(".");
        const escapedTable = escapeIdentifier(tableName);
        const escapedColumn = escapeIdentifier(
          convertCase(columnName, typeofModel.databaseCaseConvention),
        );
        statement = `${escapedTable}.${escapedColumn}`;
      } else {
        statement = escapeIdentifier(
          convertCase(column, typeofModel.databaseCaseConvention),
        );
      }

      if (method) {
        statement = `${method}(${statement})`;
      }

      return ` ${statement} AS ${escapeIdentifier(alias)}`;
    },
    selectAll: (fromTable: string = table) =>
      `SELECT ${fromTable}.* FROM ${fromTable} `,
    selectColumns: (columns: string[]) => {
      if (!columns.length) {
        columns = ["*"];
      }

      columns = columns.map((column) => {
        let columnName = column.trim();
        let tableName = "";

        if (columnName.includes(".")) {
          [tableName, columnName] = columnName.split(".");
          if (columnName.trim() === "*") {
            return `${tableName}.*`;
          }

          const processedColumnName = escapeIdentifier(
            modelColumnsMap.get(columnName.trim())?.databaseName ??
              convertCase(
                columnName.trim(),
                typeofModel.databaseCaseConvention,
              ),
          );

          return `${tableName}.${processedColumnName}`;
        }

        if (columnName.trim() === "*") {
          return "*";
        }

        const processedColumnName = escapeIdentifier(
          modelColumnsMap.get(columnName.trim())?.databaseName ??
            convertCase(columnName.trim(), typeofModel.databaseCaseConvention),
        );

        return processedColumnName;
      });

      return `SELECT ${columns.join(", ")} `;
    },
    distinct: `DISTINCT`,
    distinctOn: (...columns: string[]) => {
      if (dbType !== "postgres") {
        throw new HysteriaError(
          "SelectTemplate::distinctOn",
          `DISTINCT_ON_NOT_SUPPORTED_IN_${dbType}`,
        );
      }

      columns = columns.map((column) =>
        escapeIdentifier(
          modelColumnsMap.get(column)?.databaseName ??
            convertCase(column, typeofModel.databaseCaseConvention),
        ),
      ) as string[];

      return `DISTINCT ON (${columns.join(", ")})`;
    },
    selectCount: (fromTable: string = table) =>
      `SELECT COUNT(*) FROM ${fromTable} `,
    selectDistinct: (fromTable: string = table, columns: string[]) => {
      columns = columns.map((column) =>
        escapeIdentifier(
          modelColumnsMap.get(column)?.databaseName ??
            convertCase(column, typeofModel.databaseCaseConvention),
        ),
      ) as string[];
      return `SELECT DISTINCT ${columns.join(", ")} FROM ${fromTable} `;
    },
    groupBy: (...columns: string[]) => {
      columns = columns.map((column) => {
        let tableName = "";
        let columnName = column;

        if (column.includes(".")) {
          [tableName, columnName] = column.split(".");
        }

        const processedColumnName =
          modelColumnsMap.get(columnName)?.databaseName ??
          convertCase(columnName, typeofModel.databaseCaseConvention);

        return tableName
          ? `${tableName}.${processedColumnName}`
          : processedColumnName;
      }) as string[];

      return ` GROUP BY ${columns.join(", ")}`;
    },
    limit: (limit: number) => {
      return ` LIMIT ${limit}`;
    },
    offset: (offset: number) => {
      return ` OFFSET ${offset}`;
    },
    skipLocked: () => {
      switch (dbType) {
        case "mysql":
        case "mariadb":
        case "postgres":
        case "cockroachdb":
          return " SKIP LOCKED ";
        default:
          throw new HysteriaError(
            "SelectTemplate::skipLocked",
            `SKIP_LOCKED_NOT_SUPPORTED_IN_${dbType}`,
          );
      }
    },
    forShare: () => {
      switch (dbType) {
        case "mysql":
        case "mariadb":
          return " LOCK IN SHARE MODE ";
        case "postgres":
        case "cockroachdb":
          return " FOR SHARE";
        default:
          throw new HysteriaError(
            "SelectTemplate::forShare",
            `FOR_SHARE_NOT_SUPPORTED_IN_${dbType}`,
          );
      }
    },
    lockForUpdate: () => {
      switch (dbType) {
        case "mysql":
        case "mariadb":
        case "postgres":
        case "cockroachdb":
          return " FOR UPDATE ";
        default:
          throw new HysteriaError(
            "SelectTemplate::lockForUpdate",
            `LOCK_FOR_UPDATE_NOT_SUPPORTED_${dbType}`,
          );
      }
    },
  };
};

export default selectTemplate;
