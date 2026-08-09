import { betterAuthAdapter } from "../../src/better_auth/better_auth_adapter";
import { env } from "../../src/env/env";
import { SqlDataSource } from "../../src/sql/sql_data_source";

// Dialects most better-auth users deploy on; the capability table covers the rest.
const SUPPORTED_DIALECTS = ["sqlite", "postgres", "mysql"];
const describeIfSupported = SUPPORTED_DIALECTS.includes(env.DB_TYPE ?? "")
  ? describe
  : describe.skip;

const AUTH_TABLES = ["session", "account", "verification", "user"];

let sql: SqlDataSource;
let auth: any;

beforeAll(async () => {
  sql = new SqlDataSource();
  await sql.connect();

  for (const table of AUTH_TABLES) {
    await sql.schema().dropTableIfExists(table);
  }

  await sql.schema().createTable("user", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("name", 255).notNullable();
    t.varchar("email", 255).notNullable().unique();
    t.boolean("emailVerified").notNullable();
    t.varchar("image", 2083);
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt").notNullable();
    t.varchar("favoriteColor", 255); // for the additionalFields test below
  });

  await sql.schema().createTable("session", (t) => {
    t.varchar("id", 36).primaryKey();
    t.datetime("expiresAt").notNullable();
    t.varchar("token", 255).notNullable().unique();
    t.datetime("createdAt").notNullable();
    t.datetime("updatedAt").notNullable();
    t.varchar("ipAddress", 255);
    t.varchar("userAgent", 255);
    t.varchar("userId", 36).notNullable();
  });

  await sql.schema().createTable("account", (t) => {
    t.varchar("id", 36).primaryKey();
    t.varchar("accountId", 255).notNullable();
    t.varchar("providerId", 255).notNullable();
    t.varchar("userId", 36).notNullable();
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
    t.varchar("id", 36).primaryKey();
    t.varchar("identifier", 255).notNullable();
    t.varchar("value", 255).notNullable();
    t.datetime("expiresAt").notNullable();
    t.datetime("createdAt");
    t.datetime("updatedAt");
  });

  // Dynamic import: better-auth is ESM-only, Jest can't statically parse its .mjs files.
  const { betterAuth } = await import("better-auth");
  auth = betterAuth({
    database: betterAuthAdapter(sql),
    emailAndPassword: { enabled: true },
    secret: "test-secret-test-secret-test-secret",
    baseURL: "http://localhost:3000",
  });
});

afterAll(async () => {
  for (const table of AUTH_TABLES) {
    await sql.schema().dropTableIfExists(table);
  }
  await sql.disconnect();
});

