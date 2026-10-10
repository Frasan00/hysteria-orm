/**
 * DB-free guards for pool error wiring. An unhandled EventEmitter "error" event
 * throws, so an idle pooled connection dying has to be caught in the adapter
 * rather than reaching the process. pg-pool emits it on the pool itself
 * (`idleListener`) and installs no listener of its own.
 */

import { EventEmitter } from "node:events";
import { PgDriverAdapter } from "../../../src/drivers/adapters/node/pg.adapter";
import type { PgImport } from "../../../src/drivers/driver_types";
import type {
  PoolErrorContext,
  SqlDataSourceInput,
} from "../../../src/sql/sql_data_source_types";
import logger from "../../../src/utils/logger";

type PoolErrorHandler = (
  error: Error,
  context: PoolErrorContext,
) => void | Promise<void>;

class FakePgPool extends EventEmitter {
  constructor(public config: Record<string, unknown>) {
    super();
  }
}

const buildAdapter = (
  onPoolError?: PoolErrorHandler,
): { pool: FakePgPool; errorSpy: jest.SpyInstance } => {
  const client = { Pool: FakePgPool } as unknown as PgImport;
  const input = {
    host: "localhost",
    port: 5432,
    username: "user",
    password: "password",
    database: "database",
    onPoolError,
  } as unknown as SqlDataSourceInput<"postgres">;

  const errorSpy = jest.spyOn(logger, "error").mockImplementation(() => {});
  const adapter = new PgDriverAdapter("postgres", input, client);

  return { pool: adapter.pool as unknown as FakePgPool, errorSpy };
};

describe("PgDriverAdapter pool error handling", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("logs by default and does not throw when an idle client errors", () => {
    const { pool, errorSpy } = buildAdapter();

    // Without a listener attached, EventEmitter.emit("error") throws.
    expect(() =>
      pool.emit("error", new Error("Connection terminated unexpectedly")),
    ).not.toThrow();

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(String(errorSpy.mock.calls[0][0])).toContain("idle client error");
    expect(String(errorSpy.mock.calls[0][0])).toContain(
      "Connection terminated unexpectedly",
    );
  });

  it("hands the error and pool context to a configured handler", () => {
    const calls: [Error, PoolErrorContext][] = [];
    const { pool, errorSpy } = buildAdapter((error, context) => {
      calls.push([error, context]);
    });

    const failure = new Error("server closed the connection");
    pool.emit("error", failure);

    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe(failure);
    expect(calls[0][1]).toEqual({
      type: "postgres",
      host: "localhost",
      port: 5432,
      database: "database",
    });
    // A configured handler replaces the default log line, it does not double up.
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("contains a handler that throws instead of letting it escape", () => {
    const { pool, errorSpy } = buildAdapter(() => {
      throw new Error("handler blew up");
    });

    expect(() =>
      pool.emit("error", new Error("idle client died")),
    ).not.toThrow();
    expect(String(errorSpy.mock.calls[0][0])).toContain("handler blew up");
  });

  it("contains a handler that rejects instead of leaving it unhandled", async () => {
    const { pool, errorSpy } = buildAdapter(async () => {
      throw new Error("handler rejected");
    });

    pool.emit("error", new Error("idle client died"));
    await new Promise((resolve) => setImmediate(resolve));

    expect(String(errorSpy.mock.calls[0][0])).toContain("handler rejected");
  });
});
