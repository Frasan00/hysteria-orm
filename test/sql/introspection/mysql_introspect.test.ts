import { SqlDataSource } from "../../../src/sql/sql_data_source";

describe("MySQL introspection (scaffold)", () => {
  it("introspectSchema should return an array (scaffold)", async () => {
    const ds = new SqlDataSource({ type: "mysql" } as any);
    const res = await ds.introspectSchema();
    expect(Array.isArray(res)).toBe(true);
  });
});
