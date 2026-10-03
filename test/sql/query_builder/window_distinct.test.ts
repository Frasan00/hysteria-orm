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

const insertUser = (email: string, status: string, age: number) =>
  sql.from(UserWithoutPk).insert(
    {
      ...UserFactory.getCommonUserData(),
      email,
      status,
      age,
    },
    { returning: ["*"] },
  );

const seed = async () => {
  await insertUser(`wd-active-10-${env.DB_TYPE}@test.com`, "active", 10);
  await insertUser(`wd-active-20a-${env.DB_TYPE}@test.com`, "active", 20);
  await insertUser(`wd-active-20b-${env.DB_TYPE}@test.com`, "active", 20);
  await insertUser(`wd-inactive-30-${env.DB_TYPE}@test.com`, "inactive", 30);
};

describe(`[${env.DB_TYPE}] distinct aggregates`, () => {
  test("countDistinct, sumDistinct and avgDistinct", async () => {
    await seed();

    const row = (await sql
      .from(UserWithoutPk)
      .countDistinct("status", "c")
      .sumDistinct("age", "s")
      .avgDistinct("age", "a")
      .one()) as Record<string, any>;

    expect(Number(row.c)).toBe(2);
    expect(Number(row.s)).toBe(60);
    expect(Number(row.a)).toBe(20);
  });
});

describe(`[${env.DB_TYPE}] window functions`, () => {
  test("rowNumber, rank and denseRank over partitions", async () => {
    await seed();

    const rows = (await sql
      .from(UserWithoutPk)
      .select("email", "status", "age")
      .rowNumber("rn", {
        partitionBy: "status",
        orderBy: { column: "age", order: "desc" },
      })
      .rank("r", { orderBy: { column: "age", order: "desc" } })
      .denseRank("dr", { orderBy: { column: "age", order: "desc" } })
      .many()) as Record<string, any>[];

    const byEmail = new Map(rows.map((row) => [row.email, row]));
    const at = (email: string) =>
      byEmail.get(`wd-${email}-${env.DB_TYPE}@test.com`)!;

    // Highest age overall: rank and dense_rank both 1, first in its partition.
    expect(Number(at("inactive-30").rn)).toBe(1);
    expect(Number(at("inactive-30").r)).toBe(1);
    expect(Number(at("inactive-30").dr)).toBe(1);

    // Lowest age: rank 4 (two tied rows above it), dense_rank 3, third active row.
    expect(Number(at("active-10").rn)).toBe(3);
    expect(Number(at("active-10").r)).toBe(4);
    expect(Number(at("active-10").dr)).toBe(3);

    // The two age-20 rows tie on rank/dense_rank and take row numbers 1 and 2.
    const tied = [at("active-20a"), at("active-20b")];
    expect(tied.map((row) => Number(row.r))).toEqual([2, 2]);
    expect(tied.map((row) => Number(row.dr))).toEqual([2, 2]);
    expect(tied.map((row) => Number(row.rn)).sort()).toEqual([1, 2]);
  });
});
