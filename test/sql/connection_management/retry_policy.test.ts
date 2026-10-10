/**
 * DB-free guards for `connectionPolicies.retry`. The retry helper lives behind
 * `execSql`, so these drive it through a stub data source whose adapter executes
 * on demand. Nothing here touches a database.
 */

import type { SqlDataSource } from "../../../src/sql/sql_data_source";
import { execSql } from "../../../src/sql/sql_runner/sql_runner";

type Retry = { maxRetries?: number; delay?: number };

const refused = () =>
  Object.assign(new Error("connect ECONNREFUSED"), {
    code: "ECONNREFUSED",
  });

const buildDataSource = (
  onExecute: (attempt: number) => Promise<unknown>,
  retry: Retry,
): { sql: SqlDataSource; attempts: () => number } => {
  let attempts = 0;

  const sql = {
    ensureConnected: async () => {},
    observerChain: undefined,
    logs: false,
    sqlConnection: null,
    inputDetails: {
      connectionPolicies: { retry },
      queryFormatOptions: undefined,
    },
    driverAdapter: {
      execute: async () => {
        attempts += 1;
        return onExecute(attempts);
      },
      extract: (raw: unknown) => raw,
    },
  } as unknown as SqlDataSource;

  return { sql, attempts: () => attempts };
};

const run = (sql: SqlDataSource) =>
  execSql(
    "select 1",
    [],
    sql,
    "sqlite" as never,
    "rows" as never,
    { shouldLog: false } as never,
  );

describe("connectionPolicies.retry", () => {
  it("retries a refused connection and resolves with the eventual result", async () => {
    const { sql, attempts } = buildDataSource(
      async (attempt) => {
        if (attempt <= 2) {
          throw refused();
        }
        return [{ id: 1 }];
      },
      { maxRetries: 2, delay: 1 },
    );

    await expect(run(sql)).resolves.toEqual([{ id: 1 }]);
    expect(attempts()).toBe(3);
  });

  it("stops after maxRetries and surfaces the last error", async () => {
    const { sql, attempts } = buildDataSource(
      async () => {
        throw refused();
      },
      { maxRetries: 2, delay: 1 },
    );

    await expect(run(sql)).rejects.toThrow("ECONNREFUSED");
    expect(attempts()).toBe(3);
  });

  it("does not retry an error that is not a connection refusal", async () => {
    const { sql, attempts } = buildDataSource(
      async () => {
        throw new Error('syntax error at or near "selct"');
      },
      { maxRetries: 3, delay: 1 },
    );

    await expect(run(sql)).rejects.toThrow("syntax error");
    expect(attempts()).toBe(1);
  });

  it("does not retry when no retry policy is configured", async () => {
    const { sql, attempts } = buildDataSource(async () => {
      throw refused();
    }, {});

    await expect(run(sql)).rejects.toThrow("ECONNREFUSED");
    expect(attempts()).toBe(1);
  });
});
