/**
 * @description better-auth adapter for Hysteria ORM
 * @description Loaded via dynamic import() at runtime so better-auth stays a fully optional dependency
 */

import type { BetterAuthOptions } from "better-auth";
import type {
  AdapterFactoryConfig,
  CleanedWhere,
  CustomAdapter,
  DBAdapter,
} from "better-auth/adapters";
import { DriverNotFoundError } from "../drivers/driver_constants";
import { HysteriaError } from "../errors/hysteria_error";
import { RawNode } from "../sql/ast/query/node/raw/raw_node";
import type { SqlDataSource } from "../sql/sql_data_source";
import type { SqlDataSourceType } from "../sql/sql_data_source_types";

export type BetterAuthAdapterConfig = Partial<
  Pick<
    AdapterFactoryConfig,
    | "usePlural"
    | "debugLogs"
    | "supportsJSON"
    | "supportsDates"
    | "supportsBooleans"
    | "supportsNumericIds"
    | "supportsArrays"
    | "disableIdGeneration"
  >
>;

/** @description A SqlDataSource or a Transaction's `.sql` - anything exposing `from()` */
type QueryableDataSource = Pick<SqlDataSource, "from">;

/**
 * @description The raw query builder doesn't serialize values, so dialects that store
 * booleans/dates as numbers/strings need better-auth to own that round-trip
 */
function capabilitiesFor(
  dbType: SqlDataSourceType,
): Pick<
  AdapterFactoryConfig,
  | "supportsJSON"
  | "supportsDates"
  | "supportsBooleans"
  | "supportsArrays"
  | "supportsNumericIds"
> {
  switch (dbType) {
    case "postgres":
    case "cockroachdb":
      return {
        supportsJSON: true,
        supportsDates: true,
        supportsBooleans: true,
        supportsArrays: true,
        supportsNumericIds: true,
      };
    case "mysql":
    case "mariadb":
      return {
        supportsJSON: true,
        supportsDates: true,
        supportsBooleans: false,
        supportsArrays: false,
        supportsNumericIds: true,
      };
    case "mssql":
    case "oracledb":
      return {
        supportsJSON: false,
        supportsDates: true,
        supportsBooleans: false,
        supportsArrays: false,
        supportsNumericIds: true,
      };
    case "sqlite":
    default:
      return {
        supportsJSON: false,
        supportsDates: false,
        supportsBooleans: false,
        supportsArrays: false,
        supportsNumericIds: true,
      };
  }
}

function applyClause(qb: any, clause: CleanedWhere, or: boolean): void {
  const { field, value, mode } = clause;
  const insensitive = mode === "insensitive";
  const whereFn = or ? "orWhere" : "andWhere";
  const nullFn = or ? "orWhereNull" : "andWhereNull";
  const notNullFn = or ? "orWhereNotNull" : "andWhereNotNull";
  const inFn = or ? "orWhereIn" : "andWhereIn";
  const notInFn = or ? "orWhereNotIn" : "andWhereNotIn";
  const likeFn = insensitive
    ? or
      ? "orWhereILike"
      : "andWhereILike"
    : or
      ? "orWhereLike"
      : "andWhereLike";

  switch (clause.operator) {
    case "eq":
      if (value === null) {
        qb[nullFn](field);
        return;
      }
      qb[whereFn](field, "=", value);
      return;
    case "ne":
      if (value === null) {
        qb[notNullFn](field);
        return;
      }
      qb[whereFn](field, "!=", value);
      return;
    case "lt":
      qb[whereFn](field, "<", value);
      return;
    case "lte":
      qb[whereFn](field, "<=", value);
      return;
    case "gt":
      qb[whereFn](field, ">", value);
      return;
    case "gte":
      qb[whereFn](field, ">=", value);
      return;
    case "in":
      qb[inFn](field, value as any[]);
      return;
    case "not_in":
      qb[notInFn](field, value as any[]);
      return;
    case "contains":
      qb[likeFn](field, `%${value}%`);
      return;
    case "starts_with":
      qb[likeFn](field, `${value}%`);
      return;
    case "ends_with":
      qb[likeFn](field, `%${value}`);
      return;
    default:
      throw new Error(`Unsupported where operator: ${clause.operator}`);
  }
}

