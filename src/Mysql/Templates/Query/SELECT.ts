const selectTemplate = (table: string) => {
  return {
    selectAll: `SELECT * FROM ${table} `,
    selectById: (id: string) => `SELECT * FROM ${table} WHERE id = ${id} `,
    selectColumns: (...columns: string[]) =>
      `SELECT ${columns.join(", ")} FROM ${table} `,
    selectCount: `SELECT COUNT(*) FROM ${table} `,
    selectDistinct: (...columns: string[]) =>
      `SELECT DISTINCT ${columns.join(", ")} FROM ${table} `,
    selectSum: (column: string) => `SELECT SUM(${column}) FROM ${table} `,
    orderBy: (column: string[], order?: "ASC" | "DESC") =>
      `\nORDER BY ${column.join(", ")} ${order}`,
    groupBy: (...columns: string[]) => `\nGROUP BY ${columns.join(", ")} `,
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
