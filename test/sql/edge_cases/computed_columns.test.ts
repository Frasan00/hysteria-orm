import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { col, defineModel } from "../../../src/sql/models/define_model";
import { column } from "../../../src/sql/models/decorators/model_decorators";
import { Model } from "../../../src/sql/models/model";
import type {
  ComputedColumnDef,
  ColComputedOptions,
} from "../../../src/sql/models/define_model_types";

let sql: SqlDataSource;

// Unique per-process table name so stale tables left in a persistent sqlite
// database file from earlier runs can never conflict with a fresh run.
const TABLE = `computed_columns_test_${Date.now()}`;

// Returns a dialect-specific SQL expression that concatenates first_name and
// last_name with a single space. Written in each DB's own syntax (computed
// expressions are NOT case-converted or ported — they are raw SQL).
function concatExpr(dbType: string): string {
  switch (dbType) {
    case "mysql":
    case "mariadb":
      return "concat(first_name, ' ', last_name)";
    case "mssql":
      return "first_name + ' ' + last_name";
    case "postgres":
    case "cockroachdb":
    case "sqlite":
    default:
      return "first_name || ' ' || last_name";
  }
}

const User = defineModel(TABLE, {
  columns: {
    id: col.increment(),
    firstName: col.string({ nullable: false }),
    lastName: col.string({ nullable: false }),
    fullName: col.computed<string>(concatExpr(env.DB_TYPE ?? "sqlite")),
  },
});

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();
});

afterAll(async () => {
  await sql.disconnect();
});

beforeEach(async () => {
  await sql.schema().dropTableIfExists(TABLE).execute();
  await sql
    .schema()
    .createTable(TABLE, (table) => {
      // SQLite already makes `increment` an implicit PRIMARY KEY AUTOINCREMENT,
      // so adding `.primaryKey()` there would create a duplicate PK. Other
      // dialects need the explicit primary key for auto-increment.
      if (env.DB_TYPE === "sqlite") {
        table.increment("id");
      } else {
        table.increment("id").primaryKey();
      }
      table.string("first_name").notNullable();
      table.string("last_name").notNullable();
    })
    .execute();
});

afterEach(async () => {
  await sql.schema().dropTableIfExists(TABLE).execute();
});

