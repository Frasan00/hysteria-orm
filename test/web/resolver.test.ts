/**
 * @jest-environment node
 *
 * Resolution is host-independent, so this runs in the node environment where the
 * real npm factories are registered.
 */
import {
  resolveDriverAdapter,
} from "../../src/drivers/driver_adapter_registry";
import { DriverNotFoundError } from "../../src/drivers/driver_constants";
import "../../src/drivers/adapters/node";
import { registerWebDrivers } from "../../src/drivers/adapters/web";

const input = (type: string, extra: Record<string, unknown> = {}) =>
  ({ type, database: ":memory:", ...extra }) as never;

describe("driver resolution across environments", () => {
  beforeAll(() => {
    registerWebDrivers();
  });

  it("resolves a web sqlite request to the wasm driver, not node sqlite3", async () => {
    const adapter = await resolveDriverAdapter(
      "sqlite",
      "web",
      undefined,
      input("sqlite"),
    );
    expect(adapter.dialect).toBe("sqlite");
    expect(adapter.jsEnvironment).toBe("web");
  });

  it("still resolves node sqlite3 for the node environment", async () => {
    const adapter = await resolveDriverAdapter(
      "sqlite",
      "node",
      undefined,
      input("sqlite"),
    );
    expect(adapter.jsEnvironment).toBe("node");
  });

  it("refuses a node-only dialect on web instead of silently falling back", async () => {
    await expect(resolveDriverAdapter("postgres", "web")).rejects.toThrow(
      DriverNotFoundError,
    );
    await expect(
      resolveDriverAdapter("postgres", "web", "pg"),
    ).rejects.toThrow(DriverNotFoundError);
  });

  it("refuses a node-only dialect on react-native", async () => {
    await expect(
      resolveDriverAdapter("postgres", "react-native"),
    ).rejects.toThrow(DriverNotFoundError);
  });

  it("falls back to the node factory under bun, as the docs promise", async () => {
    // No bun-native mssql driver exists; bun legitimately runs the npm one.
    // The adapter reports its own hardcoded environment, so resolving at all
    // under "bun" is what proves the fallback.
    const adapter = await resolveDriverAdapter(
      "mssql",
      "bun",
      undefined,
      input("mssql"),
    );
    expect(adapter.dialect).toBe("mssql");

    const named = await resolveDriverAdapter(
      "mssql",
      "bun",
      "mssql",
      input("mssql"),
    );
    expect(named.dialect).toBe("mssql");
  });

  it("refuses an explicit driver name that cannot run in the environment", async () => {
    await expect(
      resolveDriverAdapter("sqlite", "web", "sqlite3"),
    ).rejects.toThrow(DriverNotFoundError);
    await expect(
      resolveDriverAdapter("sqlite", "node", "sqlite-wasm"),
    ).rejects.toThrow(DriverNotFoundError);
  });
});

describe("driver resolution for inline factories", () => {
  const adapter = { dialect: "sqlite", jsEnvironment: "web" } as never;

  const customDriver = (
    name: string,
    dialects: string[],
    jsEnvironment = "web",
    seen?: Record<string, unknown>,
  ) =>
    ({
      name,
      dialects,
      create: (ctx: Record<string, unknown>) => {
        if (seen) Object.assign(seen, ctx);
        return { ...(adapter as object), jsEnvironment };
      },
    }) as never;

  it("takes the factory passed as `driver` and passes through the context", async () => {
    const seen: Record<string, unknown> = {};
    const factory = customDriver("my-sqlite", ["sqlite"], "web", seen);

    const resolved = await resolveDriverAdapter(
      "sqlite",
      "web",
      factory,
      input("sqlite"),
    );

    expect(resolved).toEqual(adapter);
    // The registry never rewrites the context: `jsEnvironment` stays the one
    // resolved from the host, and the input is handed over untouched.
    expect(seen.jsEnvironment).toBe("web");
    expect(seen.dialect).toBe("sqlite");
    expect(seen.input).toMatchObject({ type: "sqlite" });
  });

  it("skips environment filtering — the caller opted in explicitly", async () => {
    // Nothing registers postgres for web, so only an unfiltered path resolves.
    const resolved = await resolveDriverAdapter(
      "postgres",
      "web",
      customDriver("my-pg", ["postgres"]),
      input("postgres"),
    );
    expect(resolved).toEqual(adapter);
  });

  it("names the mismatch when the factory does not declare the dialect", async () => {
    await expect(
      resolveDriverAdapter(
        "sqlite",
        "web",
        customDriver("my-pg", ["postgres"]),
        input("sqlite"),
      ),
    ).rejects.toThrow(/my-pg.*does not support dialect "sqlite".*postgres/);
  });

  it("rejects an object that is not a factory", async () => {
    // JS callers reach this: the `(string & {})` hatch cannot stop them, and
    // without the guard they would get a TypeError out of `dialects.includes`.
    await expect(
      resolveDriverAdapter("sqlite", "web", { name: "nope" } as never),
    ).rejects.toThrow(/DriverAdapterFactory with a "dialects" array/);
  });
});
