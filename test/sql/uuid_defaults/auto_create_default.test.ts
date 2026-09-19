/**
 * A column declared `autoCreate: true` gets an implicit `default current_timestamp`
 * from the column interpreter, and the ORM omits it from INSERT because it expects
 * the database to generate the value. The model records this as `autoCreate`, not as
 * `constraints.default` (the date column options deliberately omit `default`), so the
 * schema differ has to know about it.
 *
 * When it did not, the differ read the column as model-has-no-default / db-has-one and
 * emitted `drop default`. Applying that "fixes" the diff — a re-run reported no
 * changes — but left a schema where every insert failed with a NOT NULL violation,
 * because the ORM still omitted the column.
 */

import { env } from "../../../src/env/env";
import { col, defineModel } from "../../../src/sql/models/define_model";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

let sql: SqlDataSource;
const dbType = env.DB_TYPE as SqlDataSourceType;

const createdAtAutoCreate = defineModel("auto_create_probe", {
  columns: {
    id: col.increment(),
    createdAt: col.datetime({ autoCreate: true }),
    label: col.string(),
  },
});

const connectionConfig = () =>
  dbType === "sqlite"
    ? { type: dbType, database: "./sqlite.db" }
    : {
        type: dbType,
        host: env.DB_HOST || "localhost",
        port: Number(env.DB_PORT) || undefined,
        username: env.DB_USER || "root",
        password: env.DB_PASSWORD || "root",
        database: env.DB_DATABASE || "test",
      };

beforeAll(async () => {
  sql = new SqlDataSource(connectionConfig());
  await sql.connect();
});

afterAll(async () => {
  await sql.schema().dropTableIfExists("auto_create_probe");
  await sql.disconnect();
});

test("a re-sync does not drop the implicit default on an autoCreate column", async () => {
  await sql.schema().dropTableIfExists("auto_create_probe");
  await sql.schema().createTable("auto_create_probe", (table) => {
    // SQLite's increment interpreter already emits `integer primary key
    // autoincrement`, so an explicit .primaryKey() there yields two primary keys
    // and the CREATE fails. MySQL/MSSQL instead require the AUTO_INCREMENT
    // column to be a key, so the explicit call is needed there.
    if (dbType === "sqlite") {
      table.increment("id");
    } else {
      table.increment("id").primaryKey();
    }
    table.datetime("created_at", { autoCreate: true });
    table.varchar("label", 40);
  });

  // Dynamic import avoids a circular dependency at module load — schema_diff
  // pulls in the schema builders that this test's model layer also loads. Matches
  // the pattern in test/sql/schema_diff/schema_diff.test.ts.
  const { SchemaDiff } =
    await import("../../../src/sql/migrations/schema_diff/schema_diff");

  await SqlDataSource.useConnection(
    { ...connectionConfig(), models: { createdAtAutoCreate } },
    async (scopedSql) => {
      const diff = await SchemaDiff.makeDiff(scopedSql);
      const statements = diff.getSqlStatements();
      const droppedDefault = statements.filter((stmt: string) =>
        /drop\s+default/i.test(stmt),
      );

      expect(droppedDefault).toEqual([]);
    },
  );
});

test("an insert omitting the autoCreate column still succeeds", async () => {
  await sql.schema().dropTableIfExists("auto_create_probe");
  await sql.schema().createTable("auto_create_probe", (table) => {
    // SQLite's increment interpreter already emits `integer primary key
    // autoincrement`, so an explicit .primaryKey() there yields two primary keys
    // and the CREATE fails. MySQL/MSSQL instead require the AUTO_INCREMENT
    // column to be a key, so the explicit call is needed there.
    if (dbType === "sqlite") {
      table.increment("id");
    } else {
      table.increment("id").primaryKey();
    }
    table.datetime("created_at", { autoCreate: true });
    table.varchar("label", 40);
  });

  // The ORM omits created_at, so the DB default must have survived. Read back
  // through the model rather than rawQuery: the raw envelope differs per driver
  // (pg returns `{ rows }`, mysql/mssql return a positional array), and the ORM
  // path is what actually depends on the default.
  await sql.from(createdAtAutoCreate).insert({ label: "probe" });
  const created = await sql
    .from(createdAtAutoCreate)
    .orderBy("id", "desc")
    .one();

  expect(created).not.toBeNull();
  expect(created?.createdAt).toBeInstanceOf(Date);
});