describe(`[${env.DB_TYPE}] computed columns`, () => {
  test("registers computed column metadata (no physical type, no PK)", () => {
    const cols = User.getColumns();
    const fullName = cols.find((c) => c.columnName === "fullName");

    expect(fullName).toBeDefined();
    expect(fullName!.expression).toBe(concatExpr(env.DB_TYPE ?? "sqlite"));
    // No `type` -> excluded from auto-generated migrations
    expect(fullName!.type).toBeUndefined();
    expect(fullName!.isPrimary).toBe(false);
    expect(fullName!.databaseName).toBe("full_name");
  });

  test("static column ref exists on the model root", () => {
    expect(User.fullName).toBe(`${TABLE}.fullName`);
  });

  test("computed column is present in results only when explicitly selected", async () => {
    await sql.from(User).insert({
      firstName: "John",
      lastName: "Doe",
    });

    // Not selected -> absent from result
    const plain = await sql.from(User).one();
    expect(plain).not.toBeNull();
    expect((plain as any).fullName).toBeUndefined();

    // Explicitly selected -> present, aliased to the model column name
    const selected = await sql.from(User).select(User.fullName).one();
    expect(selected).not.toBeNull();
    expect((selected as any).fullName).toBe("John Doe");
  });

  test("computed column supports custom alias via tuple", async () => {
    await sql.from(User).insert({
      firstName: "Jane",
      lastName: "Smith",
    });

    const row = await sql
      .from(User)
      .select([User.fullName, "displayName"])
      .one();
    expect(row).not.toBeNull();
    expect((row as any).displayName).toBe("Jane Smith");
    expect((row as any).fullName).toBeUndefined();
  });

  test("computed column resolves to the raw expression in WHERE", async () => {
    await sql.from(User).insertMany([
      { firstName: "Alice", lastName: "Able" },
      { firstName: "Bob", lastName: "Builder" },
    ]);

    const row = await sql
      .from(User)
      .select(User.fullName)
      .where(User.fullName, "Alice Able")
      .one();
    expect(row).not.toBeNull();
    expect((row as any).fullName).toBe("Alice Able");
  });

  test("computed column resolves to the raw expression in ORDER BY", async () => {
    await sql.from(User).insertMany([
      { firstName: "Zed", lastName: "Zulu" },
      { firstName: "Ann", lastName: "Alpha" },
    ]);

    const rows = await sql
      .from(User)
      .select(User.firstName, User.lastName, User.fullName)
      .orderBy(User.fullName, "asc")
      .many();

    expect(rows.map((r: any) => r.fullName)).toEqual(["Ann Alpha", "Zed Zulu"]);
  });

  test("computed column is dropped from insert/update payloads", async () => {
    await sql.from(User).insert({
      firstName: "Eve",
      lastName: "Adams",
      fullName: "should be ignored" as any,
    });

    const row = await sql.from(User).one();
    expect((row as any).firstName).toBe("Eve");
    expect((row as any).lastName).toBe("Adams");
  });

  test("computed column never appears in generated INSERT SQL", async () => {
    const sqlStr = sql
      .from(User)
      .insert({
        firstName: "Eve",
        lastName: "Adams",
        fullName: "should be ignored" as any,
      })
      .toSql().sql;
    expect(sqlStr.toLowerCase()).not.toContain("full_name");
    expect(sqlStr.toLowerCase()).not.toContain("fullname");
  });

  test("computed column never appears in generated UPDATE SQL", async () => {
    const sqlStr = sql
      .from(User)
      .where("id", 1)
      .update({
        firstName: "Eve2",
        fullName: "should be ignored" as any,
      })
      .toSql().sql;
    expect(sqlStr.toLowerCase()).not.toContain("full_name");
    expect(sqlStr.toLowerCase()).not.toContain("fullname");
  });

  test("computed column never appears in generated upsert SQL", async () => {
    // ModelQueryBuilder.upsertMany executes immediately (.then() on WriteOperation).
    // If fullName leaked into the SQL, SQLite would reject the column in the
    // ON CONFLICT DO UPDATE SET clause. columnsToUpdate is derived from data
    // keys, so passing fullName in data tests that it's stripped before SQL gen.
    await sql
      .from(User)
      .upsertMany(["id"] as any, [
        { id: 1, firstName: "Eve", lastName: "Adams", fullName: "x" as any },
      ]);
    const row = await sql.from(User).where("id", 1).one();
    expect((row as any).firstName).toBe("Eve");
    expect((row as any).lastName).toBe("Adams");
  });

  test("computed columns are not emitted by the schema diff for new tables", async () => {
    // Computed columns carry no `type`, so the model's columns to add should
    // only contain physical columns.
    const modelColumns = User.getColumns().filter(
      (c) => c.type !== undefined && c.type !== null,
    );
    const names = modelColumns.map((c) => c.columnName);
    expect(names).toContain("id");
    expect(names).toContain("firstName");
    expect(names).toContain("lastName");
    expect(names).not.toContain("fullName");
  });

  test("@column.computed decorator registers the same metadata as col.computed", () => {
    class DecoratedBase extends Model {
      static get table() {
        return "decorated_computed_test";
      }
    }
    class DecoratedUser extends DecoratedBase {
      @column.computed(concatExpr(env.DB_TYPE ?? "sqlite"))
      fullName!: string | undefined;
    }

    const fullName = DecoratedUser.getColumns().find(
      (c) => c.columnName === "fullName",
    );
    expect(fullName).toBeDefined();
    expect(fullName!.expression).toBe(concatExpr(env.DB_TYPE ?? "sqlite"));
    expect(fullName!.type).toBeUndefined();
    expect(fullName!.databaseName).toBe("full_name");
  });
});

// ---------------------------------------------------------------------------
// Type-level checks (compile-time only)
// ---------------------------------------------------------------------------
describe(`[${env.DB_TYPE}] computed column types`, () => {
  test("ComputedColumnDef is returned by col.computed", () => {
    type AssertEqual<A, B> = [A] extends [B]
      ? [B] extends [A]
        ? true
        : never
      : never;

    const c = col.computed<string>("expr");
    const _check: AssertEqual<typeof c, ComputedColumnDef<string>> = true;
    expect(_check).toBe(true);
  });

  test("ColComputedOptions type is exported", () => {
    const opts: ColComputedOptions = { databaseName: "full_name" };
    expect(opts.databaseName).toBe("full_name");
  });

  test("inferred instance type treats computed column as optional", () => {
    type AssertAssignable<A, B> = A extends B ? true : never;

    type UserInstance = InstanceType<typeof User>;
    // fullName must be assignable from undefined (absent when not selected)
    const _check: AssertAssignable<undefined, UserInstance["fullName"]> = true;
    expect(_check).toBe(true);
  });
});
