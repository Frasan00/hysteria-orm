import { SqlDataSource } from "../../../src/sql/sql_data_source";

describe("SQLite introspection (scaffold)", () => {
  it("introspectSchema should return an array (scaffold)", async () => {
    const ds = new SqlDataSource({ type: "sqlite" } as any);
    const res = await ds.introspectSchema();
    expect(Array.isArray(res)).toBe(true);
  });
});
