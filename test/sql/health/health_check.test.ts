import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";

let sql: SqlDataSource;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

describe(`[${env.DB_TYPE}] Health Checks`, () => {
  describe("ping()", () => {
    test("should return ok=true when database is healthy", async () => {
      const result = await sql.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.dialect).toBe(env.DB_TYPE);
    });

    test("should return ok=false when database is disconnected", async () => {
      const disconnectedSql = new SqlDataSource();
      const result = await disconnectedSql.ping();

      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe("isHealthy()", () => {
    test("should return true when database is healthy", async () => {
      const healthy = await sql.isHealthy();
      expect(healthy).toBe(true);
    });

    test("should return false when database is disconnected", async () => {
      const disconnectedSql = new SqlDataSource();
      const healthy = await disconnectedSql.isHealthy();
      expect(healthy).toBe(false);
    });

    test("should never throw when database is disconnected", async () => {
      const disconnectedSql = new SqlDataSource();
      await expect(disconnectedSql.isHealthy()).resolves.toBe(false);
    });
  });
});
