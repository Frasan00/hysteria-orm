import { convertCase } from "../../../CaseUtils";
import { SqlDataSourceType } from "../../../Datasource";
import { Model } from "../../Models/Model";

const commonSelectMethods = [
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
        return `"${identifier.replace(/"/g, '""')}"`;
      default:
        throw new Error("Unsupported database type");
    }
  };

  return {
    selectAll: `SELECT * FROM ${table} `,
    selectById: (id: string) => `SELECT * FROM ${table} WHERE id = ${id}`,
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
          commonSelectMethods.includes(columnName.toUpperCase()) ||
          columnName.includes("(")
        ) {
          return alias ? `${columnName} AS ${alias}` : columnName;
        }

        let finalColumn = columnName;
        if (!alias) {
          const processedColumnName = escapeIdentifier(
            convertCase(columnName, columnCase),
          );
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
    selectCount: `SELECT COUNT(*) FROM ${table} `,
    selectDistinct: (...columns: string[]) => {
      columns = columns.map((column) =>
        escapeIdentifier(
          convertCase(column, typeofModel.databaseCaseConvention),
        ),
      );
      return `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `;
    },
    selectSum: (column: string) =>
      `SELECT SUM(${escapeIdentifier(
        convertCase(column, typeofModel.databaseCaseConvention),
      )}) FROM ${table} `,
    orderBy: (columns: string[], order: "ASC" | "DESC" = "ASC") => {
      columns = columns.map((column) =>
        escapeIdentifier(
          convertCase(column, typeofModel.databaseCaseConvention),
        ),
      );
      return ` ORDER BY ${columns.join(", ")} ${order}`;
    },
    groupBy: (...columns: string[]) => {
      columns = columns.map((column) =>
        escapeIdentifier(
          convertCase(column, typeofModel.databaseCaseConvention),
        ),
      );
      return ` GROUP BY ${columns.join(", ")}`;
    },
    limit: (limit: number) => ` LIMIT ${limit}`,
    offset: (offset: number) => ` OFFSET ${offset}`,
  };
};

export default selectTemplate;
