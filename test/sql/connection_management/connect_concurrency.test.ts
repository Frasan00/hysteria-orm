/**
 * DB-free. Covers the guard that keeps two concurrent connects from each building a pool:
 * the second assignment would drop the first, leaving its sockets open with nothing holding
 * a reference to close them.
 */

import { SqlDataSource } from "../../../src/sql/sql_data_source";
import * as sqlConnUtils from "../../../src/sql/sql_connection_utils";

const buildDataSource = (lazyLoad = false) =>
  new SqlDataSource({
    type: "sqlite",
    database: ":memory:",
    logs: false,
    lazyLoad,
  });

/** Counts driver creations and holds the first one open long enough to race against. */
const countDriverCreations = () => {
  let created = 0;

  const spy = jest
    .spyOn(sqlConnUtils, "createSqlDriver")
    .mockImplementation(async () => {
      created++;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { pool: {} } as never;
    });

  return { spy, created: () => created };
};

describe("concurrent connect()", () => {
  it("rejects a second connect() while one is in flight rather than building a second pool", async () => {
    const { spy, created } = countDriverCreations();

    try {
      const sql = buildDataSource();

      const first = sql.connect();
      await expect(sql.connect()).rejects.toThrow(
        "CONNECTION_ALREADY_ESTABLISHED",
      );
      await first;

      expect(created()).toBe(1);
      expect(sql.isConnected).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });

  it("shares one connect between concurrent lazy operations", async () => {
    const { spy, created } = countDriverCreations();

    try {
      const sql = buildDataSource(true);

      await Promise.all([
        sql.ensureConnected(),
        sql.ensureConnected(),
        sql.ensureConnected(),
      ]);

      expect(created()).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });

  it("allows a fresh connect() once the failed attempt has settled", async () => {
    let created = 0;
    const spy = jest
      .spyOn(sqlConnUtils, "createSqlDriver")
      .mockImplementation(async () => {
        created++;
        if (created === 1) {
          throw new Error("first attempt fails");
        }
        return { pool: {} } as never;
      });

    try {
      const sql = buildDataSource();

      await expect(sql.connect()).rejects.toThrow("first attempt fails");
      // The guard must not latch: a retry after the attempt settled has to work.
      await sql.connect();

      expect(created).toBe(2);
      expect(sql.isConnected).toBe(true);
    } finally {
      spy.mockRestore();
    }
  });
});
