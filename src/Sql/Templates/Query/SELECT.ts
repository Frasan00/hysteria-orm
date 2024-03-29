import { camelToSnakeCase } from "../../../CaseUtils";
import * as sqlString from 'sqlstring';

const selectTemplate = (table: string) => {
  return {
    selectAll: `SELECT * FROM ${table} `,
    selectById: (id: string) => `SELECT * FROM ${table} WHERE id = ${sqlString.escape(id)} `,
    selectColumns: (...columns: string[]) => {
      columns = columns.map((column) => {
        if (column === "*" || column.includes("as") || column.includes("AS")) {
          return column;
        }

        return camelToSnakeCase(sqlString.escape(column));
      });
      return `SELECT ${columns.join(", ")} FROM ${table} `;
    },
    selectCount: `SELECT COUNT(*) FROM ${table} `,
    selectDistinct: (...columns: string[]) => {
      columns = columns.map((column) => camelToSnakeCase(sqlString.escape(column)));
      return `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `;
    },
    selectSum: (column: string) =>
      `SELECT SUM(${camelToSnakeCase(sqlString.escape(column))}) FROM ${table} `,
    orderBy: (column: string[], order?: "ASC" | "DESC") => {
      column = column.map((column) => camelToSnakeCase(sqlString.escape(column)));
      return `\nORDER BY ${column.join(", ")} ${order}`;
    },
    groupBy: (...columns: string[]) => {
      columns = columns.map((column) => camelToSnakeCase(sqlString.escape(column)));
      return `\nGROUP BY ${columns.join(", ")} `;
    },
    limit: (limit: number) => `\nLIMIT ${limit} `,
    offset: (offset: number) => `\nOFFSET ${offset} `,
  };
};

export type SelectTemplateType = {
  selectAll: string;
  selectById: (id: string) => string;
  selectColumns: (...columns: string[]) => string;
  selectCount: string;
  selectDistinct: (...columns: string[]) => string;
  selectSum: (column: string) => string;
  orderBy: (column: string[], order?: "ASC" | "DESC") => string;
  groupBy: (...columns: string[]) => string;
  limit: (limit: number) => string;
  offset: (offset: number) => string;
};

export default selectTemplate;
