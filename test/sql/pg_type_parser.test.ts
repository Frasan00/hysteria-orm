import { env } from "../../src/env/env";
import { SqlDataSource } from "../../src/sql/sql_data_source";

/**
 * `coerceNumericTypes` targets the node `pg` driver only, so every case here is
 * pg-family. `type` is passed explicitly because the input shape requires it
 * whenever any option is given; the narrowing keeps the pg-family literal.
 */
const pgDialect =
  env.DB_TYPE === "postgres" || env.DB_TYPE === "cockroachdb"
    ? env.DB_TYPE
    : undefined;

/**
 * `rawQuery` resolves to the driver's raw result, so pg rows live under `.rows`.
 */
type RawRows = { rows: { b: unknown; n: unknown }[] };

test("default: pg returns bigint/numeric as strings on the raw path", async () => {
  if (!pgDialect) {
    console.log("postgres/cockroachdb-specific");
    return;
  }

  const sql = new SqlDataSource();
  await sql.connect();

  try {
    const result = await sql.rawQuery<RawRows>(
      "select 1::bigint as b, 1.5::numeric as n",
    );
    expect(typeof result.rows[0].b).toBe("string");
    expect(typeof result.rows[0].n).toBe("string");
  } finally {
    await sql.disconnect();
  }
});

test("opt-in: int8 coerces to bigint and numeric to number", async () => {
  if (!pgDialect) {
    console.log("postgres/cockroachdb-specific");
    return;
  }

  const sql = new SqlDataSource({ type: pgDialect, coerceNumericTypes: true });
  await sql.connect();

  try {
    const result = await sql.rawQuery<RawRows>(
      "select 1::bigint as b, 1.5::numeric as n",
    );
    expect(typeof result.rows[0].b).toBe("bigint");
    expect(typeof result.rows[0].n).toBe("number");
    expect(result.rows[0].b).toBe(1n);
    expect(result.rows[0].n).toBe(1.5);
  } finally {
    await sql.disconnect();
  }
});

test("caller-supplied driverOptions.types wins over the flag", async () => {
  if (!pgDialect) {
    console.log("postgres/cockroachdb-specific");
    return;
  }

  const sql = new SqlDataSource({
    type: pgDialect,
    coerceNumericTypes: true,
    driverOptions: {
      types: { getTypeParser: () => (value: string) => `override:${value}` },
    },
  });
  await sql.connect();

  try {
    const result = await sql.rawQuery<RawRows>(
      "select 1::bigint as b, 1.5::numeric as n",
    );
    expect(result.rows[0].b).toBe("override:1");
    expect(result.rows[0].n).toBe("override:1.5");
  } finally {
    await sql.disconnect();
  }
});
