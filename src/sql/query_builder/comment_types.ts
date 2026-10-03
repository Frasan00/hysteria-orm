import type { SqlDataSourceType } from "../sql_data_source_types";

/**
 * PostgreSQL / CockroachDB: `-- line` or `/* block *\/`.
 */
export type PgComment = `--${string}` | `/*${string}*/`;

/**
 * SQLite: `-- line` or `/* block *\/`.
 */
export type SqliteComment = `--${string}` | `/*${string}*/`;

/**
 * SQL Server: `-- line` or `/* block *\/`.
 */
export type MssqlComment = `--${string}` | `/*${string}*/`;

/**
 * MySQL / MariaDB: `-- line` (whitespace required after `--`), `# line`,
 * `/* block *\/` or `/*! executable *\/`.
 */
export type MySqlComment =
  | `-- ${string}`
  | `#${string}`
  | `/*${string}*/`
  | `/*!${string}*/`;

/**
 * A native SQL comment literal valid for the given dialect.
 */
export type SqlComment<D extends SqlDataSourceType> = D extends
  | "mysql"
  | "mariadb"
  ? MySqlComment
  : D extends "postgres" | "cockroachdb"
    ? PgComment
    : D extends "sqlite"
      ? SqliteComment
      : D extends "mssql"
        ? MssqlComment
        : string;

/**
 * An optimizer hint literal. Only MySQL/MariaDB consume `/*+ ... *\/`; on every
 * other dialect `hintComment()` is not callable.
 */
export type SqlHint<D extends SqlDataSourceType> = D extends "mysql" | "mariadb"
  ? `/*+${string}*/`
  : never;
