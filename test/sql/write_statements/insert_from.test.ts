/**
 * End-to-end coverage for insertFrom(). Rows come from a SELECT, so no model hooks or
 * autoCreate columns run; the tests assert the rows actually land, that a target column
 * list maps positionally, and that a conflict action chains onto the source insert.
 */

import { randomUUID } from "node:crypto";
import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";
import { UserFactory } from "../test_models/factory/user_factory";
import { UserWithoutPk } from "../test_models/without_pk/user_without_pk";
import { PostWithUuid, UserWithUuid } from "../test_models/uuid/schema";

let sql: SqlDataSource;

const dbType = env.DB_TYPE as SqlDataSourceType;

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

describe(`[${env.DB_TYPE}] insertFrom()`, () => {
  test("copies the selected rows into the target table", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);

    await sql
      .from(UserWithoutPk)
      .insertFrom(["name", "email", "password"], (qb) =>
        qb
          .select("name", "email", "password")
          .fromRaw("users_with_uuid")
          .whereRaw("id = ?", [user.id]),
      );

    const copied = await sql
      .from(UserWithoutPk)
      .where("email", user.email)
      .oneOrFail();
    expect(copied.name).toBe(user.name);
  });

  test("maps columns positionally when no target list is given", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const sourceId = randomUUID();
    const copyId = randomUUID();

    await sql.from(PostWithUuid).insert({
      id: sourceId,
      userId: user.id,
      title: "Original",
      content: "body",
    });

    // Positional inserts need the source to list every target column, in table order.
    await sql
      .from(PostWithUuid)
      .insertFrom((qb) =>
        qb
          .selectRaw(
            `'${copyId}' as id, user_id, title, content, short_description, created_at, updated_at, deleted_at`,
          )
          .fromRaw("posts_with_uuid")
          .whereRaw("id = ?", [sourceId]),
      );

    const copied = await sql.from(PostWithUuid).where("id", copyId).oneOrFail();
    expect(copied.title).toBe("Original");
  });

  test("chains ignore() onto the source insert", async () => {
    // MSSQL resolves an insert conflict through MERGE, which insertFrom does not build.
    if (dbType === "mssql") {
      return;
    }

    const user = await UserFactory.userWithUuid(sql, 1);

    const insert = () =>
      sql
        .from(UserWithoutPk)
        .insertFrom(["name", "email", "password"], (qb) =>
          qb
            .select("name", "email", "password")
            .fromRaw("users_with_uuid")
            .whereRaw("id = ?", [user.id]),
        )
        .onConflict("email")
        .ignore();

    await insert();
    await insert();

    expect(
      await sql.from(UserWithoutPk).where("email", user.email).getCount(),
    ).toBe(1);
  });

  test("terminates a sqlite source select before ON CONFLICT", async () => {
    if (dbType !== "sqlite") {
      return;
    }

    const user = await UserFactory.userWithUuid(sql, 1);

    await sql
      .from(UserWithoutPk)
      .insertFrom(["name", "email", "password"], (qb) =>
        qb
          .select("name", "email", "password")
          .fromRaw("users_with_uuid")
          .whereRaw("id = ?", [user.id]),
      )
      .onConflict("email")
      .ignore();

    expect(
      await sql.from(UserWithoutPk).where("email", user.email).getCount(),
    ).toBe(1);
  });
});
