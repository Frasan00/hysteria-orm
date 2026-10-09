/**
 * Cross-dialect coverage for the SELECT-side additions: tuple IN, NULLS FIRST/LAST
 * (including the MySQL and MSSQL emulation), negated and object-shorthand predicates,
 * joinRaw bindings, derived-table joins and materialized CTEs. Needs a live database.
 */

import { env } from "../../../src/env/env";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import { PostFactory } from "../test_models/factory/post_factory";
import { UserFactory } from "../test_models/factory/user_factory";
import { PostWithUuid } from "../test_models/uuid/schema";

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

const insertPost = async (title: string, userId: string | null) =>
  sql
    .from(PostWithUuid)
    .insert({ ...PostFactory.getCommonPostData(), title, userId } as never, {
      returning: ["*"],
    });

describe(`[${env.DB_TYPE}] select expressiveness`, () => {
  test("tuple IN matches only the listed combinations", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const first = await insertPost("tuple-a", user.id);
    const second = await insertPost("tuple-b", user.id);

    const rows = await sql
      .from(PostWithUuid)
      .select("id")
      .whereIn(
        ["id", "title"],
        [
          [first.id, "tuple-a"],
          [second.id, "wrong-title"],
        ],
      )
      .many();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(first.id);
  });

  test("negated tuple IN excludes the listed combinations", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const first = await insertPost("tuple-not-a", user.id);
    const second = await insertPost("tuple-not-b", user.id);

    const rows = await sql
      .from(PostWithUuid)
      .select("id")
      .whereIn("id", [first.id, second.id])
      .whereNotIn(["id", "title"], [[first.id, "tuple-not-a"]])
      .many();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(second.id);
  });

  test("nulls first and nulls last order the same set differently", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const linked = await insertPost("nulls-linked", user.id);
    const orphan = await insertPost("nulls-orphan", null);
    const ids = [linked.id, orphan.id];

    const nullsFirst = await sql
      .from(PostWithUuid)
      .select("id")
      .whereIn("id", ids)
      .orderBy("user_id", { direction: "asc", nulls: "first" })
      .many();

    const nullsLast = await sql
      .from(PostWithUuid)
      .select("id")
      .whereIn("id", ids)
      .orderBy("user_id", { direction: "asc", nulls: "last" })
      .many();

    expect(nullsFirst[0].id).toBe(orphan.id);
    expect(nullsLast[nullsLast.length - 1].id).toBe(orphan.id);
  });

  test("whereNot with a callback negates the whole group", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const first = await insertPost("not-group-a", user.id);
    const second = await insertPost("not-group-b", user.id);

    const rows = await sql
      .from(PostWithUuid)
      .select("id")
      .whereIn("id", [first.id, second.id])
      .whereNot((qb) =>
        qb
          .where("title", "=", "not-group-a")
          .orWhere("title", "=", "not-group-b"),
      )
      .many();

    expect(rows).toHaveLength(0);
  });

  test("object shorthand where maps values, operators and $or", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const first = await insertPost("shorthand-a", user.id);
    const second = await insertPost("shorthand-b", user.id);

    const byIn = await sql
      .from(PostWithUuid)
      .select("id")
      .where({ id: { op: "$in", value: [first.id, second.id] } })
      .many();
    expect(byIn).toHaveLength(2);

    const byOr = await sql
      .from(PostWithUuid)
      .select("id")
      .where({ id: { op: "$in", value: [first.id, second.id] } })
      .where({ $or: [{ title: "shorthand-a" }, { title: "shorthand-b" }] })
      .many();
    expect(byOr).toHaveLength(2);

    const none = await sql
      .from(PostWithUuid)
      .select("id")
      .whereIn("id", [first.id, second.id])
      .where({ $or: [{ title: "shorthand-a" }, { title: "nope" }] })
      .many();
    expect(none).toHaveLength(1);
    expect(none[0].id).toBe(first.id);
  });

  test("whereILike is case-insensitive on every dialect", async () => {
    const post = await insertPost("MixedCase Title", null);

    const rows = await sql
      .from(PostWithUuid)
      .select("id")
      .whereIn("id", [post.id])
      .whereILike("title", "%mixedcase%")
      .many();

    expect(rows).toHaveLength(1);
  });

  test("joinRaw bindings are numbered with the rest of the query", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const post = await insertPost("raw-join-title", user.id);

    const rows = await sql
      .from(PostWithUuid)
      .select("posts_with_uuid.id")
      .whereIn("posts_with_uuid.id", [post.id])
      .joinRaw(
        "posts_with_uuid as raw_posts on raw_posts.id = posts_with_uuid.id and raw_posts.title = ?",
        ["raw-join-title"],
      )
      .many();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(post.id);
  });

  test("derived-table joins read from a subquery", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const post = await insertPost("derived-title", user.id);

    const rows = await sql
      .from(PostWithUuid)
      .select("posts_with_uuid.id")
      .leftJoin(
        (qb) =>
          qb
            .table("posts_with_uuid")
            .select("id")
            .where("title", "=", "derived-title"),
        "derived_posts",
        "derived_posts.id",
        "posts_with_uuid.id",
      )
      .where("posts_with_uuid.id", "=", post.id)
      .many();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(post.id);
  });

  test("outer join aliases behave like their base joins", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const post = await insertPost("outer-alias", user.id);

    const rows = await sql
      .from(PostWithUuid)
      .select("posts_with_uuid.id", ["users_with_uuid.name", "userName"])
      .leftOuterJoin(
        "users_with_uuid",
        "users_with_uuid.id",
        "posts_with_uuid.user_id",
      )
      .where("posts_with_uuid.id", "=", post.id)
      .many();

    expect(rows).toHaveLength(1);
  });

  test("materialized CTEs are accepted where the dialect supports them", async () => {
    const supported = ["postgres", "cockroachdb", "sqlite"];
    if (!supported.includes(env.DB_TYPE ?? "")) {
      return;
    }

    const user = await UserFactory.userWithUuid(sql, 1);
    const post = await insertPost("materialized-title", user.id);

    const rows = await sql
      .from(PostWithUuid)
      .withMaterialized("mat_posts", (qb) =>
        qb
          .table("posts_with_uuid")
          .select("id")
          .where("title", "=", "materialized-title"),
      )
      .select("posts_with_uuid.id")
      .where("posts_with_uuid.id", "=", post.id)
      .many();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(post.id);
  });

  test("value reads a single column from the first row", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const post = await insertPost("terminal-title", user.id);

    const model = await sql
      .from(PostWithUuid)
      .where("id", "=", post.id)
      .value("title");
    // a narrowed select() only leaves its own columns readable
    const raw = await sql
      .from("posts_with_uuid")
      .select("id", ["title", "postTitle"])
      .where("id", "=", post.id)
      .value("postTitle");

    expect(model).toBe("terminal-title");
    expect(raw).toBe("terminal-title");
  });

  test("value resolves to undefined when nothing matches", async () => {
    const missing = await sql
      .from(PostWithUuid)
      .where("id", "=", "00000000-0000-0000-0000-000000000000")
      .value("title");

    expect(missing).toBeUndefined();
  });

  test("skipBinding inlines the pagination values on every dialect", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const post = await insertPost("paged-title", user.id);

    const rows = await sql
      .from(PostWithUuid)
      .select("id")
      .whereIn("id", [post.id])
      .orderBy("id", "asc")
      .limit(10, { skipBinding: true })
      .offset(0, { skipBinding: true })
      .many();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(post.id);
  });

  test("modify applies a shared scope", async () => {
    const user = await UserFactory.userWithUuid(sql, 1);
    const post = await insertPost("scoped-title", user.id);

    const onlyTitle = (qb: any, title: string) => qb.where("title", "=", title);

    const rows = await sql
      .from(PostWithUuid)
      .select("id")
      .whereIn("id", [post.id])
      .modify(onlyTitle, "scoped-title")
      .many();

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe(post.id);
  });

  test("queryContext reaches the before-query observer", async () => {
    const seen: Array<Record<string, any>> = [];
    // queries inside a global transaction run on a separate datasource, which owns its own observer chain
    const target = sql.getTransactionBoundSqlDataSource() ?? sql;
    target.addObserver({
      onBeforeQuery: (ctx) => {
        seen.push(ctx as unknown as Record<string, any>);
      },
    });

    await sql
      .from(PostWithUuid)
      .select("id")
      .queryContext({ requestId: "req-1" })
      .limit(1)
      .many();

    const matched = seen.find((ctx) => ctx.requestId === "req-1");
    expect(matched).toBeDefined();
    // the runner always owns these, whatever the caller passes
    expect(typeof matched?.sql).toBe("string");
  });

  test("debug turns logging on for one query, and off again", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    try {
      const before = logSpy.mock.calls.length;
      await sql.from(PostWithUuid).select("id").debug().limit(1).many();
      expect(logSpy.mock.calls.length).toBeGreaterThan(before);

      const afterDebug = logSpy.mock.calls.length;
      await sql.from(PostWithUuid).select("id").debug(false).limit(1).many();
      expect(logSpy.mock.calls.length).toBe(afterDebug);
    } finally {
      logSpy.mockRestore();
    }
  });

  test("from only is accepted by postgres", async () => {
    if (env.DB_TYPE !== "postgres") {
      return;
    }

    const user = await UserFactory.userWithUuid(sql, 1);
    const post = await insertPost("only-title", user.id);

    const rows = await sql
      .from(PostWithUuid)
      .select("id")
      .where("id", "=", post.id)
      .fromOnly(true)
      .many();

    expect(rows).toHaveLength(1);
  });

  // Compile-time only: value() reads from the selection, so only selected columns are accepted
  test.skip("value only accepts the columns the query selects", () => {
    sql
      .from("posts_with_uuid")
      .select("id", ["title", "postTitle"])
      .value("postTitle");

    sql
      .from("posts_with_uuid")
      .select("id", ["title", "postTitle"])
      // @ts-expect-error the select narrowed the result to id and postTitle
      .value("userId");

    // an unnarrowed query still reads every model column
    sql.from(PostWithUuid).value("title");
  });

  // Compile-time only: the object shorthand is typed against the model's columns
  test.skip("the object shorthand rejects unknown columns", () => {
    sql.from(PostWithUuid).where({ title: "shorthand", userId: null });
    sql.from(PostWithUuid).where({ $or: [{ title: "a" }, { userId: null }] });

    // @ts-expect-error `nope` is not a column of the model
    sql.from(PostWithUuid).where({ nope: "a" });

    // @ts-expect-error a text column does not take a numeric comparison
    sql.from(PostWithUuid).where({ title: { op: "$gte", value: 3 } });
  });
});
