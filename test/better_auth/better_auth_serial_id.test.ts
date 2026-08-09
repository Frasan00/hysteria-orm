import { betterAuthAdapter } from "../../src/better_auth/better_auth_adapter";
import { env } from "../../src/env/env";
import { SqlDataSource } from "../../src/sql/sql_data_source";

// Separate file: needs integer-id tables, unlike the varchar ids the rest of the suite uses.
const SUPPORTED_DIALECTS = ["sqlite", "postgres", "mysql"];
const describeIfSupported = SUPPORTED_DIALECTS.includes(env.DB_TYPE ?? "")
  ? describe
  : describe.skip;
const RETURNING_DIALECTS = ["postgres", "cockroachdb", "mssql"];

const TABLES = ["session", "account", "verification", "user"];

// mysql requires the auto-increment column to also be declared PRIMARY KEY; sqlite errors with
// "more than one primary key" if it is (increment() already makes it one there).
function autoIncrementId(t: any) {
  const col = t.increment("id");
  return env.DB_TYPE === "mysql" ? col.primaryKey() : col;
}

let sql: SqlDataSource;
let auth: any;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();

  for (const table of TABLES) {
    await sql.schema().dropTableIfExists(table);
  }

  await sql.schema().createTable("user", (t) => {
    autoIncrementId(t);
    t.varchar("name", 255).notNullable();
    t.varchar("email", 255).notNullable().unique();
    t.boolean("emailVerified").notNullable();
    t.varchar("image", 2083);
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt").notNullable();
  });

  await sql.schema().createTable("session", (t) => {
    autoIncrementId(t);
    t.datetime("expiresAt").notNullable();
    t.varchar("token", 255).notNullable().unique();
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt").notNullable();
    t.varchar("ipAddress", 255);
    t.varchar("userAgent", 255);
    t.integer("userId").notNullable();
  });

  await sql.schema().createTable("account", (t) => {
    autoIncrementId(t);
    t.varchar("accountId", 255).notNullable();
    t.varchar("providerId", 255).notNullable();
    t.integer("userId").notNullable();
    t.varchar("accessToken", 2083);
    t.varchar("refreshToken", 2083);
    t.varchar("idToken", 2083);
    t.datetime("accessTokenExpiresAt");
    t.datetime("refreshTokenExpiresAt");
    t.varchar("scope", 255);
    t.varchar("password", 255);
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt").notNullable();
  });

  await sql.schema().createTable("verification", (t) => {
    autoIncrementId(t);
    t.varchar("identifier", 255).notNullable();
    t.varchar("value", 255).notNullable();
    t.datetime("expiresAt").notNullable();
    t.datetime("createdAt");
    t.datetime("updatedAt");
  });

  const { betterAuth } = await import("better-auth");
  auth = betterAuth({
    database: betterAuthAdapter(sql),
    emailAndPassword: { enabled: true },
    secret: "test-secret-test-secret-test-secret",
    baseURL: "http://localhost:3000",
    advanced: { database: { generateId: "serial" } },
  });
});

afterAll(async () => {
  for (const table of TABLES) {
    await sql.schema().dropTableIfExists(table);
  }
  await sql.disconnect();
});

describeIfSupported(
  `[${env.DB_TYPE}] better-auth adapter with generateId: "serial"`,
  () => {
    if (RETURNING_DIALECTS.includes(env.DB_TYPE ?? "")) {
      test("signs up and signs in with a database-generated numeric id", async () => {
        const { user } = await auth.api.signUpEmail({
          body: {
            name: "Serial",
            email: "serial@example.com",
            password: "password123",
          },
        });
        expect(user.id).toBeTruthy();
        expect(typeof user.id).toBe("string"); // better-auth always surfaces ids as strings

        const row = await sql
          .from("user")
          .where("email", "serial@example.com")
          .one();
        expect(typeof row?.id).toBe("number");

        const signIn = await auth.api.signInEmail({
          body: { email: "serial@example.com", password: "password123" },
          asResponse: true,
        });
        expect(signIn.status).toBe(200);

        const session = await auth.api.getSession({
          headers: new Headers({
            cookie: signIn.headers.get("set-cookie") ?? "",
          }),
        });
        expect(session?.user.email).toBe("serial@example.com");
      });
    } else {
      test("fails clearly instead of inserting a row with no id", async () => {
        await expect(
          auth.api.signUpEmail({
            body: {
              name: "Serial",
              email: "serial@example.com",
              password: "password123",
            },
          }),
        ).rejects.toThrow();

        const row = await sql
          .from("user")
          .where("email", "serial@example.com")
          .one();
        expect(row).toBeNull();
      });
    }
  },
);
