/**
 * DB-free tests for the scope-4 additions: Postgres lock strengths and JSON
 * mutation expressions used as update values.
 */

import { defineModel, col } from "../../../src/sql/models/define_model";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";
import {
  jsonInsert,
  jsonRemove,
  jsonSet,
  normalizeJsonPath,
  toJsonPathString,
  toPgTextArray,
} from "../../../src/sql/ast/query/node/json_mutation";

const Users = defineModel("users", {
  columns: {
    id: col.increment(),
    age: col.integer(),
    meta: col.json(),
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

describe("forNoKeyUpdate() / forKeyShare()", () => {
  it("renders the Postgres lock strengths", () => {
    expect(builderFor("postgres").forNoKeyUpdate().toSql().sql).toContain(
      "for no key update",
    );
    expect(builderFor("postgres").forKeyShare().toSql().sql).toContain(
      "for key share",
    );
  });

  it("supports skipLocked and noWait", () => {
    const sql = builderFor("postgres")
      .forNoKeyUpdate({ skipLocked: true, noWait: true })
      .toSql().sql;
    expect(sql).toContain("for no key update skip locked nowait");
  });

  it("throws outside postgres", () => {
    expect(() => builderFor("mysql").forNoKeyUpdate()).toThrow(
      /LOCK_STRENGTH_NOT_SUPPORTED_IN_MYSQL/,
    );
    expect(() => builderFor("mssql").forKeyShare()).toThrow(
      /LOCK_STRENGTH_NOT_SUPPORTED_IN_MSSQL/,
    );
  });
});

describe("JSON path helpers", () => {
  it("normalizes string and array paths", () => {
    expect(normalizeJsonPath("$.a.b[2].c")).toEqual(["a", "b", 2, "c"]);
    expect(normalizeJsonPath(["a", 0])).toEqual(["a", 0]);
  });

  it("renders JsonPath and Postgres text[] forms", () => {
    expect(toJsonPathString("$.a.b[0]")).toBe("$.a.b[0]");
    expect(toJsonPathString(["a", 0, "b-c"])).toBe('$.a[0]["b-c"]');
    expect(toPgTextArray("$.a.b[0]")).toBe("'{a,b,0}'");
    expect(toPgTextArray(["a", 0])).toBe("'{a,0}'");
  });
});

describe("JSON mutation update values", () => {
  it("renders jsonSet per dialect", () => {
    expect(
      builderFor("postgres")
        .update({ meta: jsonSet("meta", "$.a.b", { x: 1 }) as any })
        .toSql().sql,
    ).toContain(`jsonb_set("meta", '{a,b}', $1::jsonb, true)`);

    expect(
      builderFor("mysql")
        .update({ meta: jsonSet("meta", "$.a", 1) as any })
        .toSql().sql,
    ).toContain("JSON_SET(`meta`, '$.a', ?)");

    expect(
      builderFor("sqlite")
        .update({ meta: jsonSet("meta", "$.a", 1) as any })
        .toSql().sql,
    ).toContain(`json_set("meta", '$.a', ?)`);

    expect(
      builderFor("mssql")
        .update({ meta: jsonSet("meta", "$.a", 1) as any })
        .toSql().sql,
    ).toContain("JSON_MODIFY([meta], '$.a', @1)");
  });

  it("renders jsonInsert per dialect", () => {
    const pgSql = builderFor("postgres")
      .update({ meta: jsonInsert("meta", ["a"], 5) as any })
      .toSql().sql;
    expect(pgSql).toContain(`CASE WHEN "meta" #> '{a}' IS NULL`);
    expect(pgSql).toContain(`jsonb_set("meta", '{a}', $1::jsonb, true)`);

    expect(
      builderFor("mysql")
        .update({ meta: jsonInsert("meta", "$.a", 5) as any })
        .toSql().sql,
    ).toContain("JSON_INSERT(`meta`, '$.a', ?)");
  });

  it("renders jsonRemove per dialect", () => {
    expect(
      builderFor("postgres")
        .update({ meta: jsonRemove("meta", "$.a") as any })
        .toSql().sql,
    ).toContain(`"meta" #- '{a}'`);

    expect(
      builderFor("mysql")
        .update({ meta: jsonRemove("meta", "$.a") as any })
        .toSql().sql,
    ).toContain("JSON_REMOVE(`meta`, '$.a')");

    expect(
      builderFor("sqlite")
        .update({ meta: jsonRemove("meta", "$.a") as any })
        .toSql().sql,
    ).toContain(`json_remove("meta", '$.a')`);
  });

  it("keeps parameter order when mixed with plain columns", () => {
    const { sql, bindings } = builderFor("postgres")
      .update({
        age: 30,
        meta: jsonSet("meta", "$.a", 1) as any,
      })
      .toSql();

    expect(sql).toContain('"age" = $1');
    expect(sql).toContain("$2::jsonb");
    expect(bindings).toEqual([30, "1"]);
  });

  it("rejects jsonInsert / jsonRemove on mssql", () => {
    expect(() =>
      builderFor("mssql")
        .update({ meta: jsonInsert("meta", "$.a", 1) as any })
        .toSql(),
    ).toThrow(/NOT_SUPPORTED_IN_MSSQL/);

    expect(() =>
      builderFor("mssql")
        .update({ meta: jsonRemove("meta", "$.a") as any })
        .toSql(),
    ).toThrow(/NOT_SUPPORTED_IN_MSSQL/);
  });
});
