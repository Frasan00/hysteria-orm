import { HysteriaError } from "../../../errors/hysteria_error";
import { convertCase } from "../../../utils/case_utils";
import { Model } from "../../models/model";
import type { SqlDataSourceType } from "../../sql_data_source_types";

const baseSelectMethods = [
  "*",
  "COUNT",
  "DISTINCT",
  "CONCAT",
  "GROUP_CONCAT",
  "AVG",
  "MAX",
  "MIN",
  "SUM",
  "AS",
  "CONVERT",
  "CAST",
  "CONVERT_TZ",
  "DATE_FORMAT",
  "CURDATE",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "CURRENT_TIMESTAMP",
  "CURTIME",
  "DAYNAME",
  "DAYOFMONTH",
  "DAYOFWEEK",
  "DAYOFYEAR",
  "EXTRACT",
  "HOUR",
  "LOCALTIME",
  "LOCALTIMESTAMP",
  "MICROSECOND",
  "MINUTE",
  "MONTH",
  "QUARTER",
  "SECOND",
  "STR_TO_DATE",
  "TIME",
  "TIMESTAMP",
  "WEEK",
  "YEAR",
  "NOW",
  "UTC_DATE",
  "UTC_TIME",
  "UTC_TIMESTAMP",
  "DATE_ADD",
  "DATE_SUB",
  "DATE",
  "DATEDIFF",
  "DATE_FORMAT",
  "DISTINCTROW",
];

const selectTemplate = (
  dbType: SqlDataSourceType,
  typeofModel: typeof Model,
) => {
  const table = typeofModel.table;
  const escapeIdentifier = (identifier: string) => {
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

  return {
    selectAll: `SELECT * FROM ${table} `,
    selectById: (id: string) => `SELECT * FROM ${table} WHERE id = ${id}`,
    selectByIds: (ids: string[]) => {
      ids = ids.map((id) => escapeIdentifier(id) as string);
      return `SELECT * FROM ${table} WHERE id IN (${ids.join(", ")})`;
    },
    selectColumns: (...columns: string[]) => {
      columns = columns.map((column) => {
        const columnCase = typeofModel.databaseCaseConvention;
        let tableName = "";
        let columnName = column;
        let alias = "";

        if (column.toUpperCase().includes(" AS ")) {
          [columnName, alias] = column.split(/ AS /i);
        }
        alias = convertCase(alias, columnCase);

        if (columnName.includes(".")) {
          [tableName, columnName] = columnName.split(".");
        }

        if (
          baseSelectMethods.includes(columnName.toUpperCase()) ||
          columnName.includes("(")
        ) {
          return alias ? `${columnName} AS ${alias}` : columnName;
        }

        let finalColumn = columnName;
        if (!alias) {
          const processedColumnName = escapeIdentifier(
            convertCase(columnName, columnCase),
          ) as string;
          finalColumn = tableName
            ? `${tableName}.${processedColumnName}`
            : processedColumnName;
        } else if (tableName) {
          finalColumn = `${tableName}.${columnName}`;
        }

        return alias ? `${finalColumn} AS ${alias}` : finalColumn;
      });

      return `SELECT ${columns.join(", ")} FROM ${table} `;
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
          convertCase(column, typeofModel.databaseCaseConvention),
        ),
      ) as string[];

      return `DISTINCT ON (${columns.join(", ")})`;
    },
    selectCount: `SELECT COUNT(*) FROM ${table} `,
    selectDistinct: (...columns: string[]) => {
      columns = columns.map((column) =>
        escapeIdentifier(
          convertCase(column, typeofModel.databaseCaseConvention),
        ),
      ) as string[];
      return `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `;
    },
    selectSum: (column: string) =>
      `SELECT SUM(${escapeIdentifier(
        convertCase(column, typeofModel.databaseCaseConvention),
      )}) FROM ${table} `,
    _orderBy: (columns: string[], order: "ASC" | "DESC" = "ASC") => {
      columns = columns.map((column) => {
        let tableName = "";
        let columnName = column;

        if (column.includes(".")) {
          [tableName, columnName] = column.split(".");
        }

        const processedColumnName = convertCase(
          columnName,
          typeofModel.databaseCaseConvention,
        );

        return tableName
          ? `${tableName}.${processedColumnName}`
          : processedColumnName;
      }) as string[];

      return ` ORDER BY ${columns.join(", ")} ${order}`;
    },
    groupBy: (...columns: string[]) => {
      columns = columns.map((column) => {
        let tableName = "";
        let columnName = column;

        if (column.includes(".")) {
          [tableName, columnName] = column.split(".");
        }

        const processedColumnName = convertCase(
          columnName,
          typeofModel.databaseCaseConvention,
        );

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
  };
};

export default selectTemplate;
