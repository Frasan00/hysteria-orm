/**
 * `sql.rawStatement()` as a model write value. The interpreters already rendered
 * expression nodes inside records; these tests pin that down and keep the model-level
 * data types (`ModelWriteData`) from narrowing them back out.
 */

import { randomUUID } from "node:crypto";
import { env } from "../../../src/env/env";
import { col, defineModel } from "../../../src/sql/models/define_model";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithUuid } from "../test_models/uuid/schema";

/** Never registered or queried: only its column types matter, for the type-level test below. */
const TypedJsonProbe = defineModel("typed_json_probe", {
  columns: {
    json: col.jsonb<{ nested: { key: string } }>(),
  },
});

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

describe(`[${env.DB_TYPE}] rawStatement as a model write value`, () => {
  test("an update value can be a raw expression", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const original = user.name as string;

    await sql
      .from(UserWithUuid)
      .where("id", user.id)
      .update({ name: sql.rawStatement("upper(name)") });

    const updated = await sql
      .from(UserWithUuid)
      .where("id", user.id)
      .oneOrFail();
    expect(updated.name).toBe(original.toUpperCase());
  });

  test("an insert value can be a raw expression", async () => {
    const id = randomUUID();

    await sql.from(UserWithUuid).insert({
      ...UserFactory.getCommonUserData(),
      id,
      email: `raw-${id}@example.com`,
      name: sql.rawStatement("'inserted raw'"),
    });

    const inserted = await sql.from(UserWithUuid).where("id", id).oneOrFail();
    expect(inserted.name).toBe("inserted raw");
  });

  test("insertMany accepts a raw expression per row", async () => {
    const ids = [randomUUID(), randomUUID()];

    await sql.from(UserWithUuid).insertMany(
      ids.map((id, index) => ({
        ...UserFactory.getCommonUserData(),
        id,
        email: `raw-${id}@example.com`,
        name: sql.rawStatement(`'row ${index}'`),
      })),
    );

    const names = await sql
      .from(UserWithUuid)
      .whereIn("id", ids)
      .orderBy("name", "asc")
      .many();

    expect(names.map((row) => row.name)).toEqual(["row 0", "row 1"]);
  });

  // Compile-time only: json mutations write a path, so they are rejected on non-json columns
  test.skip("json mutation helpers are limited to json columns", () => {
    sql
      .from(UserWithUuid)
      .where("id", "x")
      .update({ json: sql.jsonSet("json", "$.a", 2) });

    sql
      .from(TypedJsonProbe)
      .update({ json: sql.jsonSet("json", ["nested", "key"], "value") });

    sql
      .from(UserWithUuid)
      .where("id", "x")
      // @ts-expect-error `name` is a text column
      .update({ name: sql.jsonSet("name", "$.a", 2) });
  });
});
