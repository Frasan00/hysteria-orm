import { camelToSnakeCase } from "../../../CaseUtils";

const updateTemplate = (table: string) => {
  return {
    update: (
      columns: string[],
      values: string[],
      primaryKey?: string,
      primaryKeyValue?: string | undefined,
    ) => {
      columns = columns.map((column) => camelToSnakeCase(column));
      return `UPDATE ${table} SET ${columns
        .map((column, index) => parseColumnValue(column, values[index]))
        .filter((column) => column !== undefined)
        .join(", ")} WHERE ${primaryKey} = ${primaryKeyValue};`;
    },
  };
};

function parseColumnValue(column: string, value: any) {
  if (typeof value === "string") {
    return `${column} = '${value}'`;
  }

  if (typeof value === "number") {
    return `${column} = ${value}`;
  }

  if (typeof value === "boolean") {
    return `${column} = ${value ? 1 : 0}`;
  }

  if (value instanceof Date) {
    return `${column} = '${value.toISOString()}'`;
  }

  if (value === null) {
    return `${column} = NULL`;
  }

  if (typeof value === "function") {
    return;
  }

  return `${column} = ${value}`;
}

export default updateTemplate;
