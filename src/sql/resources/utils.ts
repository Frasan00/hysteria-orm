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

export function getColumnValue(column: string | (() => string)) {
  return typeof column === "function" ? column() : column;
}

export const deepCloneNode = (val: any, seen = new WeakMap()): any => {
  if (val === null || typeof val !== "object") {
    return val;
  }

  if (seen.has(val)) {
    return seen.get(val);
  }

  if (Array.isArray(val)) {
    const arr: any[] = [];
    seen.set(val, arr);
    for (let i = 0; i < val.length; i++) {
      arr[i] = deepCloneNode(val[i], seen);
    }
    return arr;
  }

  const out: any = Object.create(Object.getPrototypeOf(val) || {});
  seen.set(val, out);

  for (const key of Object.getOwnPropertyNames(val)) {
    const v = (val as any)[key];
    if (typeof v === "function") {
      out[key] = v;
      continue;
    }

    out[key] = deepCloneNode(v, seen);
  }

  return out;
};
