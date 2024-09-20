import { convertCase } from "../../../CaseUtils";
import { DataSourceType } from "../../../Datasource";
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
  "DISTINCTROW",
];
const selectTemplate = (dbType: DataSourceType, typeofModel: typeof Model) => {
  const table = typeofModel.table;
  const escapeIdentifier = (identifier: string) => {
    switch (dbType) {
      case "mysql":
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
        if (
          commonSelectMethods.includes(column.toUpperCase()) ||
          column.includes("(")
        ) {
          return column;
        }
        return escapeIdentifier(
          convertCase(column, typeofModel.databaseCaseConvention),
        );
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
