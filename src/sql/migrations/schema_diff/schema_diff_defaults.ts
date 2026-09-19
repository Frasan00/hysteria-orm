import type { ColumnType } from "../../models/decorators/model_decorators_types";
import type { SqlDataSourceType } from "../../sql_data_source_types";

/**
 * @description Normalises a reported default value for comparison: strips a
 * postgres-style cast suffix, parentheses and whitespace.
 */
const normalizeReportedDefault = (value: unknown): string =>
  String(value ?? "")
    .replace(/::[a-z_ ]+$/i, "")
    .replace(/[()\s]/g, "")
    .toLowerCase();

/**
 * @description Implicit `default current_timestamp`-family defaults that a
 * date/time column declared `autoCreate: true` receives from the column
 * interpreter. Dialects report them differently: PostgreSQL/CockroachDB
 * normalise `CURRENT_TIMESTAMP` to `now()`, MSSQL reports `getdate()`, and
 * MySQL/MariaDB may append a precision (`current_timestamp(6)`).
 */
const TIMESTAMP_DEFAULT_PATTERN =
  /^(current[ _]?timestamp\d*|now\d*|getdate\d*|localtimestamp\d*|localtime\d*)$/;

/**
 * @description Implicit per-dialect defaults for an auto-incrementing column.
 * PostgreSQL reports a sequence call; CockroachDB's `serial` reports
 * `unique_rowid()`. Neither is expressed on the model, and dropping either
 * breaks inserts.
 */
const IMPLICIT_INCREMENT_DEFAULTS: Record<string, (v: string) => boolean> = {
  postgres: (v) => v.includes("nextval"),
  cockroachdb: (v) => v.includes("unique_rowid"),
};

const IMPLICIT_UUID_DEFAULTS: Record<string, readonly string[]> = {
  postgres: ["gen_random_uuid"],
  cockroachdb: ["gen_random_uuid"],
  mysql: ["uuid"],
  mariadb: ["uuid"],
  mssql: ["newid"],
  sqlite: ["lower(hex(randomblob(16)))"],
};

/**
 * @description Whether the DB default on a uuid column is the implicit one the
 * column interpreter emits (as opposed to an explicit model constraint), so a
 * re-sync does not drop it.
 */
export const isImplicitUuidDefault = (
  dialect: SqlDataSourceType,
  dbDefault: unknown,
): boolean =>
  (IMPLICIT_UUID_DEFAULTS[dialect] ?? []).includes(
    normalizeReportedDefault(dbDefault),
  );

/**
 * @description Whether the DB default belongs to a column declared
 * `autoCreate: true`.
 *
 * The ORM omits such a column from INSERT because it expects the database to
 * generate the value, and the model records it as `autoCreate` rather than
 * `constraints.default` (the date column options deliberately omit `default`).
 * Without this, the differ reads the column as model-has-none / db-has-one and
 * emits a destructive `drop default` — leaving a schema where every insert fails
 * with a NOT NULL violation, which the generated migration cannot detect.
 */
export const isImplicitAutoCreateDefault = (
  modelColumn: Pick<ColumnType, "autoCreate">,
  dbDefault: unknown,
): boolean =>
  Boolean(modelColumn.autoCreate) &&
  TIMESTAMP_DEFAULT_PATTERN.test(normalizeReportedDefault(dbDefault));

/**
 * @description Whether the DB default is the implicit sequence/rowid the column
 * interpreter emits for an auto-incrementing column. The model has no
 * `constraints.default` for such a column, so without this the differ emits a
 * `drop default` — for a CockroachDB `serial` that removes the rowid generator.
 */
export const isImplicitIncrementDefault = (
  dialect: SqlDataSourceType,
  modelColumn: Pick<ColumnType, "type">,
  dbDefault: unknown,
): boolean => {
  if (modelColumn.type !== "increment" && modelColumn.type !== "bigIncrement") {
    return false;
  }
  const matches = IMPLICIT_INCREMENT_DEFAULTS[dialect];
  return matches ? matches(normalizeReportedDefault(dbDefault)) : false;
};
