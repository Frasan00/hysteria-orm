import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

let sql: SqlDataSource;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();

  // The sleep functions run per row; seed one so the select evaluates them.
  await sql.from(UserWithoutPk).insert({
    ...UserFactory.getCommonUserData(),
    email: `timeout-${env.DB_TYPE}@test.com`,
  });
});

afterAll(async () => {
  await sql
    .from(UserWithoutPk)
    .where("email", `timeout-${env.DB_TYPE}@test.com`)
    .delete();
  await sql.disconnect();
});

const sleepExpression = (): string | null => {
  switch (env.DB_TYPE) {
    case "postgres":
    case "cockroachdb":
      return "pg_sleep(5)";
    case "mysql":
    case "mariadb":
      return "SLEEP(5)";
    default:
      // sqlite is synchronous (a timeout cannot preempt it); mssql has no
      // per-select delay function.
      return null;
  }
};

const isTimeoutError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  (error as { code?: string }).code === "QUERY_TIMEOUT";

describe(`[${env.DB_TYPE}] query timeout`, () => {
  test("rejects with QUERY_TIMEOUT when the query outlives the limit", async () => {
    const sleep = sleepExpression();
    if (!sleep) return;

    const started = Date.now();
    let caught: unknown;
    try {
      await sql
        .from(UserWithoutPk)
        .selectRaw(`${sleep} as s`)
        .limit(1)
        .timeout(200)
        .many();
    } catch (error) {
      caught = error;
    }
    expect(isTimeoutError(caught)).toBe(true);
    expect(Date.now() - started).toBeLessThan(4000);
  });

  test("cancel: true still rejects and leaves the pool usable", async () => {
    const sleep = sleepExpression();
    if (!sleep || env.DB_TYPE === "cockroachdb") return;

    let caught: unknown;
    try {
      await sql
        .from(UserWithoutPk)
        .selectRaw(`${sleep} as s`)
        .limit(1)
        .timeout(150, { cancel: true })
        .many();
    } catch (error) {
      caught = error;
    }
    expect(isTimeoutError(caught)).toBe(true);

    // A follow-up query proves the pool / connection survived cancellation.
    const rows = await sql.from(UserWithoutPk).limit(1).many();
    expect(Array.isArray(rows)).toBe(true);
  });
});
