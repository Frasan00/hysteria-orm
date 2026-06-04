/**
 * F001 — `connect()` rejection must clear `sqlPool` and `ownsPool`
 *
 * Bug sketch: the current `connect()` assigns `this.sqlPool = await
 * createSqlPool(...)`. If `createSqlPool` rejects mid-flight, the await
 * throws before the assignment, so `sqlPool` happens to be null in that
 * narrow case. BUT if any of the slave `createSqlPool` calls inside
 * `Promise.all` fails after the master pool was already set, the
 * rejection propagates without nulling `sqlPool` or `ownsPool` — and
 * the instance is left "isConnected === true" with a half-built pool.
 *
 * The cleanest way to force this state without depending on dialect-
 * specific driver quirks is to mock `createSqlPool` itself: have the
 * first call return a fake pool, then reject on the slave iteration.
 * That mirrors the audit's "slave fails after master" sketch and is
 * dialect-agnostic.
 */
import { env } from "../../../src/env/env";
import { HysteriaError } from "../../../src/errors/hysteria_error";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import * as sqlConnUtils from "../../../src/sql/sql_connection_utils";

const isSqlite = env.DB_TYPE === "sqlite";

describe(`[${env.DB_TYPE}] connect() rejection cleanup (F001)`, () => {
  // SQLite uses a local file and cannot easily simulate a connect failure.
  const testIfPool = isSqlite ? test.skip : test;

  testIfPool(
    "F001-A: connect() rejection clears sqlPool and ownsPool so retry is possible",
    async () => {
      // Mock createSqlPool to throw — the most direct simulation of the
      // audit's "createSqlPool rejects" case. This works for all dialects
      // because the rejection is at the module boundary, not the driver.
      const spy = jest
        .spyOn(sqlConnUtils, "createSqlPool")
        .mockImplementation(async () => {
          throw new HysteriaError(
            "F001_TEST_FORCED_FAILURE",
            "CONNECTION_NOT_ESTABLISHED",
          );
        });

      try {
        const badSql = new SqlDataSource({
          type: env.DB_TYPE,
          host: "127.0.0.1",
          port: 1,
          username: "wrong",
          password: "wrong",
          database: "nope",
          connectionPolicies: { retry: { maxRetries: 0, delay: 0 } },
        } as any);

        expect(badSql.isConnected).toBe(false);

        // First connect attempt must reject with the HysteriaError we threw.
        await expect(badSql.connect()).rejects.toBeInstanceOf(HysteriaError);

        // F001 invariant 1: sqlPool must be cleared on rejection.
        expect((badSql as any).sqlPool).toBeNull();
        // F001 invariant 2: ownsPool must be cleared on rejection.
        expect((badSql as any).ownsPool).toBe(false);
        // F001 invariant 3: isConnected must be false so retry is possible.
        expect(badSql.isConnected).toBe(false);
      } finally {
        spy.mockRestore();
      }
    },
    15000,
  );

  testIfPool(
    "F001-B: slave pool failure after master pool success still cleans up",
    async () => {
      // The audit's worst-case sketch: master pool succeeds, slave pool
      // fails. The `Promise.all` rejects, but `this.sqlPool` was already
      // assigned and `this.ownsPool = true` was set. The instance is now
      // half-connected with no way to retry without a full reset.
      const fakePool = { __fake: true } as any;
      let callCount = 0;
      const spy = jest
        .spyOn(sqlConnUtils, "createSqlPool")
        .mockImplementation(async () => {
          callCount++;
          if (callCount === 1) {
            return fakePool;
          }
          // Slave iteration — reject.
          throw new HysteriaError(
            "F001_TEST_SLAVE_FAILURE",
            "CONNECTION_NOT_ESTABLISHED",
          );
        });

      try {
        const sqlWithSlave = new SqlDataSource({
          type: env.DB_TYPE,
          host: "127.0.0.1",
          port: 1,
          username: "wrong",
          password: "wrong",
          database: "nope",
          replication: {
            slaves: [
              {
                type: env.DB_TYPE,
                host: "127.0.0.1",
                port: 2,
                username: "wrong",
                password: "wrong",
                database: "nope",
              } as any,
            ],
          },
        } as any);

        await expect(sqlWithSlave.connect()).rejects.toBeInstanceOf(
          HysteriaError,
        );

        // F001 invariant: even though the master pool succeeded, the slave
        // failure must clean up the state so a retry is possible.
        expect((sqlWithSlave as any).sqlPool).toBeNull();
        expect((sqlWithSlave as any).ownsPool).toBe(false);
        expect(sqlWithSlave.isConnected).toBe(false);
      } finally {
        spy.mockRestore();
      }
    },
    15000,
  );
});
