/**
 * DB-free. Covers the pg stream releasing its pooled client when the consumer abandons the
 * stream. That path never reaches the 'end' or 'error' handlers, so without a close handler
 * the client stays checked out until the query finishes on its own.
 */

import { EventEmitter } from "node:events";
import { PgDriverAdapter } from "../../../src/drivers/adapters/node/pg.adapter";
import type { PgImport } from "../../../src/drivers/driver_types";
import type { SqlDataSourceInput } from "../../../src/sql/sql_data_source_types";

class FakePgPool extends EventEmitter {
  constructor(public config: Record<string, unknown>) {
    super();
  }
}

class FakePgStream extends EventEmitter {
  destroy = jest.fn();
}

/** Lets the stream's 'close' event fire, which Node emits asynchronously. */
const settle = () => new Promise((resolve) => setImmediate(resolve));

const buildAdapter = () => {
  const client = { Pool: FakePgPool } as unknown as PgImport;
  const input = {
    host: "localhost",
    port: 5432,
    username: "user",
    password: "password",
    database: "database",
  } as unknown as SqlDataSourceInput<"postgres">;

  const adapter = new PgDriverAdapter("postgres", input, client);

  const pgStream = new FakePgStream();
  const release = jest.fn();

  // Hand the adapter a pool that yields a fake client instead of a real connection.
  (adapter as unknown as { pool: unknown }).pool = {
    connect: async () => ({ query: () => pgStream, release }),
  };

  return { adapter, pgStream, release };
};

describe("PgDriverAdapter streaming", () => {
  it("releases the client and stops the query when the consumer abandons the stream", async () => {
    const { adapter, pgStream, release } = buildAdapter();

    const stream = await adapter.stream("select 1", [], {}, {});
    expect(release).not.toHaveBeenCalled();

    // What `for await (const row of stream) { break }` does.
    (stream as unknown as { destroy(): void }).destroy();
    await settle();

    expect(pgStream.destroy).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("stops the query but leaves a transaction's connection alone", async () => {
    const { adapter, pgStream, release } = buildAdapter();
    const transactionConnection = { query: () => pgStream, release: jest.fn() };

    const stream = await adapter.stream(
      "select 1",
      [],
      { connection: transactionConnection } as never,
      {},
    );
    (stream as unknown as { destroy(): void }).destroy();
    await settle();

    // The abandoned query must not still be running when the transaction issues its next
    // statement, but the connection belongs to the transaction, not to this stream.
    expect(pgStream.destroy).toHaveBeenCalledTimes(1);
    expect(release).not.toHaveBeenCalled();
  });

  it("releases exactly once when the stream ends normally", async () => {
    const { adapter, pgStream, release } = buildAdapter();

    const stream = await adapter.stream("select 1", [], {}, {});
    pgStream.emit("end");
    (stream as unknown as { destroy(): void }).destroy();
    await settle();

    expect(release).toHaveBeenCalledTimes(1);
    // The close handler must not treat a finished stream as an abandoned one.
    expect(pgStream.destroy).not.toHaveBeenCalled();
  });
});
