/**
 * @jest-environment node
 *
 * Type-level suite: the assertions are the compile itself, since ts-jest
 * reports diagnostics — an unused `@ts-expect-error` fails the run, which is
 * what makes the negative cases real rather than decorative.
 */
import { SqlDataSource } from "../../src/sql/sql_data_source";
import type { SqlDataSourceInput } from "../../src/sql/sql_data_source_types";
import type { DriverAdapterFactory } from "../../src/drivers/driver_adapter_registry";

const factory = {
  name: "my-sqlite",
  dialects: ["sqlite"],
  create: () => ({}) as never,
} as DriverAdapterFactory<"sqlite">;

const expectExactly = <T>(_value: T): void => {};

describe("driver prop is discriminated by dialect and environment", () => {
  it("offers the node names under node and the bun names under bun", () => {
    const nodePg: SqlDataSourceInput<"postgres", {}, {}, "node"> = {
      type: "postgres",
      driver: "pg",
    };
    const bunPg: SqlDataSourceInput<"postgres", {}, {}, "bun"> = {
      type: "postgres",
      driver: "bun-sql",
    };
    const bunSqlite: SqlDataSourceInput<"sqlite", {}, {}, "bun"> = {
      type: "sqlite",
      database: ":memory:",
      driver: "bun-sqlite",
    };

    expectExactly<"pg">(nodePg.driver as "pg");
    expectExactly<"bun-sql">(bunPg.driver as "bun-sql");
    expectExactly<"bun-sqlite">(bunSqlite.driver as "bun-sqlite");
  });

  it("offers the web and react-native names in those environments", () => {
    const wasm: SqlDataSourceInput<"sqlite", {}, {}, "web"> = {
      type: "sqlite",
      // OPFS persistence is opt-in; ":memory:" is the sqlite special name.
      database: ":memory:",
      driver: "sqlite-wasm",
    };
    const rn: SqlDataSourceInput<"sqlite", {}, {}, "react-native"> = {
      type: "sqlite",
      database: "app.db",
      driver: "sqlite-rn",
    };

    expectExactly<"sqlite-wasm">(wasm.driver as "sqlite-wasm");
    expectExactly<"sqlite-rn">(rn.driver as "sqlite-rn");
  });

  it("omitting jsEnvironment resolves the driver names against node", () => {
    // "auto" must not be a separate, empty branch: a bare config still offers
    // the node names so `driver: "pg"` keeps compiling with no environment set.
    const auto: SqlDataSourceInput<"postgres"> = {
      type: "postgres",
      driver: "pg",
    };
    expectExactly<"pg">(auto.driver as "pg");
  });

  it("takes a factory directly as the driver value", () => {
    // No "custom" sentinel and no second prop: an object here *is* the custom
    // path, which also makes it the only way to fill a (dialect, env) pair that
    // has no builtin — postgres on web is `never` otherwise.
    const custom: SqlDataSourceInput<"postgres", {}, {}, "web"> = {
      type: "postgres",
      driver: factory as unknown as DriverAdapterFactory<"postgres">,
    };
    expectExactly<DriverAdapterFactory<"postgres">>(
      custom.driver as DriverAdapterFactory<"postgres">,
    );

    const sqlite: SqlDataSourceInput<"sqlite", {}, {}, "web"> = {
      type: "sqlite",
      database: ":memory:",
      driver: factory,
    };
    expectExactly<DriverAdapterFactory<"sqlite">>(
      sqlite.driver as DriverAdapterFactory<"sqlite">,
    );
  });

  it("infers the environment from the constructor call", () => {
    const sql = new SqlDataSource({
      type: "sqlite",
      database: ":memory:",
      jsEnvironment: "web",
      driver: "sqlite-wasm",
    });

    expectExactly<SqlDataSource<"sqlite", {}, {}, "web">>(sql);

    const custom = new SqlDataSource({
      type: "sqlite",
      database: ":memory:",
      jsEnvironment: "web",
      driver: factory,
    });
    expectExactly<SqlDataSource<"sqlite", {}, {}, "web">>(custom);
  });
});

describe("driver prop rejects what the environment cannot run", () => {
  it("rejects a string on a dialect/env pair that has no builtin", () => {
    const webPg: SqlDataSourceInput<"postgres", {}, {}, "web"> = {
      type: "postgres",
      // @ts-expect-error postgres has no web driver: the union is `never` here
      driver: "pg",
    };
    expectExactly<SqlDataSourceInput<"postgres", {}, {}, "web">>(webPg);
  });

  it("accepts any string through the third-party hatch", () => {
    // The `(string & {})` hatch keeps names registered via
    // registerDriverAdapter compiling, so it necessarily swallows wrong names
    // too: "bun-sqlite" on web is a runtime DriverNotFoundError, not a compile
    // error. Pinned here so the ceiling is explicit; the runtime half is in
    // resolver.test.ts.
    const wrongButString: SqlDataSourceInput<"sqlite", {}, {}, "web"> = {
      type: "sqlite",
      database: ":memory:",
      driver: "bun-sqlite",
    };
    expectExactly<SqlDataSourceInput<"sqlite", {}, {}, "web">>(wrongButString);
  });

  it("rejects a factory for a dialect it does not declare", () => {
    const wrong: SqlDataSourceInput<"postgres", {}, {}, "node"> = {
      type: "postgres",
      // @ts-expect-error the factory is DriverAdapterFactory<"sqlite">, not <"postgres">
      driver: factory,
    };
    expectExactly<SqlDataSourceInput<"postgres", {}, {}, "node">>(wrong);
  });

  it("rejects an object that is not a factory at all", () => {
    const wrong: SqlDataSourceInput<"sqlite", {}, {}, "web"> = {
      type: "sqlite",
      database: ":memory:",
      // @ts-expect-error a plain object is neither a known name nor a factory
      driver: { name: "my-sqlite" },
    };
    expectExactly<SqlDataSourceInput<"sqlite", {}, {}, "web">>(wrong);
  });
});
