/**
 * `col.datetime({ autoUpdate: true })` promises that the column advances on every
 * update, even when the caller does not put it in the payload. Its own JSDoc says the
 * implementation is "code wise … not a trigger in the database".
 *
 * 12.0.0 removed the `autoUpdateColumns` list from prepareColumns, which made the flag
 * inert on the model path: nothing injected the column into an UPDATE payload, so
 * `updated_at` stayed frozen at its insert value. These tests pin the flag's promise.
 *
 * The baseline is set explicitly to a past date rather than sleeping for real time, so
 * the assertion is deterministic and does not depend on clock resolution.
 */

import { env } from "../../src/env/env";
import { SqlDataSource } from "../../src/sql/sql_data_source";
import { UserWithUuid } from "./test_models/uuid/schema";
import { UserFactory } from "./test_models/factory/user_factory";

let sql: SqlDataSource;

// Well in the past, and safely distinguishable at any datetime precision.
const PAST = new Date("2020-01-02T03:04:05.000Z");

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

describe(`[${env.DB_TYPE}] autoUpdate columns`, () => {
  test("advanced on update even when omitted from the payload", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);

    // Pin the baseline to a known past value (an explicit value wins).
    await sql
      .from(UserWithUuid)
      .where("id", user.id)
      .update({ updatedAt: PAST });

    // Now update without mentioning the column at all.
    await sql
      .from(UserWithUuid)
      .where("id", user.id)
      .update({ name: "renamed-by-auto-update-test" });

    const after = await sql.from(UserWithUuid).where("id", user.id).one();

    expect(after?.name).toBe("renamed-by-auto-update-test");
    expect(after?.updatedAt).toBeInstanceOf(Date);
    const advanced = after?.updatedAt as Date;
    expect(advanced.getTime()).toBeGreaterThan(PAST.getTime());
  });

  test("also regenerates when the caller supplies a value", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);

    // The flag's contract is that prepare is called "regardless of whether the
    // value has been provided in the update payload", and the datetime prepare
    // returns the update time for any truthy input — so an explicit value does
    // not win. Pinned deliberately: callers wanting a fixed timestamp must
    // remove autoUpdate from the column.
    await sql
      .from(UserWithUuid)
      .where("id", user.id)
      .update({ updatedAt: PAST });

    const after = await sql.from(UserWithUuid).where("id", user.id).one();

    expect(after?.updatedAt).toBeInstanceOf(Date);
    const regenerated = after?.updatedAt as Date;
    expect(regenerated.getTime()).toBeGreaterThan(PAST.getTime());
  });
});
