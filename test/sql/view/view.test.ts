import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserView } from "../test_models/view/view";

let sql: SqlDataSource;

const createView = (sql: SqlDataSource) =>
  sql.rawQuery(
    `CREATE OR REPLACE VIEW user_view AS SELECT 1 AS id, COUNT(*) AS total FROM users_without_pk`,
    [],
  );

const dropView = (sql: SqlDataSource) =>
  sql.rawQuery(`DROP VIEW IF EXISTS user_view`, []);

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
  await createView(sql);
});

afterAll(async () => {
  await dropView(sql);
  await sql.disconnect();
});

beforeEach(async () => {
  await sql.startGlobalTransaction();
});

afterEach(async () => {
  await sql.rollbackGlobalTransaction();
});

describe(`[${env.DB_TYPE}] View`, () => {
  describe("basic querying", () => {
    test("many() returns rows from the view", async () => {
      await UserFactory.userWithoutPk(sql, 3);
      const rows = await sql.from(UserView).many();
      expect(rows.length).toBeGreaterThan(0);
    });

    test("one() returns a single row", async () => {
      await UserFactory.userWithoutPk(sql, 2);
      const row = await sql.from(UserView).one();
      expect(row).not.toBeNull();
    });

    test("total column reflects row count", async () => {
      await UserFactory.userWithoutPk(sql, 4);
      const row = await sql.from(UserView).one();
      expect(row).not.toBeNull();
      expect(Number(row!.total)).toBe(4);
    });

    test("id column is always 1", async () => {
      await UserFactory.userWithoutPk(sql, 2);
      const row = await sql.from(UserView).one();
      expect(Number(row!.id)).toBe(1);
    });

    test("total is 0 when underlying table is empty", async () => {
      const row = await sql.from(UserView).one();
      expect(row).not.toBeNull();
      expect(Number(row!.total)).toBe(0);
    });
  });

  describe("select and projection", () => {
    test("select specific columns", async () => {
      await UserFactory.userWithoutPk(sql, 1);
      const rows = await sql.from(UserView).select("total").many();
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty("total");
    });

    test("selectRaw works on view", async () => {
      await UserFactory.userWithoutPk(sql, 2);
      const rows = await sql
        .from(UserView)
        .selectRaw<{ t: number }>("total as t")
        .many();
      expect(rows.length).toBeGreaterThan(0);
      expect(Number(rows[0].t)).toBe(2);
    });
  });

  describe("filtering and chaining", () => {
    test("where filters rows from the view", async () => {
      await UserFactory.userWithoutPk(sql, 1);
      const rows = await sql.from(UserView).where("id", 1).many();
      expect(rows.length).toBe(1);
    });

    test("where with no match returns empty array", async () => {
      const rows = await sql.from(UserView).where("id", 999).many();
      expect(rows.length).toBe(0);
    });

    test("limit is respected", async () => {
      await UserFactory.userWithoutPk(sql, 1);
      const rows = await sql.from(UserView).limit(1).many();
      expect(rows.length).toBeLessThanOrEqual(1);
    });
  });

  describe("pagination", () => {
    test("paginate returns correct structure", async () => {
      await UserFactory.userWithoutPk(sql, 1);
      const result = await sql.from(UserView).paginate(1, 10);
      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("paginationMetadata");
      expect(result.paginationMetadata.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe("aggregates", () => {
    test("getCount returns number of view rows", async () => {
      await UserFactory.userWithoutPk(sql, 1);
      const count = await sql.from(UserView).getCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("pluck extracts a single column", async () => {
      await UserFactory.userWithoutPk(sql, 1);
      const ids = await sql.from(UserView).pluck("id");
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
    });
  });

  describe("read-only enforcement", () => {
    test("view model table is correct", () => {
      expect(UserView.table).toBe("user_view");
    });

    test("view has the expected columns", () => {
      const cols = UserView.getColumns();
      const names = cols.map((c) => c.columnName);
      expect(names).toContain("id");
      expect(names).toContain("total");
    });
  });
});