/** @description AND clauses apply directly; OR clauses group so they combine as `a AND b AND (c OR d)` */
function applyWhere<Q>(qb: Q, where: CleanedWhere[] = []): Q {
  const andClauses = where.filter((w) => w.connector !== "OR");
  const orClauses = where.filter((w) => w.connector === "OR");

  for (const clause of andClauses) {
    applyClause(qb, clause, false);
  }

  if (orClauses.length) {
    (qb as any).where((sub: any) => {
      for (const clause of orClauses) {
        applyClause(sub, clause, true);
      }
    });
  }

  return qb;
}

/**
 * @description Narrows a where-clause to just its `id` filters, for reading a row back after a
 * write that changed a field the where guarded on (e.g. a status transition) - falls back to the
 * full where if it has no `id` filter
 */
function readBackWhere(where: CleanedWhere[]): CleanedWhere[] {
  const idClauses = where.filter(
    (w) => w.field === "id" && w.connector !== "OR",
  );
  return idClauses.length ? idClauses : where;
}

type GetFieldName = (args: { model: string; field: string }) => string;

/** @description Dialects whose insert can return the DB-generated row (RETURNING/OUTPUT) */
const RETURNING_INSERT_DIALECTS = new Set<SqlDataSourceType>([
  "postgres",
  "cockroachdb",
  "mssql",
]);

/**
 * @description The 8 required CustomAdapter methods, plus `incrementOne`/`consumeOne`, against a
 * raw table query builder. `update`/`incrementOne` never pass `returning` - it's mis-ordered with
 * a WHERE clause on postgres and unsupported on mysql/sqlite - so they write, then read back.
 */
function customAdapter(
  db: QueryableDataSource,
  getFieldName: GetFieldName,
  dbType: SqlDataSourceType,
): CustomAdapter {
  return {
    // `data` already has everything (better-auth generates the id client-side) except when
    // `generateId: "serial" | false` defers id generation to the DB - only postgres/cockroachdb/
    // mssql can hand that back via insert's native RETURNING/OUTPUT.
    create: async ({ model, data }) => {
      if (data.id === undefined || data.id === null) {
        if (!RETURNING_INSERT_DIALECTS.has(dbType)) {
          throw new HysteriaError(
            "betterAuthAdapter::create",
            `BETTER_AUTH_MISSING_ID_${model}`,
          );
        }
        return db.from(model).insert(data as Record<string, any>, ["*"]) as any;
      }
      await db.from(model).insert(data as Record<string, any>);
      return data as any;
    },
    findOne: async ({ model, where, select }) => {
      const qb = applyWhere(db.from(model), where);
      if (select?.length) {
        qb.select(...(select as any[]));
      }
      return qb.one() as any;
    },
    findMany: async ({ model, where, limit, offset, sortBy, select }) => {
      const qb = applyWhere(db.from(model), where).limit(limit);
      if (offset) qb.offset(offset);
      if (sortBy) {
        qb.orderBy(
          getFieldName({ model, field: sortBy.field }) as any,
          sortBy.direction,
        );
      }
      if (select?.length) qb.select(...(select as any[]));
      return qb.many() as any;
    },
    count: async ({ model, where }) => {
      return applyWhere(db.from(model), where).getCount();
    },
    update: async ({ model, where, update }) => {
      const affected = await applyWhere(db.from(model), where).update(
        update as Record<string, any>,
      );
      if (!affected) return null;
      return applyWhere(db.from(model), readBackWhere(where)).one() as any;
    },
    updateMany: async ({ model, where, update }) => {
      return applyWhere(db.from(model), where).update(
        update as Record<string, any>,
      );
    },
    // Also used for guarded CAS transitions (`increment: {}, set: {...}`, e.g. accepting an
    // invitation) - one atomic UPDATE evaluates the where-guard and the write together, unlike
    // the factory's read-modify-write fallback, which has a lost-update race.
    incrementOne: async ({ model, where, increment, set }) => {
      const data: Record<string, any> = { ...(set ?? {}) };
      for (const [field, delta] of Object.entries(increment)) {
        if (!Number.isFinite(delta)) {
          throw new HysteriaError(
            "betterAuthAdapter::incrementOne",
            `BETTER_AUTH_INVALID_INCREMENT_${field}`,
          );
        }
        data[field] = new RawNode(`${field} + (${delta})`);
      }
      const affected = await applyWhere(db.from(model), where).update(data);
      if (!affected) return null;
      return applyWhere(db.from(model), readBackWhere(where)).one() as any;
    },
    // Race-safe without a transaction: DELETE is atomic, so of two concurrent callers only one's
    // delete affects a row - the loser gets 0 rows and correctly returns null.
    consumeOne: async ({ model, where }) => {
      const row = await applyWhere(db.from(model), where).one();
      if (!row) return null;
      const affected = await applyWhere(db.from(model), where).delete();
      return affected ? (row as any) : null;
    },
    delete: async ({ model, where }) => {
      await applyWhere(db.from(model), where).delete();
    },
    deleteMany: async ({ model, where }) => {
      return applyWhere(db.from(model), where).delete();
    },
  };
}

