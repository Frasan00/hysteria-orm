import { HysteriaError } from "../../errors/hysteria_error";

export function convertValueToSQL(value: any, type: string): string {
  switch (type) {
    case "string":
      return `'${value}'`;
    case "number":
    case "boolean":
      return `${value}`;
    default:
      throw new HysteriaError(
        "convertValueToSQL",
        `UNSUPPORTED_DATABASE_TYPE_${type}`,
      );
  }
}

export function stripIdentifierQuotes(identifier: string): string {
  return identifier.replace(/^[`"]|[`"]$/g, "");
}

export function remapSelectedColumnToFromAlias(
  column: string,
  fromAlias: string,
  modelTable: string,
): string {
  if (!column.includes(".")) {
    const cleanCol = stripIdentifierQuotes(column);
    return `${fromAlias}.${cleanCol}`;
  }

  let [table, col] = column.split(".");
  table = stripIdentifierQuotes(table);
  col = stripIdentifierQuotes(col);

  if (table !== modelTable) {
    return column;
  }

  if (col === "*") {
    return `${fromAlias}.*`;
  }

  return `${fromAlias}.${col}`;
}
