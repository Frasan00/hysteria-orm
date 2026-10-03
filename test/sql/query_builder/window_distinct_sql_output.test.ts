/**
 * DB-free tests for distinct aggregates and window functions (rank, denseRank,
 * rowNumber) across dialects.
 */

import { defineModel, col } from "../../../src/sql/models/define_model";
import { QueryBuilder } from "../../../src/sql/query_builder/query_builder";
import { SqlDataSource } from "../../../src/sql/sql_data_source";
import type { SqlDataSourceType } from "../../../src/sql/sql_data_source_types";

const Users = defineModel("users", {
  columns: {
    id: col.increment(),
    age: col.integer(),
    status: col.string(),
    teamId: col.integer(),
  },
});

const stub = (dbType: SqlDataSourceType) =>
  ({ getDbType: () => dbType }) as unknown as SqlDataSource;

const builderFor = <D extends SqlDataSourceType>(dbType: D) =>
  new QueryBuilder<any, Record<string, any>, D>(Users, stub(dbType));

describe("distinct aggregates", () => {
  it("renders count/sum/avg DISTINCT per dialect", () => {
    const pg = builderFor("postgres")
      .countDistinct("status", "c")
      .sumDistinct("age", "s")
      .avgDistinct("age", "a")
      .toSql().sql;
    expect(pg).toContain(`count(DISTINCT "status") as "c"`);
    expect(pg).toContain(`sum(DISTINCT "age") as "s"`);
    expect(pg).toContain(`avg(DISTINCT "age") as "a"`);

    expect(
      builderFor("mysql").countDistinct("status", "c").toSql().sql,
    ).toContain("count(DISTINCT `status`) as `c`");

    expect(builderFor("sqlite").countDistinct("status").toSql().sql).toContain(
      `count(DISTINCT "status")`,
    );

    expect(builderFor("mssql").countDistinct("status").toSql().sql).toContain(
      "count(DISTINCT [status])",
    );
  });

  it("keeps aliases optional", () => {
    expect(
      builderFor("postgres").countDistinct("status").toSql().sql,
    ).toContain(`count(DISTINCT "status")`);
  });
});

describe("window functions", () => {
  it("renders row_number with partition and order", () => {
    const sql = builderFor("postgres")
      .select("id")
      .rowNumber("rn", {
        partitionBy: "teamId",
        orderBy: { column: "age", order: "desc" },
      })
      .toSql().sql;

    expect(sql).toContain(
      `(row_number() over (partition by "team_id" order by "age" desc)) as "rn"`,
    );
  });

  it("renders rank with only order by", () => {
    expect(
      builderFor("mysql").select("id").rank("r", { orderBy: "age" }).toSql()
        .sql,
    ).toContain("(rank() over (order by `age`)) as `r`");
  });

  it("renders dense_rank with a mixed order-by array", () => {
    const sql = builderFor("mssql")
      .denseRank("dr", {
        orderBy: ["age", { column: "teamId", order: "desc" }],
      })
      .toSql().sql;

    expect(sql).toContain(
      "(dense_rank() over (order by [age], [team_id] desc)) as [dr]",
    );
  });

  it("supports multiple partition columns and no alias", () => {
    const sql = builderFor("postgres")
      .rowNumber(undefined, {
        partitionBy: ["teamId", "status"],
        orderBy: "age",
      })
      .toSql().sql;

    expect(sql).toContain(
      `(row_number() over (partition by "team_id", "status" order by "age"))`,
    );
    expect(sql).not.toContain(` as "undefined"`);
  });
});
