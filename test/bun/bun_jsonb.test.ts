/// <reference types="bun-types" />
/**
 * Bun.sql-specific regression: a `prepare`d string payload destined for a jsonb
 * column was stored double-encoded.
 *
 * `jsonColumn.prepare` returns `JSON.stringify(value)`, and the write interpreter
 * keyed its cast off the JS value alone — so a string parameter carried no cast.
 * node-pg coerces the text parameter into jsonb, but Bun.sql binds a JS string as a
 * JSON string, storing the scalar `"{\"sandbox\":true}"` instead of the object.
 * Reads still worked (`serialize` re-parses), so it was silent, but `->>` returned
 * NULL — which is what broke the sandbox filter downstream.
 *
 * Servers are reached by service name on the compose network; the worktree compose
 * file publishes no host ports, so this runs via `docker run --network`.
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { SqlDataSource } from "../../src/sql/sql_data_source";
import { col, defineModel } from "../../src/sql/models/define_model";

const BunPayload = defineModel("bun_jsonb_probe", {
  columns: {
    id: col.increment(),
    setup: col.jsonb(),
    note: col.text(),
  },
});

type RawPg = { rows: Array<Record<string, unknown>>; rowCount: number };

let sql: SqlDataSource;
let reachable = false;

beforeAll(async () => {
  sql = new SqlDataSource({
    type: "postgres",
    host: process.env.DB_HOST || "postgres",
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "root",
    database: process.env.DB_DATABASE || "test",
    logs: false,
  });
  try {
    await sql.connect();
    reachable = true;
    await sql.rawQuery(`drop table if exists bun_jsonb_probe`);
    await sql.rawQuery(
      `create table bun_jsonb_probe (id serial primary key, setup jsonb, note text)`,
    );
  } catch {
    reachable = false;
  }
});

afterAll(async () => {
  if (reachable && sql?.isConnected) {
    await sql.rawQuery(`drop table if exists bun_jsonb_probe`);
    await sql.disconnect();
  }
});

/** Reads the document discriminator straight from SQL, bypassing the ORM. */
const probe = async (): Promise<{ t: unknown; v: unknown }> => {
  const raw = (await sql.rawQuery(
    `select jsonb_typeof(setup) as t, setup->>'sandbox' as v from bun_jsonb_probe`,
  )) as RawPg;
  return { t: raw.rows[0]?.t, v: raw.rows[0]?.v };
};

describe("bun-sql jsonb binding", () => {
  it("model insert stores an object, not a JSON string", async () => {
    if (!reachable) {
      return;
    }

    await sql.rawQuery(`truncate bun_jsonb_probe`);
    await sql.from(BunPayload).insert({ setup: { sandbox: true } });

    // The discriminator: ->> cannot read out of a JSON string scalar, and the
    // ORM read path would still succeed either way (serialize re-parses).
    expect(await probe()).toEqual({ t: "object", v: "true" });
  });

  it("model update stores an object, not a JSON string", async () => {
    if (!reachable) {
      return;
    }

    await sql.rawQuery(`truncate bun_jsonb_probe`);
    const inserted = await sql
      .from(BunPayload)
      .insert({ setup: { sandbox: false } }, { returning: ["id"] });

    // NOTE: `where(column, "is", null)` is skipped here — it generates invalid SQL
    // under Bun.sql for reasons unrelated to the jsonb cast (it drops the where
    // clause entirely). Tracked separately.
    await sql
      .from(BunPayload)
      .where("id", "=", inserted.id)
      .update({ setup: { sandbox: true } });

    expect(await probe()).toEqual({ t: "object", v: "true" });
  });

  it("a text column is unaffected", async () => {
    if (!reachable) {
      return;
    }

    await sql.rawQuery(`truncate bun_jsonb_probe`);
    await sql.from(BunPayload).insert({ note: "plain" });

    const raw = (await sql.rawQuery(
      `select note from bun_jsonb_probe`,
    )) as RawPg;

    expect(raw.rows[0].note).toBe("plain");
  });
});
