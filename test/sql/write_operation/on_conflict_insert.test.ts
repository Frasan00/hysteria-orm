import crypto from "node:crypto";
import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { UserWithUuid } from "../test_models/uuid/schema";

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

describe(`[${env.DB_TYPE}] insert().onConflict()`, () => {
  test("merge() updates the conflicting row on the raw builder", async () => {
    const id = crypto.randomUUID();
    await sql
      .from("users_with_uuid")
      .insert({ id, name: "Original", email: "original@example.com" });

    await sql
      .from("users_with_uuid")
      .insert({ id, name: "Updated", email: "updated@example.com" })
      .onConflict("id")
      .merge();

    const user = await sql.from("users_with_uuid").where("id", id).oneOrFail();
    expect(user.name).toBe("Updated");
    expect(user.email).toBe("updated@example.com");
    expect(await sql.from("users_with_uuid").getCount()).toBe(1);
  });

  test("merge([column]) updates only the listed columns", async () => {
    const id = crypto.randomUUID();
    await sql
      .from("users_with_uuid")
      .insert({ id, name: "Original", email: "original@example.com" });

    await sql
      .from("users_with_uuid")
      .insert({ id, name: "Renamed", email: "updated@example.com" })
      .onConflict("id")
      .merge(["name"]);

    const user = await sql.from("users_with_uuid").where("id", id).oneOrFail();
    expect(user.name).toBe("Renamed");
    expect(user.email).toBe("original@example.com");
  });

  test("ignore() leaves the conflicting row untouched", async () => {
    const id = crypto.randomUUID();
    await sql
      .from("users_with_uuid")
      .insert({ id, name: "Original", email: "original@example.com" });

    await sql
      .from("users_with_uuid")
      .insert({ id, name: "Ignored", email: "ignored@example.com" })
      .onConflict("id")
      .ignore();

    const user = await sql.from("users_with_uuid").where("id", id).oneOrFail();
    expect(user.name).toBe("Original");
    expect(user.email).toBe("original@example.com");
    expect(await sql.from("users_with_uuid").getCount()).toBe(1);
  });

  test("merge() inserts rows that do not conflict", async () => {
    const existingId = crypto.randomUUID();
    const newId = crypto.randomUUID();
    await sql.from("users_with_uuid").insert({
      id: existingId,
      name: "Existing",
      email: "existing@example.com",
    });

    await sql
      .from("users_with_uuid")
      .insertMany([
        { id: existingId, name: "Refreshed", email: "existing@example.com" },
        { id: newId, name: "Brand New", email: "new@example.com" },
      ])
      .onConflict(["id"])
      .merge();

    const existing = await sql
      .from("users_with_uuid")
      .where("id", existingId)
      .oneOrFail();
    const created = await sql
      .from("users_with_uuid")
      .where("id", newId)
      .oneOrFail();

    expect(existing.name).toBe("Refreshed");
    expect(created.name).toBe("Brand New");
    expect(await sql.from("users_with_uuid").getCount()).toBe(2);
  });

  test("works on the model builder", async () => {
    const id = crypto.randomUUID();
    await sql
      .from(UserWithUuid)
      .insert({ id, name: "Original", email: "original@example.com" });

    await sql
      .from(UserWithUuid)
      .insert({ id, name: "Updated", email: "updated@example.com" })
      .onConflict("id")
      .merge(["name"]);

    const user = await sql.from(UserWithUuid).where("id", id).oneOrFail();
    expect(user.name).toBe("Updated");
    expect(user.email).toBe("original@example.com");
  });

  test("returns the inserted row when returning is requested", async () => {
    const id = crypto.randomUUID();
    await sql
      .from(UserWithUuid)
      .insert({ id, name: "Original", email: "original@example.com" });

    const rows = await sql
      .from(UserWithUuid)
      .insert(
        { id, name: "Updated", email: "updated@example.com" },
        { returning: ["id", "name"] },
      )
      .onConflict("id")
      .merge();

    expect(rows).toBeDefined();
    expect(rows!.name).toBe("Updated");
  });

  test("a plain insert still resolves to void", async () => {
    const result = await sql.from(UserWithUuid).insert({
      id: crypto.randomUUID(),
      name: "Plain",
      email: "plain@example.com",
    });

    expect(result).toBeUndefined();
  });

  test("rejects when onConflict() has no action", async () => {
    await expect(
      sql
        .from("users_with_uuid")
        .insert({ id: crypto.randomUUID(), name: "No Action" })
        .onConflict("id"),
    ).rejects.toThrow(/ON_CONFLICT_REQUIRES_MERGE_OR_IGNORE/);
  });
});
