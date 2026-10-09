/**
 * DB-free tests for the extended join surface: `joinRaw` bindings, derived-table
 * joins and the outer-join aliases. SQL and bindings are asserted per dialect.
 */

import { defineModel, col } from "../../../src/sql/models/define_model";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const Users = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.text(),
  },
});

const Orders = defineModel("orders", {
  columns: {
    id: col.increment(),
    user_id: col.integer(),
    total: col.integer(),
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

describe("joinRaw() bindings", () => {
  it("numbers the raw placeholders in order with the rest of the query", () => {
    const { sql, bindings } = builderFor("postgres")
      .select("*")
      .where("name", "=", "outer")
      .leftJoinRaw(
        "posts on posts.user_id = users.id and posts.total > ?",
        [50],
      )
      .toSql();

    expect(sql).toContain("left join posts on posts.user_id = users.id");
    expect(sql).toMatch(/posts\.total > \$\d+/);
    expect(new Set(bindings)).toEqual(new Set(["outer", 50]));
    // the join is rendered before the WHERE, so its binding comes first
    expect(bindings[0]).toBe(50);
  });

  it("emits ? placeholders on mysql and sqlite", () => {
    for (const dbType of ["mysql", "mariadb", "sqlite"] as const) {
      const { sql } = builderFor(dbType)
        .select("*")
        .leftJoinRaw(
          "posts on posts.user_id = users.id and posts.total > ?",
          [50],
        )
        .toSql();

      expect(sql).toContain("posts.total > ?");
    }
  });

  it("emits @n placeholders on mssql", () => {
    const { sql } = builderFor("mssql")
      .select("*")
      .leftJoinRaw(
        "posts on posts.user_id = users.id and posts.total > ?",
        [50],
      )
      .toSql();

    expect(sql).toContain("posts.total > @1");
  });
});

describe("derived-table joins", () => {
  it("wraps the subquery and aliases it on every dialect", () => {
    const expected = {
      postgres:
        'left join (select "user_id" from "orders" where "total" > $1) as "big_orders" on "big_orders"."user_id" = "users"."id"',
      cockroachdb:
        'left join (select "user_id" from "orders" where "total" > $1) as "big_orders" on "big_orders"."user_id" = "users"."id"',
      mysql:
        "left join (select `user_id` from `orders` where `total` > ?) as `big_orders` on `big_orders`.`user_id` = `users`.`id`",
      mariadb:
        "left join (select `user_id` from `orders` where `total` > ?) as `big_orders` on `big_orders`.`user_id` = `users`.`id`",
      sqlite:
        'left join (select "user_id" from "orders" where "total" > ?) as "big_orders" on "big_orders"."user_id" = "users"."id"',
      mssql:
        "left join (select [user_id] from [orders] where [total] > @1) as [big_orders] on [big_orders].[user_id] = [users].[id]",
    } as const;

    for (const [dbType, fragment] of Object.entries(expected)) {
      const { sql, bindings } = builderFor(dbType as SqlDataSourceType)
        .select("*")
        .leftJoin(
          (qb: any) =>
            qb.table("orders").select("user_id").where("total", ">", 10),
          "big_orders",
          "big_orders.user_id",
          "users.id",
        )
        .toSql();

      expect(sql).toContain(fragment);
      expect(bindings).toEqual([10]);
    }
  });

  it("accepts a plain column when the caller passes the alias explicitly", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .innerJoin(
        (qb: any) =>
          qb.table("orders").select("user_id").where("total", ">", 10),
        "big_orders",
        "big_orders.user_id",
        "users.id",
      )
      .toSql();

    expect(sql).toContain('(select "user_id" from "orders"');
    expect(sql).toContain('on "big_orders"."user_id" = "users"."id"');
  });

  it("accepts a returned builder instead of a mutated callback argument", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .join(
        (qb: any) => qb.table("orders").select("user_id"),
        "o",
        "o.user_id",
        "users.id",
      )
      .toSql();

    expect(sql).toContain('(select "user_id" from "orders") as "o"');
  });

  it("cross joins a derived table without an ON clause", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .crossJoin((qb: any) => qb.table("orders").select("id"), "o")
      .toSql();

    expect(sql).toContain(
      'from "users" cross join (select "id" from "orders") as "o"',
    );
    expect(sql).not.toContain(" on ");
  });

  it("still joins a model by its table name", () => {
    const { sql } = builderFor("postgres")
      .select("*")
      .join(Orders, "user_id", "users.id")
      .toSql();

    expect(sql).toContain(
      'inner join "orders" on "orders"."user_id" = "users"."id"',
    );
  });

  it("refuses a derived table without an alias", () => {
    expect(() =>
      (
        builderFor("postgres").select("*") as unknown as {
          join: (cb: unknown, alias: string) => void;
        }
      ).join((qb: any) => qb.table("orders").select("id"), ""),
    ).toThrow(/MISSING_ALIAS_FOR_SUBQUERY/);
  });

  it("numbers the subquery bindings ahead of the outer WHERE", () => {
    const { sql, bindings } = builderFor("postgres")
      .select("*")
      .where("name", "=", "ana")
      .join(
        (qb: any) =>
          qb.table("orders").select("user_id").where("total", ">", 10),
        "o",
        "o.user_id",
        "users.id",
      )
      .toSql();

    expect(sql).toMatch(/"total" > \$1/);
    expect(sql).toMatch(/"name" = \$2/);
    expect(bindings).toEqual([10, "ana"]);
  });

  it("keeps the ON-condition index right on a later join", () => {
    const { sql, bindings } = builderFor("postgres")
      .select("*")
      .join("orders", "orders.user_id", "users.id", (on: any) =>
        on.where("total", ">", 10),
      )
      .join("tags", "tags.order_id", "orders.id", (on: any) =>
        on.where("kind", "=", "vip"),
      )
      .toSql();

    expect(sql).toMatch(/"total" > \$1/);
    expect(sql).toMatch(/"kind" = \$2/);
    expect(bindings).toEqual([10, "vip"]);
  });
});

describe("outer-join aliases", () => {
  it("delegates to the non-outer spelling", () => {
    const expected = {
      leftOuterJoin: "left join",
      rightOuterJoin: "right join",
      fullOuterJoin: "full join",
    } as const;

    for (const [method, fragment] of Object.entries(expected)) {
      const builder = builderFor("postgres").select("*") as unknown as Record<
        string,
        (...args: unknown[]) => { toSql: () => { sql: string } }
      >;
      const { sql } = builder[method]("orders", "user_id", "users.id").toSql();

      expect(sql).toContain(fragment);
    }
  });
});
