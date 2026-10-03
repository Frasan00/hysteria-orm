import { QueryNode } from "../../query";

export type JsonMutationOperation = "set" | "insert" | "remove";

/** A JSON path as a `'$.a.b[0]'` JsonPath string or an array of segments. */
export type JsonPath = string | (string | number)[];

/**
 * @description Expression node that mutates a JSON column at a path. Used as an
 * update value (e.g. `update({ meta: sql.jsonSet("meta", "$.a", 1) })`) and can
 * also be projected. `set` replaces an existing value, `insert` keeps it when
 * present, `remove` deletes it.
 */
export class JsonMutationNode extends QueryNode {
  operation: JsonMutationOperation;
  column: string;
  path: JsonPath;
  value?: unknown;
  alias?: string;
  chainsWith = " ";
  canKeywordBeSeenMultipleTimes = false;
  folder = "json_mutation";
  file = "json_mutation";

  constructor(
    operation: JsonMutationOperation,
    column: string,
    path: JsonPath,
    value?: unknown,
    alias?: string,
  ) {
    super("json_mutation");
    this.operation = operation;
    this.column = column;
    this.path = path;
    this.value = value;
    this.alias = alias;
  }
}

export const jsonSet = (
  column: string,
  path: JsonPath,
  value: unknown,
  alias?: string,
): JsonMutationNode => new JsonMutationNode("set", column, path, value, alias);

export const jsonInsert = (
  column: string,
  path: JsonPath,
  value: unknown,
  alias?: string,
): JsonMutationNode =>
  new JsonMutationNode("insert", column, path, value, alias);

export const jsonRemove = (
  column: string,
  path: JsonPath,
  alias?: string,
): JsonMutationNode =>
  new JsonMutationNode("remove", column, path, undefined, alias);

const SIMPLE_KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Normalizes a JsonPath (string or segment array) into segments. */
export function normalizeJsonPath(path: JsonPath): (string | number)[] {
  if (Array.isArray(path)) {
    return path;
  }

  const segments: (string | number)[] = [];
  const clean = path.replace(/^\$/, "");
  const re = /\.([^.[\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(clean)) !== null) {
    if (match[1] !== undefined) {
      segments.push(match[1]);
    } else {
      segments.push(Number(match[2]));
    }
  }
  return segments;
}

/** Renders a canonical `'$.a.b[0]'` JsonPath string (MySQL/SQLite/MSSQL). */
export function toJsonPathString(path: JsonPath): string {
  const segments = normalizeJsonPath(path);
  return (
    "$" +
    segments
      .map((segment) =>
        typeof segment === "number"
          ? `[${segment}]`
          : SIMPLE_KEY.test(segment)
            ? `.${segment}`
            : `["${segment.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"]`,
      )
      .join("")
  );
}

/** Renders a PostgreSQL `text[]` path literal, e.g. `'{a,b,0}'`. */
export function toPgTextArray(path: JsonPath): string {
  const segments = normalizeJsonPath(path);
  const items = segments.map((segment) => {
    const value = String(segment);
    if (/^[A-Za-z0-9_]+$/.test(value)) {
      return value;
    }
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  });
  return `'{${items.join(",")}}'`;
}
