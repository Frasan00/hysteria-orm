import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";

let sql: SqlDataSource;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

beforeEach(async () => {
  await sql.startGlobalTransaction();
});

afterEach(async () => {
  await sql.rollbackGlobalTransaction();
});

const insertUser = (status: string | null, email: string) =>
  sql.from(UserWithoutPk).insert(
    {
      ...UserFactory.getCommonUserData(),
      status: status as any,
      email,
    },
    { returning: ["*"] },
  );

const seed = async () => {
  await insertUser("active", "h-active-1@having.test");
  await insertUser("active", "h-active-2@having.test");
  await insertUser("inactive", "h-inactive@having.test");
  await insertUser(null, "h-null@having.test");
};

describe(`[${env.DB_TYPE}] Extended HAVING Operations`, () => {
  test("havingIn and havingNotIn filter groups", async () => {
    await seed();

    const active = await sql
      .from(UserWithoutPk)
      .select("status")
      .groupBy("status")
      .havingIn("status", ["active"])
      .many();
    expect(active.map((r) => r.status)).toEqual(["active"]);

    // NULL groups are excluded by NOT IN (SQL three-valued logic)
    const notActive = await sql
      .from(UserWithoutPk)
      .select("status")
      .groupBy("status")
      .havingNotIn("status", ["active"])
      .many();
    expect(notActive.map((r) => r.status)).toEqual(["inactive"]);
  });

  test("havingBetween and havingNotBetween filter groups", async () => {
    await seed();

    const between = await sql
      .from(UserWithoutPk)
      .select("status")
      .groupBy("status")
      .havingBetween("status", ["active", "active"])
      .many();
    expect(between.map((r) => r.status)).toEqual(["active"]);

    const notBetween = await sql
      .from(UserWithoutPk)
      .select("status")
      .groupBy("status")
      .havingNotBetween("status", ["active", "active"])
      .many();
    expect(notBetween.map((r) => r.status).sort()).toEqual(["inactive"]);
  });

  test("havingNull and havingNotNull filter groups", async () => {
    await seed();

    const nullGroups = await sql
      .from(UserWithoutPk)
      .select("status")
      .groupBy("status")
      .havingNull("status")
      .many();
    expect(nullGroups.length).toBe(1);
    expect(nullGroups[0].status).toBeNull();

    const notNull = await sql
      .from(UserWithoutPk)
      .select("status")
      .groupBy("status")
      .havingNotNull("status")
      .many();
    expect(notNull.map((r) => r.status).sort()).toEqual(["active", "inactive"]);
  });

  test("havingWrapped groups conditions", async () => {
    await seed();

    const rows = await sql
      .from(UserWithoutPk)
      .select("status")
      .groupBy("status")
      .havingWrapped((qb) => {
        qb.having("status", "active").orHaving("status", "inactive");
      })
      .many();

    expect(rows.map((r) => r.status).sort()).toEqual(["active", "inactive"]);
  });

  test("havingExists and havingNotExists accept subqueries", async () => {
    await seed();

    const exists = await sql
      .from(UserWithoutPk)
      .select("status")
      .groupBy("status")
      .havingExists((qb) => qb.select("name"))
      .many();
    expect(exists.length).toBeGreaterThan(0);

    const notExists = await sql
      .from(UserWithoutPk)
      .select("status")
      .groupBy("status")
      .havingNotExists((qb) => qb.select("name"))
      .many();
    expect(notExists.length).toBe(0);
  });
});
