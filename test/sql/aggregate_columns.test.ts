/**
 * The aggregate helpers (`getSum`/`getMax`/`getMin`/`getAvg`) built their clause with
 * `selectRaw("sum(<column>) as total")`, which interpolates the argument verbatim.
 * A model-property name therefore reached SQL untranslated: on a model whose column
 * maps to a different database name (`userId` -> `user_id`) the query failed with
 * `no such column`, and a table-qualified reference kept its table prefix in a
 * context where it is not valid.
 *
 * They now go through `selectFunc`, the same path `selectFunc()` uses, so the column
 * is resolved through the model's column map and quoted per dialect.
 */

import { env } from "../../src/env/env";
import { col, defineModel } from "../../src/sql/models/define_model";
import { SqlDataSource } from "../../src/sql/sql_data_source";

const AggregateProbe = defineModel("aggregate_probe", {
  columns: {
    id: col.increment(),
    userId: col.string(),
    salary: col.integer(),
    // camelCase property mapping to a snake_case column; numeric so every
    // dialect's SUM/AVG accept it.
    baseSalary: col.integer(),
  },
});

let sql: SqlDataSource;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
  await sql.schema().dropTableIfExists("aggregate_probe");
  await sql.schema().createTable("aggregate_probe", (table) => {
    table.increment("id").primaryKey();
    table.varchar("user_id", 40);
    table.integer("salary");
    table.integer("base_salary");
  });
  await sql.rawQuery(
    "insert into aggregate_probe (user_id, salary, base_salary) values ('u1', 10, 100), ('u2', 20, 200)",
  );
});

afterAll(async () => {
  await sql.schema().dropTableIfExists("aggregate_probe");
  await sql.disconnect();
});

describe(`[${env.DB_TYPE}] aggregate helper column resolution`, () => {
  test("resolves a camelCase model property to its database column", async () => {
    // `baseSalary` maps to `base_salary`; the untranslated form failed with
    // `no such column`.
    await expect(
      sql.from(AggregateProbe).getSum("baseSalary" as never),
    ).resolves.toBe(300);
    await expect(
      sql.from(AggregateProbe).getMax("baseSalary" as never),
    ).resolves.toBe(200);
  });

  test("computes aggregates over a plain numeric column", async () => {
    await expect(
      sql.from(AggregateProbe).getSum("salary" as never),
    ).resolves.toBe(30);
    await expect(
      sql.from(AggregateProbe).getMax("salary" as never),
    ).resolves.toBe(20);
    await expect(
      sql.from(AggregateProbe).getMin("salary" as never),
    ).resolves.toBe(10);
    await expect(
      sql.from(AggregateProbe).getAvg("salary" as never),
    ).resolves.toBe(15);
    await expect(sql.from(AggregateProbe).getCount()).resolves.toBe(2);
  });

  test("still honours where clauses", async () => {
    await expect(
      sql
        .from(AggregateProbe)
        .where("userId", "u1")
        .getSum("salary" as never),
    ).resolves.toBe(10);
  });
});
