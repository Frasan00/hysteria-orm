/**
 * DB-free tests for the widenings of the write path: multi-table update/delete on
 * the mysql family, `updateFrom`, `deleteUsing`, the `update(column, value)` form and
 * `batchInsert`. SQL and bindings are asserted per dialect; nothing here needs a
 * database.
 */

import { RawNode } from "../../../src/sql/ast/query/node/raw/raw_node";
import { col, defineModel } from "../../../src/sql/models/define_model";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const Users = defineModel("users", {
  columns: {
    id: col.increment(),
    name: col.text(),
    email: col.text(),
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

/** Collapses the renderer's cosmetic double spaces so dialect assertions stay readable. */
const sqlOf = (operation: {
  toSql: () => { sql: string; bindings?: any[] };
}): string => operation.toSql().sql.replace(/\s+/g, " ").trim();

const unwrapOf = (operation: any) =>
  operation.unWrap() as { sql: string; bindings: any[] };

const MYSQL_FAMILY = ["mysql", "mariadb"] as const;
const NON_MYSQL = ["postgres", "mssql", "sqlite"] as const;

describe("multi-table update and delete", () => {
  it("places the join between the table and set on the mysql family", () => {
    for (const dbType of MYSQL_FAMILY) {
      const { sql, bindings } = unwrapOf(
        builderFor(dbType)
          .innerJoin("orders", "orders.user_id", "users.id")
          .where("orders.total", ">", 10)
          .update({ name: "John" }),
      );

      expect(sql.replace(/\s+/g, " ").trim()).toBe(
        "update `users` inner join `orders` on `orders`.`user_id` = `users`.`id` set `name` = ? where `orders`.`total` > ?",
      );
      expect(bindings).toEqual(["John", 10]);
    }
  });

  it("repeats the target table for a mysql multi-table delete", () => {
    for (const dbType of MYSQL_FAMILY) {
      const { sql } = unwrapOf(
        builderFor(dbType)
          .innerJoin("orders", "orders.user_id", "users.id")
          .where("orders.total", ">", 10)
          .delete(),
      );

      expect(sql.replace(/\s+/g, " ").trim()).toBe(
        "delete `users` from `users` inner join `orders` on `orders`.`user_id` = `users`.`id` where `orders`.`total` > ?",
      );
    }
  });

  it("keeps a joinless delete byte-identical across dialects", () => {
    expect(sqlOf(builderFor("mysql").where("id", 1).delete())).toBe(
      "delete from `users` where `id` = ?",
    );
    expect(sqlOf(builderFor("mariadb").where("id", 1).delete())).toBe(
      "delete from `users` where `id` = ?",
    );
    expect(sqlOf(builderFor("postgres").where("id", 1).delete())).toBe(
      'delete from "users" where "id" = $1',
    );
    expect(sqlOf(builderFor("mssql").where("id", 1).delete())).toBe(
      "delete from [users] where [id] = @1",
    );
    expect(sqlOf(builderFor("sqlite").where("id", 1).delete())).toBe(
      'delete from "users" where "id" = ?',
    );
  });

  it("keeps a joinless update byte-identical across dialects", () => {
    const expected: Record<string, string> = {
      mysql: "update `users` set `name` = ? where `id` = ?",
      mariadb: "update `users` set `name` = ? where `id` = ?",
      postgres: 'update "users" set "name" = $1 where "id" = $2',
      mssql: "update [users] set [name] = @1 where [id] = @2",
      sqlite: 'update "users" set "name" = ? where "id" = ?',
    };

    for (const [dbType, expectedSql] of Object.entries(expected)) {
      expect(
        sqlOf(
          builderFor(dbType as SqlDataSourceType)
            .where("id", 1)
            .update({ name: "John" }),
        ),
      ).toBe(expectedSql);
    }
  });

  it("keeps mysql's order by and limit alongside the join", () => {
    expect(
      sqlOf(
        builderFor("mysql")
          .innerJoin("orders", "orders.user_id", "users.id")
          .orderBy("users.id", "desc")
          .limit(2)
          .delete(),
      ),
    ).toBe(
      "delete `users` from `users` inner join `orders` on `orders`.`user_id` = `users`.`id` order by `users`.`id` desc limit ?",
    );
  });
});

describe("updateFrom()", () => {
  it("renders `update ... from` on postgres and mssql", () => {
    expect(
      sqlOf(
        builderFor("postgres").updateFrom("orders").update({ name: "John" }),
      ),
    ).toBe('update "users" set "name" = $1 from "orders"');
    expect(
      sqlOf(builderFor("mssql").updateFrom("orders").update({ name: "John" })),
    ).toBe("update [users] set [name] = @1 from [orders]");
  });

  it("keeps the source alias", () => {
    expect(
      sqlOf(
        builderFor("postgres")
          .updateFrom("orders", "o")
          .update({ name: "John" }),
      ),
    ).toBe('update "users" set "name" = $1 from "orders" as o');
  });

  it("numbers bindings across the source, the set and the where", () => {
    const { sql, bindings } = unwrapOf(
      builderFor("postgres")
        .updateFrom(
          (qb: any) =>
            qb.select("user_id").fromRaw("orders").where("total", ">", 5),
          "o",
        )
        .where("name", "Jane")
        .update({ name: "John" }),
    );

    expect(sql.replace(/\s+/g, " ").trim()).toBe(
      'update "users" set "name" = $1 from (select "user_id" from orders where "total" > $2) as o where "name" = $3',
    );
    expect(bindings).toEqual(["John", 5, "Jane"]);
  });

  it("requires an alias for a subquery source", () => {
    expect(() =>
      builderFor("postgres")
        .updateFrom((qb: any) => qb.select("id") as any, "")
        .toSql(),
    ).toThrow(/MISSING_ALIAS_FOR_SUBQUERY/);
  });

  it("rejects the mysql family and sqlite", () => {
    for (const dbType of [...MYSQL_FAMILY, "sqlite"] as const) {
      expect(() => builderFor(dbType).updateFrom("orders")).toThrow(
        /UPDATE_FROM_NOT_SUPPORTED/,
      );
    }
  });

  it("matches postgres on cockroachdb", () => {
    expect(
      sqlOf(
        builderFor("cockroachdb").updateFrom("orders").update({ name: "J" }),
      ),
    ).toBe('update "users" set "name" = $1 from "orders"');
  });
});

describe("deleteUsing()", () => {
  it("renders `delete ... using` on postgres", () => {
    const { sql } = unwrapOf(
      builderFor("postgres").deleteUsing("orders").where("id", 1).delete(),
    );

    expect(sql.replace(/\s+/g, " ").trim()).toBe(
      'delete from "users" using "orders" where "id" = $1',
    );
  });

  it("numbers bindings across the source and the where", () => {
    const { sql, bindings } = unwrapOf(
      builderFor("postgres")
        .deleteUsing(
          (qb: any) =>
            qb.select("user_id").fromRaw("orders").where("total", ">", 5),
          "o",
        )
        .where("name", "Jane")
        .delete(),
    );

    expect(sql.replace(/\s+/g, " ").trim()).toBe(
      'delete from "users" using (select "user_id" from orders where "total" > $1) as o where "name" = $2',
    );
    expect(bindings).toEqual([5, "Jane"]);
  });

  it("rejects every dialect that has no `using` clause", () => {
    for (const dbType of [...MYSQL_FAMILY, "mssql", "sqlite"] as const) {
      expect(() => builderFor(dbType).deleteUsing("orders")).toThrow(
        /DELETE_USING_NOT_SUPPORTED/,
      );
    }
  });
});

describe("update(column, value)", () => {
  it("renders the same statement as the object form", () => {
    for (const dbType of ["postgres", "mysql", "mssql", "sqlite"] as const) {
      const byPair = sqlOf(
        builderFor(dbType).where("id", 1).update("name", "John"),
      );
      const byObject = sqlOf(
        builderFor(dbType).where("id", 1).update({ name: "John" }),
      );

      expect(byPair).toBe(byObject);
    }
  });

  it("accepts a raw node as the value", () => {
    expect(
      sqlOf(
        builderFor("postgres")
          .where("id", 1)
          .update("name", new RawNode('"users"."email"') as any),
      ),
    ).toBe('update "users" set "name" = "users"."email" where "id" = $1');
  });

  it("still accepts the bare object form", () => {
    expect(sqlOf(builderFor("postgres").update({ name: "John" }))).toBe(
      'update "users" set "name" = $1',
    );
  });
});

describe("batchInsert()", () => {
  it("returns an empty list for an empty batch without touching the data source", async () => {
    await expect(builderFor("postgres").batchInsert([])).resolves.toEqual([]);
  });

  it("rejects a chunk size that is not a positive integer", async () => {
    for (const chunkSize of [0, -1, 1.5, Number.NaN]) {
      await expect(
        builderFor("postgres").batchInsert([{ name: "John" }], { chunkSize }),
      ).rejects.toThrow(/INVALID_BATCH_SIZE/);
    }
  });
});