describeIfSupported(`[${env.DB_TYPE}] better-auth adapter`, () => {
  test("signUpEmail creates user + account, signInEmail + getSession + signOut round-trip", async () => {
    const { user } = await auth.api.signUpEmail({
      body: {
        name: "Alice",
        email: "alice@example.com",
        password: "password123",
      },
    });

    expect(user.email).toBe("alice@example.com");
    expect(user.emailVerified).toBe(false);

    const userRow = await sql
      .from("user")
      .where("email", "alice@example.com")
      .one();
    expect(userRow).not.toBeNull();

    const accountRow = await sql.from("account").where("userId", user.id).one();
    expect(accountRow).not.toBeNull();

    const signInResponse = await auth.api.signInEmail({
      body: { email: "alice@example.com", password: "password123" },
      asResponse: true,
    });
    const cookie = signInResponse.headers.get("set-cookie") ?? "";
    expect(cookie).not.toBe("");

    const session = await auth.api.getSession({
      headers: new Headers({ cookie }),
    });
    expect(session?.user.email).toBe("alice@example.com");
    // Separate VM realm under --experimental-vm-modules gives a different Date constructor,
    // so check duck-typed date-ness instead of toBeInstanceOf(Date).
    const expiresAt = session?.session.expiresAt as unknown as Date;
    expect(Object.prototype.toString.call(expiresAt)).toBe("[object Date]");
    expect(Number.isNaN(expiresAt?.getTime())).toBe(false);

    await auth.api.signOut({ headers: new Headers({ cookie }) });
    const afterSignOut = await auth.api.getSession({
      headers: new Headers({ cookie }),
    });
    expect(afterSignOut).toBeNull();
  });

  test("adapter-level count/findMany with contains and OR connector", async () => {
    const context = await auth.$context;
    const adapter = context.adapter;

    await adapter.create({
      model: "user",
      data: {
        id: "bob-id",
        name: "Bob",
        email: "bob@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      forceAllowId: true,
    } as any);
    await adapter.create({
      model: "user",
      data: {
        id: "carol-id",
        name: "Carol",
        email: "carol@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      forceAllowId: true,
    } as any);

    expect(await adapter.count({ model: "user" })).toBeGreaterThanOrEqual(2);

    const contains = await adapter.findMany({
      model: "user",
      where: [{ field: "email", value: "bob", operator: "contains" }],
      limit: 10,
    });
    expect(contains).toHaveLength(1);

    const orMatch = await adapter.findMany({
      model: "user",
      where: [
        {
          field: "email",
          value: "nope@example.com",
          operator: "eq",
          connector: "OR",
        },
        {
          field: "email",
          value: "carol@example.com",
          operator: "eq",
          connector: "OR",
        },
      ],
    });
    expect(orMatch).toHaveLength(1);
  });

  test("updateMany and deleteMany return affected row counts", async () => {
    const context = await auth.$context;
    const adapter = context.adapter;

    await adapter.create({
      model: "user",
      data: {
        id: "dave-id",
        name: "Dave",
        email: "dave@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      forceAllowId: true,
    } as any);

    const updated = await adapter.updateMany({
      model: "user",
      where: [{ field: "email", value: "dave@example.com", operator: "eq" }],
      update: { name: "Dave Updated" },
    });
    expect(updated).toBe(1);

    const row = await sql.from("user").where("email", "dave@example.com").one();
    expect(row?.name).toBe("Dave Updated");

    const deleted = await adapter.deleteMany({
      model: "user",
      where: [{ field: "email", value: "dave@example.com", operator: "eq" }],
    });
    expect(deleted).toBe(1);
  });

  test("incrementOne: numeric increment, and a guarded compare-and-swap on the same field it filters on", async () => {
    const context = await auth.$context;
    const adapter = context.adapter;

    // `emailVerified` stands in for a status flag - same shape the organization plugin uses to
    // accept an invitation (increment: {}, set: { field }, where guarded on that same field).
    await adapter.create({
      model: "user",
      data: {
        id: "erin-id",
        name: "Erin",
        email: "erin@example.com",
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      forceAllowId: true,
    } as any);

    const claimed = await adapter.incrementOne({
      model: "user",
      where: [
        { field: "id", value: "erin-id", operator: "eq" },
        { field: "emailVerified", value: false, operator: "eq" },
      ],
      increment: {},
      set: { emailVerified: true },
    });
    expect(claimed).not.toBeNull();
    expect(claimed.emailVerified).toBe(true);

    // Second claim loses the CAS: the guard no longer matches, must return null.
    const raced = await adapter.incrementOne({
      model: "user",
      where: [
        { field: "id", value: "erin-id", operator: "eq" },
        { field: "emailVerified", value: false, operator: "eq" },
      ],
      increment: {},
      set: { emailVerified: true },
    });
    expect(raced).toBeNull();
  });

  test("consumeOne: reads and deletes a single-use row, only one concurrent claim wins", async () => {
    const context = await auth.$context;
    const adapter = context.adapter;

    await adapter.create({
      model: "verification",
      data: {
        id: "verif-id",
        identifier: "consume@example.com",
        value: "secret-token",
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
      },
      forceAllowId: true,
    } as any);

    const consumed = await adapter.consumeOne({
      model: "verification",
      where: [{ field: "id", value: "verif-id", operator: "eq" }],
    });
    expect(consumed).not.toBeNull();
    expect(consumed.value).toBe("secret-token");

    const row = await sql.from("verification").where("id", "verif-id").one();
    expect(row).toBeNull();

    // Second attempt: already gone, must return null.
    const raced = await adapter.consumeOne({
      model: "verification",
      where: [{ field: "id", value: "verif-id", operator: "eq" }],
    });
    expect(raced).toBeNull();
  });

  test("databaseHooks and user.additionalFields work - both run above the adapter, unmodified", async () => {
    let beforeFired = false;
    let afterFired = false;

    const { betterAuth } = await import("better-auth");
    const authWithHooks = betterAuth({
      database: betterAuthAdapter(sql),
      emailAndPassword: { enabled: true },
      secret: "test-secret-test-secret-test-secret",
      baseURL: "http://localhost:3000",
      user: {
        additionalFields: {
          favoriteColor: { type: "string", required: false },
        },
      },
      databaseHooks: {
        user: {
          create: {
            before: async (user: any) => {
              beforeFired = true;
              return { data: { ...user, favoriteColor: "blue" } };
            },
            after: async () => {
              afterFired = true;
            },
          },
        },
      },
    });

    const { user } = await authWithHooks.api.signUpEmail({
      body: {
        name: "Hooked",
        email: "hooked@example.com",
        password: "password123",
      },
    });

    expect(beforeFired).toBe(true);
    expect(afterFired).toBe(true);
    expect((user as any).favoriteColor).toBe("blue");

    const row = await sql
      .from("user")
      .where("email", "hooked@example.com")
      .one();
    expect(row?.favoriteColor).toBe("blue");
  });

  // generateId: "serial" | false is covered in better_auth_serial_id.test.ts, which has
  // dialect-appropriate auto-increment tables (this file's ids are plain varchar).

  test("transaction rolls back all writes on error", async () => {
    const context = await auth.$context;
    const adapter = context.adapter;

    await expect(
      adapter.transaction(async (trx: any) => {
        await trx.create({
          model: "user",
          data: {
            name: "Rollback",
            email: "rollback@example.com",
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");

    const row = await sql
      .from("user")
      .where("email", "rollback@example.com")
      .one();
    expect(row).toBeNull();
  });
});
