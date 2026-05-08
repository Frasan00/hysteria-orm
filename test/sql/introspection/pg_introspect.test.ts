import { SqlDataSource } from "../../../src/sql/sql_data_source";

describe("PostgreSQL introspection (scaffold)", () => {
  it("introspectSchema should return an array (scaffold)", async () => {
    // Create a dummy data source with minimal config to satisfy type checks
    const ds = new SqlDataSource({ type: "postgres" } as any);
    // Introspection is scaffolded; should resolve to an array
    const res = await ds.introspectSchema();
    expect(Array.isArray(res)).toBe(true);
  });
});
