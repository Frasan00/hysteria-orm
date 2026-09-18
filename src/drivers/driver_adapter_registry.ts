import type { ResolvedJsEnvironment } from "../platform/js_environment";
import type {
  AnySqlDataSourceInput,
  SqlDataSourceType,
} from "../sql/sql_data_source_types";
import { DriverNotFoundError } from "./driver_constants";
import type { DriverAdapter } from "./driver_adapter";

export interface DriverAdapterFactoryContext<D extends SqlDataSourceType> {
  readonly dialect: D;
  readonly jsEnvironment: ResolvedJsEnvironment;
  readonly input?: AnySqlDataSourceInput<D>;
}

export interface DriverAdapterFactory<
  D extends SqlDataSourceType = SqlDataSourceType,
> {
  readonly name: string;
  readonly dialects: readonly D[];
  /** JS runtimes this driver supports, defaults to ["node"] */
  readonly environments?: readonly ResolvedJsEnvironment[];
  create(
    context: DriverAdapterFactoryContext<D>,
  ): Promise<DriverAdapter<D>> | DriverAdapter<D>;
}

const factories: DriverAdapterFactory[] = [];

/**
 * @description Public plugin hook: future drivers (e.g. "mysql" replacing
 * "mysql2", a web/WASM sqlite) register here without touching the runtime.
 */
export const registerDriverAdapter = (factory: DriverAdapterFactory): void => {
  factories.push(factory);
};

/**
 * @description A factory passed as `driver` bypasses the registry and the
 * environment filter — the caller opted in explicitly. The dialect still has to
 * match. The `dialects` guard exists because the `(string & {})` hatch on
 * `driver` leaves JS callers free to pass any object; without it they'd get a
 * TypeError instead of a message.
 */
const resolveCustomDriver = async <D extends SqlDataSourceType>(
  dialect: D,
  factory: DriverAdapterFactory<D>,
  jsEnvironment: ResolvedJsEnvironment,
  input?: AnySqlDataSourceInput<D>,
): Promise<DriverAdapter<D>> => {
  if (!Array.isArray(factory?.dialects)) {
    throw new Error(
      `driver must be a registered driver name or a DriverAdapterFactory with a "dialects" array (got ${typeof factory}).`,
    );
  }

  if (!(factory.dialects as readonly string[]).includes(dialect)) {
    throw new Error(
      `driver "${factory.name}" does not support dialect "${dialect}" (declares: ${factory.dialects.join(", ")}).`,
    );
  }

  return factory.create({ dialect, jsEnvironment, input });
};

/**
 * @description Resolves a driver adapter for (dialect, environment). A factory
 * passed as `driver` wins outright. Otherwise an explicit driver name, or the
 * most specific (dialect, environment) match, falling back to the node
 * environment under bun only (e.g. bun + mssql → npm mssql).
 */
export const resolveDriverAdapter = async <D extends SqlDataSourceType>(
  dialect: D,
  jsEnvironment: ResolvedJsEnvironment,
  driver?: string | DriverAdapterFactory<D>,
  input?: AnySqlDataSourceInput<D>,
): Promise<DriverAdapter<D>> => {
  if (driver && typeof driver !== "string") {
    return resolveCustomDriver(dialect, driver, jsEnvironment, input);
  }

  const candidates = factories.filter((f) =>
    (f.dialects as readonly string[]).includes(dialect),
  );

  const supportsEnv = (f: DriverAdapterFactory, env: ResolvedJsEnvironment) =>
    (f.environments ?? (["node"] as const)).includes(env);

  // An explicit driver name must also support the resolved environment, so a
  // node runtime can't silently pick a bun-only driver (which would fail at
  // import).
  const matches = (f: DriverAdapterFactory, env: ResolvedJsEnvironment) =>
    (driver ? f.name === driver : true) && supportsEnv(f, env);

  const exact = candidates.find((f) => matches(f, jsEnvironment));
  if (exact) {
    return exact.create({ dialect, jsEnvironment, input }) as DriverAdapter<D>;
  }

  // npm drivers legitimately run under bun. Web and react-native must never
  // take this path — a node driver there fails at import on node builtins.
  if (jsEnvironment === "bun") {
    const nodeMatch = candidates.find((f) => matches(f, "node"));
    if (nodeMatch) {
      return nodeMatch.create({
        dialect,
        jsEnvironment,
        input,
      }) as DriverAdapter<D>;
    }
  }

  throw new DriverNotFoundError(driver ?? dialect);
};
