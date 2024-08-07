import { camelToSnakeCase } from "../../../CaseUtils";
import * as sqlString from "sqlstring";
import { DataSourceType } from "../../../Datasource";

const selectTemplate = (table: string, dbType: DataSourceType) => {
  const escapeIdentifier = (identifier: string) => {
    switch (dbType) {
      case "mysql":
        return sqlString.escapeId(identifier);
      case "postgres":
        return `"${identifier.replace(/"/g, '""')}"`;
      default:
        throw new Error("Unsupported database type");
    }
  };

  return {
    selectAll: `SELECT * FROM ${table} `,
    selectById: (id: string) =>
      `SELECT * FROM ${table} WHERE id = ${sqlString.escape(id)}`,
    selectColumns: (...columns: string[]) => {
      columns = columns.map((column) => {
        if (column === "*" || column.toLowerCase().includes("as")) {
          return column;
        }
        return escapeIdentifier(camelToSnakeCase(column));
      });
      return `SELECT ${columns.join(", ")} FROM ${table} `;
    },
    selectCount: `SELECT COUNT(*) FROM ${table} `,
    selectDistinct: (...columns: string[]) => {
      columns = columns.map((column) =>
        escapeIdentifier(camelToSnakeCase(column)),
      );
      return `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `;
    },
    selectSum: (column: string) =>
      `SELECT SUM(${escapeIdentifier(
        camelToSnakeCase(column),
      )}) FROM ${table} `,
    orderBy: (columns: string[], order: "ASC" | "DESC" = "ASC") => {
      columns = columns.map((column) =>
        escapeIdentifier(camelToSnakeCase(column)),
      );
      return ` ORDER BY ${columns.join(", ")} ${order}`;
    },
    groupBy: (...columns: string[]) => {
      columns = columns.map((column) =>
        escapeIdentifier(camelToSnakeCase(column)),
      );
      return ` GROUP BY ${columns.join(", ")}`;
    },
    limit: (limit: number) => ` LIMIT ${limit}`,
    offset: (offset: number) => ` OFFSET ${offset}`,
  };
};

export type SelectTemplateType = {
  selectAll: string;
  selectById: (id: string) => string;
  selectColumns: (...columns: string[]) => string;
  selectCount: string;
  selectDistinct: (...columns: string[]) => string;
  selectSum: (column: string) => string;
  orderBy: (columns: string[], order?: "ASC" | "DESC") => string;
  groupBy: (...columns: string[]) => string;
  limit: (limit: number) => string;
  offset: (offset: number) => string;
};

export default selectTemplate;
