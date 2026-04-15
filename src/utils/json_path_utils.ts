import type { Model } from "../sql/models/model";
import type { StripTablePrefix } from "../sql/models/model_manager/model_manager_types";
import { SqlDataSourceType } from "../sql/sql_data_source_types";

export type JsonPathInput = string | (string | number)[];

export type JsonPathSegment = string | number;

// ---------------------------------------------------------------------------
// Type-safe JSON path utilities
// ---------------------------------------------------------------------------

/**
 * Recursively generates all valid dot-separated JSON path strings from an
 * object type `T`.
 *
 * Handles nested objects, arrays (via numeric indices), and stops recursion at
 * a configurable depth (default 5) to prevent infinite expansion with deeply
 * nested or self-referential types.
 *
 * @typeParam T - The root object type to extract paths from.
 *
 * @example
 * ```ts
 * type Data = { user: { name: string; roles: string[] }; count: number };
 * type P = JsonPaths<Data>;
 * // "user" | "user.name" | "user.roles" | "user.roles.${number}" | "count"
 * ```
 */
export type JsonPaths<
  T,
  Depth extends number[] = [],
> = Depth["length"] extends 5
  ? never
  : T extends readonly (infer E)[]
    ?
        | `${number}`
        | (NonNullable<E> extends object
            ? `${number}.${JsonPaths<NonNullable<E>, [...Depth, 1]>}`
            : never)
    : T extends object
      ? {
          [K in keyof T & string]:
            | K
            | (NonNullable<T[K]> extends object
                ? `${K}.${JsonPaths<NonNullable<T[K]>, [...Depth, 1]>}`
                : never);
        }[keyof T & string]
      : never;

/**
 * Resolves the TypeScript type of a model column given its `ModelKey` string.
 * Strips any table prefix (e.g. `"users.metadata"` → `"metadata"`) before
 * indexing into the model.
 *
 * @typeParam T - The Model instance type.
 * @typeParam K - The column key (plain or table-prefixed).
 */
export type ResolveColumnType<
  T extends Model,
  K extends string,
> = T[StripTablePrefix<K> & keyof T];

/**
 * Type-safe JSON path input that provides IDE autocompletion for known JSON
 * column structures while still accepting arbitrary strings as a fallback.
 *
 * - When `ColumnType` is a known object/array type: suggests all valid
 *   dot-separated paths via {@link JsonPaths}, plus `(string & {})` as a
 *   catch-all and `(string | number)[]` for the array form.
 * - When `ColumnType` is `unknown`, a primitive, or `never`: falls back to the
 *   original untyped {@link JsonPathInput}.
 *
 * Uses the `SpecificLiteral | (string & {})` pattern so TypeScript's
 * autocomplete shows the known paths first without blocking custom strings.
 *
 * @typeParam ColumnType - The TypeScript type of the JSON column value.
 *
 * @example
 * ```ts
 * type Settings = { theme: string; notifications: { email: boolean } };
 * type P = TypedJsonPathInput<Settings | null>;
 * // "theme" | "notifications" | "notifications.email" | (string & {}) | (string | number)[]
 * ```
 */
/**
 * Resolves the TypeScript type at a given dot-separated JSON path within a
 * root type. Handles `$` prefix, dot notation, and array numeric indices.
 *
 * Falls back to `unknown` when the path does not match the type structure.
 *
 * @typeParam T - The root JSON object type to traverse.
 * @typeParam Path - A dot-separated string path.
 *
 * @example
 * ```ts
 * type Data = { user: { name: string; roles: string[] } };
 * type A = ResolveJsonPathType<Data, "user.name">;    // string
 * type B = ResolveJsonPathType<Data, "user.roles">;   // string[]
 * type C = ResolveJsonPathType<Data, "user">;          // { name: string; roles: string[] }
 * type D = ResolveJsonPathType<Data, "$">;             // Data
 * ```
 */
export type ResolveJsonPathType<
  T,
  Path extends string,
> = Path extends `$.${infer Rest}`
  ? ResolveJsonPathType<T, Rest>
  : Path extends "$" | ""
    ? T
    : Path extends `${infer Head}.${infer Rest}`
      ? Head extends keyof NonNullable<T>
        ? ResolveJsonPathType<NonNullable<T>[Head], Rest>
        : NonNullable<T> extends readonly (infer E)[]
          ? Head extends `${number}`
            ? ResolveJsonPathType<E, Rest>
            : unknown
          : unknown
      : Path extends keyof NonNullable<T>
        ? NonNullable<T>[Path]
        : NonNullable<T> extends readonly (infer E)[]
          ? Path extends `${number}`
            ? E
            : unknown
          : unknown;