/** @description Recurses with `inTransaction: true` so nested trx calls reuse the same `options` */
function build(
  createAdapterFactory: (
    opts: any,
  ) => (options: BetterAuthOptions) => DBAdapter,
  sql: SqlDataSource,
  config: BetterAuthAdapterConfig,
  options: BetterAuthOptions,
  db: QueryableDataSource = sql,
  inTransaction = false,
): DBAdapter {
  const dbType = sql.getDbType();
  const factory = createAdapterFactory({
    config: {
      adapterId: "hysteria",
      adapterName: "Hysteria ORM",
      ...capabilitiesFor(dbType),
      ...config,
      transaction: inTransaction
        ? false
        : (((cb: (trx: any) => Promise<any>) =>
            sql.transaction((trx) =>
              cb(
                build(
                  createAdapterFactory,
                  sql,
                  config,
                  options,
                  trx.sql,
                  true,
                ),
              ),
            )) as AdapterFactoryConfig["transaction"]),
    },
    adapter: ({ getFieldName }: { getFieldName: GetFieldName }) =>
      customAdapter(db, getFieldName, dbType),
  });
  return factory(options);
}

/**
 * @description Creates a better-auth database adapter backed by a Hysteria `SqlDataSource`
 * @description `better-auth` is an optional peer dependency, loaded lazily - install it in
 * environments that actually run this adapter (see docs)
 * @example
 * ```ts
 * import { betterAuth } from "better-auth";
 * import { betterAuthAdapter, SqlDataSource } from "hysteria-orm";
 *
 * const sql = new SqlDataSource();
 * await sql.connect();
 *
 * export const auth = betterAuth({
 *   database: betterAuthAdapter(sql),
 * });
 * ```
 */
export function betterAuthAdapter(
  sql: SqlDataSource,
  config: BetterAuthAdapterConfig = {},
) {
  return (options: BetterAuthOptions): DBAdapter => {
    let real: Promise<DBAdapter> | undefined;
    const resolve = () =>
      (real ??= import("better-auth/adapters")
        .catch(() => {
          throw new DriverNotFoundError("better-auth");
        })
        .then(({ createAdapterFactory }) =>
          build(createAdapterFactory, sql, config, options),
        ));

    return {
      id: "hysteria",
      create: async (d) => (await resolve()).create(d),
      findOne: async (d) => (await resolve()).findOne(d),
      findMany: async (d) => (await resolve()).findMany(d),
      count: async (d) => (await resolve()).count(d),
      update: async (d) => (await resolve()).update(d),
      updateMany: async (d) => (await resolve()).updateMany(d),
      delete: async (d) => (await resolve()).delete(d),
      deleteMany: async (d) => (await resolve()).deleteMany(d),
      consumeOne: async (d) => (await resolve()).consumeOne(d),
      incrementOne: async (d) => (await resolve()).incrementOne(d),
      transaction: async (cb) => (await resolve()).transaction(cb as any),
      // createSchema/options omitted - better-auth feature-detects them by truthiness
    } as DBAdapter;
  };
}
