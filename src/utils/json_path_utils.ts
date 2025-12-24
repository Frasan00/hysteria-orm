import { SqlDataSourceType } from "../sql/sql_data_source_types";

export type JsonPathInput = string | (string | number)[];

export type JsonPathSegment = string | number;

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