export type TypedJsonPathInput<ColumnType> = [NonNullable<ColumnType>] extends [
  never,
]
  ? JsonPathInput
  : unknown extends NonNullable<ColumnType>
    ? JsonPathInput
    : NonNullable<ColumnType> extends object
      ? JsonPaths<NonNullable<ColumnType>> | (string & {}) | (string | number)[]
      : JsonPathInput;

/**
 * @description Standardized JSON path representation for the ORM
 * @description Internally converts user input to a normalized format, then each DB interpreter converts to their specific syntax
 */
export class JsonPath {
  private segments: JsonPathSegment[];

  constructor(path: JsonPathInput) {
    this.segments = this.normalize(path);
  }

  /**
   * @description Normalizes various input formats into a standard array of segments
   * @description Accepts: "$.user.name", "user.name", ["user", "name"], [0, 1, 2]
   */
  private normalize(path: JsonPathInput): JsonPathSegment[] {
    if (Array.isArray(path)) {
      return path;
    }

    if (typeof path === "string") {
      if (!path || path === "$") {
        return [];
      }

      let cleanPath = path.trim();
      cleanPath = cleanPath.startsWith("$.") ? cleanPath.slice(2) : cleanPath;
      cleanPath = cleanPath.startsWith("$") ? cleanPath.slice(1) : cleanPath;
      cleanPath = cleanPath.startsWith(".") ? cleanPath.slice(1) : cleanPath;

      if (!cleanPath) {
        return [];
      }

      return cleanPath.split(".").map((segment) => {
        const asNumber = Number(segment);
        return isNaN(asNumber) ? segment : asNumber;
      });
    }

    return [];
  }

  /**
   * @description Returns segments as an array
   */
  getSegments(): JsonPathSegment[] {
    return [...this.segments];
  }

  /**
   * @description Checks if the path is empty (root $)
   */
  isEmpty(): boolean {
    return this.segments.length === 0;
  }

  /**
   * @description Converts to PostgreSQL syntax (e.g., ->'user'->'name' or ->>'name' for text)
   */
  toPostgres(asText: boolean = false): string {
    if (this.isEmpty()) {
      return "";
    }

    const parts: string[] = [];

    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const isLast = i === this.segments.length - 1;
      const isNumeric = typeof segment === "number";

      if (isLast && asText) {
        parts.push(isNumeric ? `->>${segment}` : `->>'${segment}'`);
      } else {
        parts.push(isNumeric ? `->${segment}` : `->'${segment}'`);
      }
    }

    return parts.join("");
  }

  /**
   * @description Converts to MySQL/SQLite JSON path syntax (e.g., $.user.name)
   */
  toStandardJsonPath(): string {
    if (this.isEmpty()) {
      return "$";
    }

    return `$.${this.segments.join(".")}`;
  }

  /**
   * @description Converts to MySQL syntax with proper array index bracket notation
   * @description Numeric indices use bracket notation: $.items[0].name
   */
  toMysql(): string {
    if (this.isEmpty()) {
      return "$";
    }

    const parts: string[] = ["$"];

    for (const segment of this.segments) {
      if (typeof segment === "number") {
        parts.push(`[${segment}]`);
        continue;
      }
      parts.push(`.${segment}`);
    }

    return parts.join("");
  }

  /**
   * @description Converts to SQLite syntax (same as standard JSON path)
   */
  toSqlite(): string {
    return this.toStandardJsonPath();
  }

  /**
   * @description Converts to MSSQL syntax with proper array index bracket notation
   * @description Numeric indices use bracket notation: $.items[0].name
   */
  toMssql(): string {
    if (this.isEmpty()) {
      return "$";
    }

    const parts: string[] = ["$"];

    for (const segment of this.segments) {
      if (typeof segment === "number") {
        parts.push(`[${segment}]`);
      } else {
        parts.push(`.${segment}`);
      }
    }

    return parts.join("");
  }

  /**
   * @description Converts to Oracle syntax (same as standard JSON path)
   */
  toOracle(): string {
    return this.toStandardJsonPath();
  }

  /**
   * @description Converts to the appropriate syntax for the given database type
   */
  toDbSyntax(dbType: SqlDataSourceType, asText: boolean = false): string {
    switch (dbType) {
      case "postgres":
      case "cockroachdb":
        return this.toPostgres(asText);
      case "mysql":
      case "mariadb":
        return this.toMysql();
      case "sqlite":
        return this.toSqlite();
      case "mssql":
        return this.toMssql();
      case "oracledb":
        return this.toOracle();
      default:
        return this.toStandardJsonPath();
    }
  }

  /**
   * @description Factory method to create a JsonPath from various inputs
   */
  static from(path: JsonPathInput): JsonPath {
    return new JsonPath(path);
  }

  /**
   * @description Creates an empty path (root $)
   */
  static root(): JsonPath {
    return new JsonPath("");
  }
}
