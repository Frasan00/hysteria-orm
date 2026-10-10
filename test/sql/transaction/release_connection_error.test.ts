/**
 * DB-free guards for `DriverAdapter.releaseConnection`'s failure argument. A
 * failed COMMIT/ROLLBACK leaves the session state unknown, so the connection has
 * to be discarded rather than returned to the pool for the next query.
 */

import { EventEmitter } from "node:events";
import { Mysql2DriverAdapter } from "../../../src/drivers/adapters/node/mysql2.adapter";
import { PgDriverAdapter } from "../../../src/drivers/adapters/node/pg.adapter";
import type { Mysql2Import, PgImport } from "../../../src/drivers/driver_types";
import type { SqlDataSourceInput } from "../../../src/sql/sql_data_source_types";

class FakePool extends EventEmitter {
  constructor(public config: Record<string, unknown>) {
    super();
  }
}

const connectionInput = (host: string, port: number) =>
  ({
    host,
    port,
    username: "user",
    password: "password",
    database: "database",
  }) as unknown;

const buildPgAdapter = (): PgDriverAdapter =>
  new PgDriverAdapter(
    "postgres",
    connectionInput("localhost", 5432) as SqlDataSourceInput<"postgres">,
    { Pool: FakePool } as unknown as PgImport,
  );

const buildMysqlAdapter = (): Mysql2DriverAdapter =>
  new Mysql2DriverAdapter(
    "mysql",
    connectionInput("localhost", 3306) as SqlDataSourceInput<"mysql">,
    {
      createPool: () => new FakePool({}),
    } as unknown as Mysql2Import,
  );

describe("PgDriverAdapter releaseConnection", () => {
  it("hands the failure to pg, which destroys the client instead of pooling it", () => {
    const connection = { release: jest.fn() };
    const failure = new Error("COMMIT failed");

    buildPgAdapter().releaseConnection(connection as never, failure);

    expect(connection.release).toHaveBeenCalledWith(failure);
  });

  it("returns a healthy client to the pool when there is no failure", () => {
    const connection = { release: jest.fn() };

    buildPgAdapter().releaseConnection(connection as never);

    expect(connection.release).toHaveBeenCalledWith(undefined);
  });
});

describe("Mysql2DriverAdapter releaseConnection", () => {
  it("destroys a connection whose transaction failed", () => {
    const connection = { release: jest.fn(), destroy: jest.fn() };

    buildMysqlAdapter().releaseConnection(
      connection as never,
      new Error("COMMIT failed"),
    );

    expect(connection.destroy).toHaveBeenCalledTimes(1);
    expect(connection.release).not.toHaveBeenCalled();
  });

  it("releases a healthy connection", () => {
    const connection = { release: jest.fn(), destroy: jest.fn() };

    buildMysqlAdapter().releaseConnection(connection as never);

    expect(connection.release).toHaveBeenCalledTimes(1);
    expect(connection.destroy).not.toHaveBeenCalled();
  });
});
